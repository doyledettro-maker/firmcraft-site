"""Multi-objective scoring engine.

VROOM optimizes for drive time. The scorer layers business factors on top, so a
contractor can bias dispatch toward revenue, fairness, or customer preference by
editing weights — without touching the solver. Each dimension is normalized to
0-1, multiplied by its weight, and summed; the total is divided by the weight
sum so any weight configuration yields a comparable 0-1 score.

Dimensions (default weights):
  drive_time 0.30 · skill_match 0.20 · revenue 0.25 · workload 0.15 · pref 0.10
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional, Sequence

from .models import (
    Assignment,
    Job,
    OptimizationWeights,
    ScoreBreakdown,
    Technician,
)

PROFICIENCY_LEVEL = {"apprentice": 0.4, "standard": 0.7, "expert": 1.0}


@dataclass
class ScoringContext:
    """Normalization constants derived from the candidate set."""

    max_drive_min: float = 60.0
    max_avg_ticket: float = 1.0
    max_revenue: float = 1.0


def build_context(
    techs: Sequence[Technician],
    jobs: Sequence[Job],
    drive_min: Optional[float] = None,
) -> ScoringContext:
    max_avg = max((t.historical_avg_ticket for t in techs), default=0.0)
    max_rev = max((j.estimated_revenue for j in jobs), default=0.0)
    return ScoringContext(
        # Floor at 30 min so a tight cluster of jobs doesn't make every drive
        # look "bad"; raise it if some leg is genuinely long.
        max_drive_min=max(30.0, drive_min or 0.0),
        max_avg_ticket=max_avg or 1.0,
        max_revenue=max_rev or 1.0,
    )


def skill_match_quality(tech: Technician, job: Job) -> float:
    """0-1 quality of the tech's fit for the job's required skills.

    Returns 0 if the tech is missing any required skill (a hard fail the solver
    also enforces); otherwise the mean proficiency across required skills. A job
    with no required skills is a neutral 1.0.
    """
    if not job.required_skill_ids:
        return 1.0
    vals = []
    for s in job.required_skill_ids:
        if s not in tech.skill_ids:
            return 0.0
        vals.append(PROFICIENCY_LEVEL.get(tech.proficiency.get(s, "standard"), 0.7))
    return sum(vals) / len(vals)


def _clamp(x: float) -> float:
    return max(0.0, min(1.0, x))


def score_one(
    job: Job,
    tech: Technician,
    drive_time_min: float,
    weights: OptimizationWeights,
    ctx: ScoringContext,
) -> ScoreBreakdown:
    drive = _clamp(1.0 - (drive_time_min / ctx.max_drive_min))
    skill = skill_match_quality(tech, job)
    revenue = _clamp(
        (tech.historical_avg_ticket / ctx.max_avg_ticket)
        * (job.estimated_revenue / ctx.max_revenue)
    )
    workload = _clamp(1.0 - (tech.assigned_hours_today / tech.max_hours)) if tech.max_hours else 0.0
    pref = 1.0 if job.preferred_tech_id == tech.id else 0.5

    wsum = weights.total() or 1.0
    total = (
        weights.drive_time * drive
        + weights.skill_match * skill
        + weights.revenue * revenue
        + weights.workload * workload
        + weights.customer_preference * pref
    ) / wsum

    return ScoreBreakdown(
        drive_time=round(drive, 4),
        skill_match=round(skill, 4),
        revenue=round(revenue, 4),
        workload=round(workload, 4),
        customer_preference=round(pref, 4),
        total=round(total, 4),
    )


def _reason(job: Job, tech: Technician, drive_time_min: float, b: ScoreBreakdown) -> str:
    parts = [f"{round(drive_time_min)} min drive"]
    if job.required_skill_ids:
        # Describe proficiency on the first required skill the tech holds.
        for s in sorted(job.required_skill_ids):
            if s in tech.skill_ids:
                parts.append(f"{tech.proficiency.get(s, 'standard')} on required skill")
                break
    if job.preferred_tech_id == tech.id:
        parts.append("customer's preferred tech")
    parts.append(f"{tech.assigned_hours_today:.1f}h booked today")
    return ", ".join(parts)


def rank_candidates(
    job: Job,
    techs: Sequence[Technician],
    drive_times: dict[str, float],
    weights: OptimizationWeights,
    ctx: ScoringContext,
    top_n: Optional[int] = None,
) -> list[Assignment]:
    """Score every qualified tech for ``job`` and return them best-first.

    Techs missing a required skill (skill score 0) are excluded entirely.
    """
    out: list[Assignment] = []
    for tech in techs:
        if not job.required_skill_ids.issubset(tech.skill_ids):
            continue
        drive = drive_times.get(tech.id, ctx.max_drive_min)
        b = score_one(job, tech, drive, weights, ctx)
        out.append(
            Assignment(
                job_id=job.id,
                tech_id=tech.id,
                tech_name=tech.name,
                score=b.total,
                drive_time_min=round(drive, 2),
                breakdown=b,
                reason=_reason(job, tech, drive, b),
            )
        )
    out.sort(key=lambda a: a.score, reverse=True)
    return out[:top_n] if top_n else out
