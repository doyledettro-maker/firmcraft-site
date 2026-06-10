"""Dispatch orchestration — the pure compute layer.

Ties the distance matrix, VROOM solver, and scoring engine together into the
four dispatch operations: full-day optimize, single-job suggest, emergency
dispatch, and tech reassignment. Everything here is side-effect free and
DB-agnostic: it takes domain objects + a ``DistanceProvider`` and returns
result models. The FastAPI layer (``main.py``) handles Supabase reads, the
``dispatch_logs`` write, and the mode-specific DB side effects.
"""

from __future__ import annotations

from time import perf_counter
from typing import Optional, Sequence

from .distance import DistanceProvider, MatrixResult
from .models import (
    Assignment,
    DispatchMode,
    EmergencyCandidate,
    EmergencyResult,
    Job,
    JobCandidates,
    OptimizationResult,
    OptimizationWeights,
    PRIORITY_RANK,
    ScoreBreakdown,
    Technician,
)
from .scoring import build_context, rank_candidates, score_one
from .solver import build_problem, solve


def _points(techs: Sequence[Technician], jobs: Sequence[Job]) -> list[tuple[float, float]]:
    return [t.location.as_tuple() for t in techs] + [j.location.as_tuple() for j in jobs]


async def optimize(
    techs: Sequence[Technician],
    jobs: Sequence[Job],
    weights: OptimizationWeights,
    mode: DispatchMode,
    provider: DistanceProvider,
) -> OptimizationResult:
    """Full-day optimization: solve with VROOM, score the chosen assignments."""
    techs = list(techs)
    jobs = list(jobs)
    if not techs or not jobs:
        return OptimizationResult(mode=mode, assignments=[], unassigned_job_ids=[j.id for j in jobs])

    matrix = await provider.matrix(_points(techs, jobs))
    problem = build_problem(techs, jobs, matrix)
    solution = solve(problem)

    drive_times = solution.drive_times()
    arrivals = solution.arrivals()
    job_to_tech = solution.job_to_tech()
    tech_by_id = {t.id: t for t in techs}
    ctx = build_context(techs, jobs, drive_min=max(drive_times.values(), default=0.0))

    assignments: list[Assignment] = []
    for job in jobs:
        tid = job_to_tech.get(job.id)
        if not tid:
            continue
        tech = tech_by_id[tid]
        drive = drive_times.get(job.id, ctx.max_drive_min)
        b = score_one(job, tech, drive, weights, ctx)
        arrival = arrivals.get(job.id)
        assignments.append(
            Assignment(
                job_id=job.id,
                tech_id=tech.id,
                tech_name=tech.name,
                score=b.total,
                drive_time_min=round(drive, 2),
                breakdown=b,
                reason=f"{round(drive)} min drive, {tech.name}",
                arrival_min=round(arrival, 2) if arrival is not None else None,
                duration_min=job.duration_min,
            )
        )

    assignments.sort(key=lambda a: a.score, reverse=True)
    return OptimizationResult(
        mode=mode,
        assignments=assignments,
        unassigned_job_ids=solution.unassigned_job_ids,
        solve_time_ms=solution.solve_time_ms,
        total_drive_time_min=round(sum(a.drive_time_min for a in assignments), 2),
    )


async def suggest(
    job: Job,
    techs: Sequence[Technician],
    weights: OptimizationWeights,
    provider: DistanceProvider,
    top_n: int = 3,
) -> JobCandidates:
    """Rank techs for a single job by the tech→job drive plus business factors."""
    techs = list(techs)
    if not techs:
        return JobCandidates(job_id=job.id, candidates=[])

    # Matrix over tech locations + this one job; tech→job legs are row[i][last].
    matrix = await provider.matrix(_points(techs, [job]))
    job_idx = len(techs)
    drive_times = {
        t.id: matrix.durations[i][job_idx] / 60.0 for i, t in enumerate(techs)
    }
    ctx = build_context(techs, [job], drive_min=max(drive_times.values(), default=0.0))
    candidates = rank_candidates(job, techs, drive_times, weights, ctx, top_n=top_n)
    return JobCandidates(job_id=job.id, candidates=candidates)


async def emergency(
    job: Job,
    techs: Sequence[Technician],
    weights: OptimizationWeights,
    provider: DistanceProvider,
    existing_jobs: Optional[dict[str, list[Job]]] = None,
) -> EmergencyResult:
    """Find the nearest qualified tech for an emergency, with disruption cost.

    Disruption cost balances getting there fast against the value of the work
    each candidate would have to defer: drive time plus the emergency's own
    duration multiplied by the priority weight of the jobs it displaces.
    """
    t0 = perf_counter()
    existing_jobs = existing_jobs or {}
    techs = list(techs)

    qualified = [t for t in techs if job.required_skill_ids.issubset(t.skill_ids)]
    if not qualified:
        return EmergencyResult(
            job_id=job.id, chosen=None, candidates=[],
            solve_time_ms=int((perf_counter() - t0) * 1000),
        )

    matrix = await provider.matrix(_points(qualified, [job]))
    job_idx = len(qualified)
    drive_times = {
        t.id: matrix.durations[i][job_idx] / 60.0 for i, t in enumerate(qualified)
    }
    ctx = build_context(qualified, [job], drive_min=max(drive_times.values(), default=0.0))

    candidates: list[EmergencyCandidate] = []
    for tech in qualified:
        drive = drive_times[tech.id]
        displaced = existing_jobs.get(tech.id, [])
        # Priority-weighted cost of deferring this tech's remaining work.
        defer = sum(PRIORITY_RANK.get(j.priority, 30) / 30.0 for j in displaced)
        disruption = drive + (job.duration_min / 60.0) * defer
        b = score_one(job, tech, drive, weights, ctx)
        candidates.append(
            EmergencyCandidate(
                tech_id=tech.id,
                tech_name=tech.name,
                drive_time_min=round(drive, 2),
                disruption_cost=round(disruption, 2),
                displaced_job_ids=[j.id for j in displaced],
                score=b.total,
                reason=(
                    f"{round(drive)} min away, "
                    f"{len(displaced)} job(s) to reschedule"
                ),
            )
        )

    # Nearest first, then least disruptive — gets a qualified tech rolling fast.
    candidates.sort(key=lambda c: (c.drive_time_min, c.disruption_cost))
    return EmergencyResult(
        job_id=job.id,
        chosen=candidates[0] if candidates else None,
        candidates=candidates,
        solve_time_ms=int((perf_counter() - t0) * 1000),
    )


async def reassign(
    tech_id: str,
    all_techs: Sequence[Technician],
    tech_jobs: Sequence[Job],
    weights: OptimizationWeights,
    mode: DispatchMode,
    provider: DistanceProvider,
) -> OptimizationResult:
    """Redistribute one tech's jobs across the remaining techs optimally."""
    others = [t for t in all_techs if t.id != tech_id]
    jobs = list(tech_jobs)
    if not others or not jobs:
        return OptimizationResult(
            mode=mode, assignments=[], unassigned_job_ids=[j.id for j in jobs]
        )
    # Clear the stale assignment so the solver treats them as open work.
    for j in jobs:
        j.technician_id = None
    return await optimize(others, jobs, weights, mode, provider)
