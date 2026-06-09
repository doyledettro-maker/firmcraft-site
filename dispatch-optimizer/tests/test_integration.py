"""End-to-end orchestration: the known 5-tech / 20-job Houston problem, plus
emergency dispatch and reassignment."""

from __future__ import annotations

import pytest

from src.dispatch import emergency, optimize, reassign, suggest
from src.models import DispatchMode, GeoPoint, Job, JobPriority, OptimizationWeights
from tests.factory import EPA, ELEC, PLUMB, make_jobs, seed_technicians


async def test_optimize_5t_20j_houston(provider):
    techs = seed_technicians()
    jobs = make_jobs(20)
    result = await optimize(techs, jobs, OptimizationWeights(), DispatchMode.manual, provider)

    assigned_job_ids = [a.job_id for a in result.assignments]
    # Every job is either assigned or explicitly unassigned — none vanish.
    assert set(assigned_job_ids) | set(result.unassigned_job_ids) == {j.id for j in jobs}
    # 20 jobs across 5 techs is near the daily capacity ceiling (four 4-hour
    # panel upgrades alone consume most of the two electricians' day), so a few
    # may not fit — but the bulk must be placed.
    assert len(assigned_job_ids) >= 15

    # No tech is double-booked on the same job.
    assert len(assigned_job_ids) == len(set(assigned_job_ids))

    # Drive times are plausible for a metro: positive-ish, never > 2 hours.
    for a in result.assignments:
        assert 0 <= a.drive_time_min <= 120
        assert 0.0 <= a.score <= 1.0

    # Skill constraint honored end-to-end: panel upgrades only to elec techs.
    elec_techs = {"tech-sarah", "tech-tony"}
    for a in result.assignments:
        job = next(j for j in jobs if j.id == a.job_id)
        if job.required_skill_ids == {ELEC}:
            assert a.tech_id in elec_techs

    # Performance: well under the 1s bar for this size.
    assert result.solve_time_ms < 1000


async def test_suggest_returns_top3(provider):
    techs = seed_technicians()
    job = Job(
        id="suggest-1", location=GeoPoint(lat=29.78, lng=-95.40),
        required_skill_ids={EPA}, duration_min=60, estimated_revenue=149.0,
    )
    res = await suggest(job, techs, OptimizationWeights(), provider, top_n=3)
    assert res.job_id == "suggest-1"
    # Only EPA-qualified techs (Dave, Mike, Carlos) are eligible.
    assert 1 <= len(res.candidates) <= 3
    assert all(c.tech_id in {"tech-dave", "tech-mike", "tech-carlos"} for c in res.candidates)
    # Sorted best-first.
    scores = [c.score for c in res.candidates]
    assert scores == sorted(scores, reverse=True)


async def test_emergency_picks_nearest_qualified(provider):
    techs = seed_technicians()
    # Emergency right next to Dave's home base in the Heights.
    job = Job(
        id="emg-1", location=GeoPoint(lat=29.8030, lng=-95.4150),
        required_skill_ids={EPA}, duration_min=90, priority=JobPriority.emergency,
        estimated_revenue=325.0,
    )
    res = await emergency(job, techs, OptimizationWeights(), provider)
    assert res.chosen is not None
    # Dave is essentially on top of it and EPA certified.
    assert res.chosen.tech_id == "tech-dave"
    # Only EPA-qualified techs appear as candidates.
    assert all(c.tech_id in {"tech-dave", "tech-mike", "tech-carlos"} for c in res.candidates)
    assert res.solve_time_ms < 5000


async def test_emergency_disruption_accounts_for_existing_jobs(provider):
    techs = seed_technicians()
    job = Job(
        id="emg-2", location=GeoPoint(lat=29.80, lng=-95.41),
        required_skill_ids={EPA}, duration_min=90, priority=JobPriority.emergency,
    )
    # Give Dave a full slate; Mike none. Both qualified.
    existing = {
        "tech-dave": make_jobs(4, seed=1),
        "tech-mike": [],
    }
    res = await emergency(job, techs, OptimizationWeights(), provider, existing_jobs=existing)
    dave = next(c for c in res.candidates if c.tech_id == "tech-dave")
    mike = next(c for c in res.candidates if c.tech_id == "tech-mike")
    assert len(dave.displaced_job_ids) == 4
    assert mike.displaced_job_ids == []
    # Mike has no existing work, so his disruption is pure drive time.
    assert mike.disruption_cost == pytest.approx(mike.drive_time_min)
    # Dave's disruption carries a displacement penalty on top of his drive.
    assert dave.disruption_cost - dave.drive_time_min > 0


async def test_reassign_redistributes_jobs(provider):
    techs = seed_technicians()
    # Tony's plumbing jobs to redistribute; Carlos also covers plumbing.
    tony_jobs = [
        Job(id=f"p-{i}", location=GeoPoint(lat=29.70 + i * 0.01, lng=-95.40),
            required_skill_ids={PLUMB}, duration_min=45, estimated_revenue=189.0,
            technician_id="tech-tony")
        for i in range(3)
    ]
    res = await reassign("tech-tony", techs, tony_jobs, OptimizationWeights(),
                         DispatchMode.assist, provider)
    # Tony is excluded; his jobs land on other qualified techs (Carlos).
    assert all(a.tech_id != "tech-tony" for a in res.assignments)
    assigned = {a.job_id for a in res.assignments}
    assert assigned | set(res.unassigned_job_ids) == {j.id for j in tony_jobs}
    assert "tech-carlos" in {a.tech_id for a in res.assignments}
