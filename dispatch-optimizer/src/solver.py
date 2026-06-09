"""VROOM problem builder and solver.

``build_problem`` translates domain ``Technician``/``Job`` lists plus a duration
matrix into a VROOM ``Input`` (the "problem builder" the spec calls for). Techs
become vehicles, jobs become stops; skills, time windows, durations, and work
hours map onto VROOM's native constraints, so skill mismatches and infeasible
windows are dropped by the solver rather than scored away.

If pyvroom is not importable (e.g. a C++-toolchain-less box), the module falls
back to a greedy nearest-insertion heuristic so the service and tests still run.
The active backend is reported by :func:`backend_name`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from time import perf_counter
from typing import Optional, Sequence

from .distance import MatrixResult
from .models import PRIORITY_RANK, Job, JobPriority, Technician

try:
    import numpy as np
    import vroom

    _HAVE_VROOM = True
except Exception:  # pragma: no cover - exercised only on boxes without the wheel
    _HAVE_VROOM = False


def backend_name() -> str:
    return "vroom" if _HAVE_VROOM else "greedy-fallback"


@dataclass
class RouteStop:
    job_id: str
    arrival_min: float
    drive_time_min: float


@dataclass
class TechRoute:
    tech_id: str
    stops: list[RouteStop] = field(default_factory=list)

    @property
    def total_drive_min(self) -> float:
        return sum(s.drive_time_min for s in self.stops)

    @property
    def total_service_min(self) -> float:
        # Reconstructed by the caller when needed; kept simple here.
        return 0.0


@dataclass
class SolverSolution:
    routes: list[TechRoute]
    unassigned_job_ids: list[str]
    solve_time_ms: int
    backend: str = field(default_factory=backend_name)

    def drive_times(self) -> dict[str, float]:
        """job_id -> drive time (minutes) of the leg that reaches it."""
        out: dict[str, float] = {}
        for route in self.routes:
            for stop in route.stops:
                out[stop.job_id] = stop.drive_time_min
        return out

    def job_to_tech(self) -> dict[str, str]:
        out: dict[str, str] = {}
        for route in self.routes:
            for stop in route.stops:
                out[stop.job_id] = route.tech_id
        return out


@dataclass
class Problem:
    """The built problem plus the index/id maps needed to read a solution back."""

    techs: list[Technician]
    jobs: list[Job]
    durations_min: list[list[int]]  # full matrix over [tech locs..., job locs...]
    skill_map: dict[str, int]
    tech_loc_index: dict[str, int]
    job_loc_index: dict[str, int]
    vroom_input: object = None


def _skill_map(techs: Sequence[Technician], jobs: Sequence[Job]) -> dict[str, int]:
    skills: set[str] = set()
    for t in techs:
        skills |= t.skill_ids
    for j in jobs:
        skills |= j.required_skill_ids
    return {s: i + 1 for i, s in enumerate(sorted(skills))}


def build_problem(
    techs: Sequence[Technician],
    jobs: Sequence[Job],
    matrix: MatrixResult,
) -> Problem:
    """Build a VROOM problem from techs, jobs, and a duration matrix.

    The matrix is laid out over locations in order: tech start locations first
    (index 0..T-1), then job locations (index T..T+J-1). ``matrix.durations`` is
    in seconds; VROOM consumes seconds directly.
    """
    techs = list(techs)
    jobs = list(jobs)
    n_tech = len(techs)

    tech_loc_index = {t.id: i for i, t in enumerate(techs)}
    job_loc_index = {j.id: n_tech + i for i, j in enumerate(jobs)}
    skill_map = _skill_map(techs, jobs)

    durations_min = [
        [int(round(c / 60)) for c in row] for row in matrix.durations
    ]

    problem = Problem(
        techs=techs,
        jobs=jobs,
        durations_min=durations_min,
        skill_map=skill_map,
        tech_loc_index=tech_loc_index,
        job_loc_index=job_loc_index,
    )

    if not _HAVE_VROOM:
        return problem

    vinp = vroom.Input()
    dur = np.array(matrix.durations, dtype=np.uint32)
    vinp.set_durations_matrix("car", dur)

    for idx, t in enumerate(techs):
        loc = tech_loc_index[t.id]
        skills = {skill_map[s] for s in t.skill_ids if s in skill_map}
        vinp.add_vehicle(
            vroom.Vehicle(
                id=idx,
                start=loc,
                end=loc,
                profile="car",
                skills=skills or None,
                time_window=vroom.TimeWindow(
                    t.work_start_min * 60, t.work_end_min * 60
                ),
            )
        )

    for jdx, j in enumerate(jobs):
        loc = job_loc_index[j.id]
        req = {skill_map[s] for s in j.required_skill_ids if s in skill_map}
        w_start, w_end = j.window()
        vinp.add_job(
            vroom.Job(
                id=jdx,
                location=loc,
                default_service=j.duration_min * 60,
                skills=req or None,
                priority=PRIORITY_RANK.get(j.priority, 30),
                time_windows=[vroom.TimeWindow(w_start * 60, w_end * 60)],
            )
        )

    problem.vroom_input = vinp
    return problem


def _adaptive_exploration(n_jobs: int) -> int:
    """Trade search depth against wall-clock as the problem grows.

    VROOM's exploration_level dominates solve time on large instances (level 5 is
    ~2.2s for 200 jobs, level 2 ~0.5s) while barely changing solution quality
    once the problem is capacity-bound. Small problems stay at the most thorough
    level since they solve in tens of milliseconds regardless.
    """
    if n_jobs <= 60:
        return 5
    if n_jobs <= 120:
        return 3
    return 2


def solve(
    problem: Problem,
    exploration_level: Optional[int] = None,
    threads: int = 4,
) -> SolverSolution:
    """Solve the routing problem, returning per-tech routes + unassigned jobs."""
    if exploration_level is None:
        exploration_level = _adaptive_exploration(len(problem.jobs))
    if _HAVE_VROOM and problem.vroom_input is not None:
        return _solve_vroom(problem, exploration_level, threads)
    return _solve_greedy(problem)


def _solve_vroom(problem: Problem, exploration_level: int, threads: int) -> SolverSolution:
    t0 = perf_counter()
    sol = problem.vroom_input.solve(exploration_level=exploration_level, nb_threads=threads)
    elapsed = int((perf_counter() - t0) * 1000)

    techs = problem.techs
    jobs = problem.jobs
    dur = problem.durations_min

    routes: dict[str, TechRoute] = {}
    df = sol.routes
    # Iterate the route table per vehicle in order, tracking the previous
    # location index to recover each leg's drive time from our own matrix.
    prev_loc: dict[int, int] = {}
    for _, row in df.iterrows():
        vid = int(row["vehicle_id"])
        rtype = row["type"]
        tech = techs[vid]
        route = routes.setdefault(tech.id, TechRoute(tech_id=tech.id))
        loc_idx = int(row["location_index"])
        if rtype == "start":
            prev_loc[vid] = loc_idx
            continue
        if rtype == "end":
            continue
        if rtype == "job":
            jid = int(row["id"])
            job = jobs[jid]
            p = prev_loc.get(vid, problem.tech_loc_index[tech.id])
            drive = dur[p][loc_idx]
            arrival = float(row["arrival"]) / 60.0
            route.stops.append(
                RouteStop(job_id=job.id, arrival_min=arrival, drive_time_min=float(drive))
            )
            prev_loc[vid] = loc_idx

    assigned = {s.job_id for r in routes.values() for s in r.stops}
    unassigned = [j.id for j in jobs if j.id not in assigned]
    return SolverSolution(
        routes=list(routes.values()),
        unassigned_job_ids=unassigned,
        solve_time_ms=elapsed,
    )


def _solve_greedy(problem: Problem) -> SolverSolution:
    """Fallback heuristic: greedy nearest-feasible insertion.

    Used only when pyvroom is unavailable. Honors skills, time windows, and work
    hours so the service stays correct (if not optimal) without the C++ solver.
    """
    t0 = perf_counter()
    techs = problem.techs
    jobs = sorted(
        problem.jobs,
        key=lambda j: PRIORITY_RANK.get(j.priority, 30),
        reverse=True,
    )
    dur = problem.durations_min
    tloc = problem.tech_loc_index
    jloc = problem.job_loc_index

    # Mutable per-tech state: current clock (min) and current location index.
    clock = {t.id: t.work_start_min for t in techs}
    cur_loc = {t.id: tloc[t.id] for t in techs}
    routes: dict[str, TechRoute] = {t.id: TechRoute(tech_id=t.id) for t in techs}
    unassigned: list[str] = []

    for job in jobs:
        w_start, w_end = job.window()
        best_tech = None
        best_arrival = None
        best_drive = None
        for t in techs:
            if not job.required_skill_ids.issubset(t.skill_ids):
                continue
            drive = dur[cur_loc[t.id]][jloc[job.id]]
            arrival = max(clock[t.id] + drive, w_start)
            finish = arrival + job.duration_min
            if arrival > w_end or finish > t.work_end_min:
                continue
            if best_arrival is None or arrival < best_arrival:
                best_tech, best_arrival, best_drive = t, arrival, drive
        if best_tech is None:
            unassigned.append(job.id)
            continue
        routes[best_tech.id].stops.append(
            RouteStop(job_id=job.id, arrival_min=float(best_arrival), drive_time_min=float(best_drive))
        )
        clock[best_tech.id] = best_arrival + job.duration_min
        cur_loc[best_tech.id] = jloc[job.id]

    elapsed = int((perf_counter() - t0) * 1000)
    return SolverSolution(
        routes=[r for r in routes.values() if r.stops],
        unassigned_job_ids=unassigned,
        solve_time_ms=elapsed,
    )
