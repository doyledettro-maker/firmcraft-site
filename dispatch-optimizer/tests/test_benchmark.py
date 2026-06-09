"""Performance benchmarks (DoD targets).

* 10 techs / 50 jobs  < 1s   (headline Definition of Done)
* 30 techs / 200 jobs < 2s   (scale benchmark, 10 iterations, mean/max reported)

Timing is measured on the solver itself (``solve_time_ms``) so it excludes the
Haversine matrix build, matching how the optimizer reports solve time in prod.
"""

from __future__ import annotations

import pytest

from src.dispatch import optimize
from src.models import DispatchMode, OptimizationWeights
from src.solver import backend_name, build_problem, solve
from tests.factory import make_jobs, make_technicians


async def _solve_ms(provider, n_tech, n_job):
    techs = make_technicians(n_tech)
    jobs = make_jobs(n_job)
    points = [t.location.as_tuple() for t in techs] + [j.location.as_tuple() for j in jobs]
    matrix = await provider.matrix(points)
    problem = build_problem(techs, jobs, matrix)
    sol = solve(problem)
    return sol.solve_time_ms, sol


@pytest.mark.benchmark
async def test_10t_50j_under_1s(provider):
    ms, sol = await _solve_ms(provider, 10, 50)
    served = 50 - len(sol.unassigned_job_ids)
    print(f"\n[bench] 10t/50j: {ms} ms, {served}/50 served ({backend_name()})")
    assert ms < 1000
    # Sanity: the fleet serves the large majority (remainder is capacity-bound,
    # not a solver failure — this test gates on speed).
    assert served >= 40


@pytest.mark.benchmark
async def test_30t_200j_under_2s(provider):
    times = []
    for _ in range(10):
        ms, _ = await _solve_ms(provider, 30, 200)
        times.append(ms)
    mean = sum(times) / len(times)
    print(f"\n[bench] 30t/200j over 10 runs: mean={mean:.0f}ms max={max(times)}ms ({backend_name()})")
    assert max(times) < 2000
