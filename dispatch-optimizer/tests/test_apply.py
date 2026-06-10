"""Auto-mode apply: status state machine, scheduled times, per-job errors,
and the day-scoping of arrival times propagated from the solver."""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from src.config import Settings
from src.db import Repository
from src.dispatch import optimize
from src.models import DispatchMode, OptimizationWeights

from .factory import make_jobs, seed_technicians

TZ = ZoneInfo("America/Chicago")
DAY = date(2026, 6, 10)


# ---------------------------------------------------------------------------
# Fake PostgREST client: records update payloads, raises for chosen job ids.
# ---------------------------------------------------------------------------
class _Builder:
    def __init__(self, writes: list, fail_ids: set):
        self._writes = writes
        self._fail_ids = fail_ids
        self._payload = None
        self._filters: dict = {}

    def update(self, payload):
        self._payload = payload
        return self

    def eq(self, col, val):
        self._filters[col] = val
        return self

    def execute(self):
        if self._filters.get("id") in self._fail_ids:
            raise RuntimeError("constraint violation")
        self._writes.append({"payload": self._payload, "filters": self._filters})


class _FakeClient:
    def __init__(self, fail_ids: set | None = None):
        self.writes: list = []
        self.fail_ids = fail_ids or set()

    def table(self, _name):
        return _Builder(self.writes, self.fail_ids)


def _repo(fail_ids: set | None = None) -> tuple[Repository, _FakeClient]:
    repo = Repository(Settings(supabase_url="http://test", supabase_service_role_key="k"))
    fake = _FakeClient(fail_ids)
    repo._client = fake
    return repo, fake


def _assignment(job_id: str, arrival_min: float | None = 9 * 60, duration_min: int = 90):
    return {
        "job_id": job_id,
        "tech_id": "tech-1",
        "arrival_min": arrival_min,
        "duration_min": duration_min,
    }


def test_created_job_advances_to_scheduled_with_times():
    repo, fake = _repo()
    errors = repo.apply_assignments(
        "tenant-1", [_assignment("job-a")], DAY, TZ, {"job-a": "created"}
    )
    assert errors == []
    [w] = fake.writes
    assert w["filters"] == {"tenant_id": "tenant-1", "id": "job-a"}
    assert w["payload"]["status"] == "scheduled"
    assert w["payload"]["technician_id"] == "tech-1"
    start = datetime.fromisoformat(w["payload"]["scheduled_start"])
    end = datetime.fromisoformat(w["payload"]["scheduled_end"])
    assert start == datetime(2026, 6, 10, 9, 0, tzinfo=TZ)
    assert (end - start).total_seconds() == 90 * 60


def test_dispatched_job_keeps_status():
    # dispatched -> scheduled is forbidden by the DB state machine; the write
    # must reassign the tech without touching status.
    repo, fake = _repo()
    repo.apply_assignments(
        "tenant-1", [_assignment("job-b")], DAY, TZ, {"job-b": "dispatched"}
    )
    [w] = fake.writes
    assert "status" not in w["payload"]
    assert w["payload"]["technician_id"] == "tech-1"
    assert "scheduled_start" in w["payload"]


def test_per_job_errors_do_not_abort_the_loop():
    repo, fake = _repo(fail_ids={"job-bad"})
    errors = repo.apply_assignments(
        "tenant-1",
        [_assignment("job-1"), _assignment("job-bad"), _assignment("job-2")],
        DAY,
        TZ,
        {"job-1": "created", "job-bad": "created", "job-2": "created"},
    )
    assert len(errors) == 1 and errors[0].startswith("job-bad:")
    assert [w["filters"]["id"] for w in fake.writes] == ["job-1", "job-2"]


def test_no_arrival_means_no_schedule_write():
    repo, fake = _repo()
    repo.apply_assignments(
        "tenant-1", [_assignment("job-c", arrival_min=None)], DAY, TZ, {"job-c": "created"}
    )
    [w] = fake.writes
    assert "scheduled_start" not in w["payload"]
    assert "scheduled_end" not in w["payload"]


async def test_optimize_assignments_carry_arrival_and_duration(provider):
    techs = seed_technicians()
    jobs = make_jobs(8)
    result = await optimize(techs, jobs, OptimizationWeights(), DispatchMode.auto, provider)
    assert result.assignments, "expected at least one assignment"
    by_id = {j.id: j for j in jobs}
    for a in result.assignments:
        assert a.arrival_min is not None and a.arrival_min > 0
        assert a.duration_min == by_id[a.job_id].duration_min
