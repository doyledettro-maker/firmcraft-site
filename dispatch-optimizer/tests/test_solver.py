"""Problem builder + solver: skill mapping, hard skill constraints, no
double-booking, and unassignable jobs surfacing as unassigned."""

from __future__ import annotations

import pytest

from src.models import GeoPoint, Job, JobPriority
from src.solver import build_problem, solve
from tests.factory import EPA, ELEC, PLUMB, make_jobs, seed_technicians


async def _build(provider, techs, jobs):
    points = [t.location.as_tuple() for t in techs] + [j.location.as_tuple() for j in jobs]
    matrix = await provider.matrix(points)
    return build_problem(techs, jobs, matrix)


async def test_problem_builder_indices_and_skillmap(provider):
    techs = seed_technicians()
    jobs = make_jobs(5)
    problem = await _build(provider, techs, jobs)

    # Tech locations occupy indices 0..T-1, jobs T..T+J-1.
    assert problem.tech_loc_index[techs[0].id] == 0
    assert problem.job_loc_index[jobs[0].id] == len(techs)
    # Every skill referenced gets a unique positive int id.
    assert set(problem.skill_map.values()) == set(range(1, len(problem.skill_map) + 1))
    assert EPA in problem.skill_map


async def test_skill_constraint_enforced(provider):
    """A panel upgrade (electrician) must never land on an EPA-only tech."""
    techs = seed_technicians()
    elec_techs = {"tech-sarah", "tech-tony"}
    job = Job(
        id="panel-1", location=GeoPoint(lat=29.70, lng=-95.40),
        required_skill_ids={ELEC}, duration_min=120, estimated_revenue=1800.0,
    )
    problem = await _build(provider, techs, [job])
    sol = solve(problem)
    assigned = sol.job_to_tech()
    assert assigned.get("panel-1") in elec_techs


async def test_no_double_booking(provider):
    techs = seed_technicians()
    jobs = make_jobs(15)
    problem = await _build(provider, techs, jobs)
    sol = solve(problem)
    seen = [s.job_id for r in sol.routes for s in r.stops]
    assert len(seen) == len(set(seen))  # each job appears at most once


async def test_unsatisfiable_skill_is_unassigned(provider):
    techs = seed_technicians()
    job = Job(
        id="impossible", location=GeoPoint(lat=29.70, lng=-95.40),
        required_skill_ids={"skill-nobody-has"}, duration_min=60,
    )
    problem = await _build(provider, techs, [job])
    sol = solve(problem)
    assert "impossible" in sol.unassigned_job_ids


async def test_all_jobs_assigned_when_feasible(provider):
    techs = seed_technicians()
    jobs = make_jobs(10)
    problem = await _build(provider, techs, jobs)
    sol = solve(problem)
    # Every archetype skill is covered by a tech, so all 10 should be served.
    assert sol.unassigned_job_ids == []
