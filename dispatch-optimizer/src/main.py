"""FastAPI surface for the dispatch optimizer.

Endpoints fetch state from Supabase (via :class:`Repository`, off the event loop
in a thread), run the pure orchestration in ``dispatch.py``, then apply the
mode-specific side effects:

* **manual** — suggestions only, no DB writes.
* **assist** — log the run as a suggestion (``accepted=null``) for the dispatch
  board to surface; the dispatcher accepts via the admin API.
* **auto** — apply assignments immediately and log ``accepted=true``; the 5-min
  override window is enforced by the dispatch board UI before techs are paged.
"""

from __future__ import annotations

import asyncio
import secrets
from datetime import date, datetime
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from . import __version__
from .config import get_settings
from .db import Repository
from .dispatch import emergency, optimize, reassign, suggest
from .distance import DistanceProvider
from .models import DispatchMode, Job, JobPriority, GeoPoint, OptimizationWeights
from .solver import backend_name

app = FastAPI(title="Firmcraft Dispatch Optimizer", version=__version__)


@app.on_event("startup")
async def _startup() -> None:
    app.state.provider = DistanceProvider()
    app.state.repo = Repository()


@app.on_event("shutdown")
async def _shutdown() -> None:
    provider: DistanceProvider = app.state.provider
    await provider.close()


def _repo() -> Repository:
    return app.state.repo


def _provider() -> DistanceProvider:
    return app.state.provider


def _resolve_day(day: Optional[str], tenant: dict) -> date:
    if day:
        return date.fromisoformat(day)
    tz = ZoneInfo(tenant.get("timezone", "America/Chicago"))
    return datetime.now(tz).date()


def require_api_key(authorization: str = Header(default="")) -> None:
    """Bearer-token gate on every endpoint except /health.

    The service writes to jobs with the service-role key, so it fails closed:
    with DISPATCH_API_KEY unset, every request is rejected rather than letting
    an unconfigured deployment run open.
    """
    expected = get_settings().dispatch_api_key
    if not expected:
        raise HTTPException(
            503, "DISPATCH_API_KEY is not configured; refusing all requests"
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not secrets.compare_digest(
        token.strip(), expected
    ):
        raise HTTPException(401, "Missing or invalid bearer token")


# --------------------------------------------------------------------------
# Request models
# --------------------------------------------------------------------------
# Note: the dispatch mode (manual/assist/auto) deliberately has NO request
# override — it always comes from tenants.settings.dispatch_mode, so a caller
# can never escalate a manual-mode tenant into auto-applied writes.
class OptimizeRequest(BaseModel):
    tenant_id: str
    date: Optional[str] = None
    trigger_type: str = "manual"


class SuggestRequest(BaseModel):
    tenant_id: str
    job_id: str
    top_n: int = 3


class InlineJob(BaseModel):
    """Optional inline emergency job when it isn't yet a row in the DB."""

    lat: float
    lng: float
    required_skill_ids: list[str] = []
    duration_min: int = 90
    estimated_revenue: float = 0.0
    title: str = "Emergency"


class EmergencyRequest(BaseModel):
    tenant_id: str
    job_id: Optional[str] = None
    job: Optional[InlineJob] = None
    date: Optional[str] = None


class ReassignRequest(BaseModel):
    tenant_id: str
    tech_id: str
    date: Optional[str] = None


# --------------------------------------------------------------------------
# Health
# --------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict:
    settings = get_settings()
    provider: DistanceProvider = app.state.provider if hasattr(app.state, "provider") else DistanceProvider()
    redis_ok = (await provider._get_redis()) is not None
    return {
        "status": "ok",
        "version": __version__,
        "solver_backend": backend_name(),
        "supabase_configured": _repo().enabled if hasattr(app.state, "repo") else Repository().enabled,
        "google_routes_configured": bool(settings.google_maps_api_key),
        "redis_connected": redis_ok,
    }


# --------------------------------------------------------------------------
# Optimize
# --------------------------------------------------------------------------
@app.post("/optimize", dependencies=[Depends(require_api_key)])
async def post_optimize(req: OptimizeRequest) -> dict:
    repo = _repo()
    _require_db(repo)
    tenant = await asyncio.to_thread(repo.fetch_tenant, req.tenant_id)
    if not tenant:
        raise HTTPException(404, f"tenant {req.tenant_id} not found")
    day = _resolve_day(req.date, tenant)
    mode = repo.tenant_mode(tenant)
    weights = repo.tenant_weights(tenant)

    techs = await asyncio.to_thread(repo.fetch_technicians, req.tenant_id, day, tenant)
    jobs = await asyncio.to_thread(repo.fetch_unassigned_jobs, req.tenant_id, day, tenant)

    result = await optimize(techs, jobs, weights, mode, _provider())
    result.tenant_id = req.tenant_id

    log_id = await _log_and_apply(
        repo, req.tenant_id, req.trigger_type, techs, jobs, result, mode, day, tenant
    )
    result.dispatch_log_id = log_id
    return result.model_dump()


# --------------------------------------------------------------------------
# Suggest (single job, top-N techs — no DB writes)
# --------------------------------------------------------------------------
@app.post("/suggest", dependencies=[Depends(require_api_key)])
async def post_suggest(req: SuggestRequest) -> dict:
    repo = _repo()
    _require_db(repo)
    tenant = await asyncio.to_thread(repo.fetch_tenant, req.tenant_id)
    if not tenant:
        raise HTTPException(404, f"tenant {req.tenant_id} not found")
    # Scoped to the caller's tenant: a job id belonging to another tenant is
    # indistinguishable from a nonexistent one.
    job = await asyncio.to_thread(repo.fetch_job, req.tenant_id, req.job_id, tenant)
    if job is None:
        raise HTTPException(404, f"job {req.job_id} not found")
    day = _resolve_day(None, tenant)
    weights = repo.tenant_weights(tenant)
    techs = await asyncio.to_thread(repo.fetch_technicians, req.tenant_id, day, tenant)
    candidates = await suggest(job, techs, weights, _provider(), top_n=req.top_n)
    return candidates.model_dump()


# --------------------------------------------------------------------------
# Emergency
# --------------------------------------------------------------------------
@app.post("/emergency", dependencies=[Depends(require_api_key)])
async def post_emergency(req: EmergencyRequest) -> dict:
    repo = _repo()
    _require_db(repo)
    tenant = await asyncio.to_thread(repo.fetch_tenant, req.tenant_id)
    if not tenant:
        raise HTTPException(404, f"tenant {req.tenant_id} not found")
    day = _resolve_day(req.date, tenant)
    weights = repo.tenant_weights(tenant)

    if req.job_id:
        job = await asyncio.to_thread(repo.fetch_job, req.tenant_id, req.job_id, tenant)
        if job is None:
            raise HTTPException(404, f"job {req.job_id} not found")
        job.priority = JobPriority.emergency
    elif req.job:
        job = Job(
            id="inline-emergency",
            location=GeoPoint(lat=req.job.lat, lng=req.job.lng),
            title=req.job.title,
            required_skill_ids=set(req.job.required_skill_ids),
            duration_min=req.job.duration_min,
            estimated_revenue=req.job.estimated_revenue,
            priority=JobPriority.emergency,
        )
    else:
        raise HTTPException(400, "provide job_id or inline job")

    techs = await asyncio.to_thread(repo.fetch_technicians, req.tenant_id, day, tenant)
    existing = {
        t.id: await asyncio.to_thread(
            repo.fetch_tech_jobs, req.tenant_id, t.id, day, tenant
        )
        for t in techs
    }
    result = await emergency(job, techs, weights, _provider(), existing_jobs=existing)

    log_id = await asyncio.to_thread(
        repo.write_dispatch_log,
        req.tenant_id,
        "emergency",
        {"job_id": job.id, "tech_count": len(techs)},
        result.model_dump(),
        result.solve_time_ms,
        [result.chosen.model_dump()] if result.chosen else [],
        job.id if req.job_id else None,
        None,
        None,
    )
    result.dispatch_log_id = log_id
    return result.model_dump()


# --------------------------------------------------------------------------
# Reassign
# --------------------------------------------------------------------------
@app.post("/reassign", dependencies=[Depends(require_api_key)])
async def post_reassign(req: ReassignRequest) -> dict:
    repo = _repo()
    _require_db(repo)
    tenant = await asyncio.to_thread(repo.fetch_tenant, req.tenant_id)
    if not tenant:
        raise HTTPException(404, f"tenant {req.tenant_id} not found")
    day = _resolve_day(req.date, tenant)
    mode = repo.tenant_mode(tenant)
    weights = repo.tenant_weights(tenant)

    techs = await asyncio.to_thread(repo.fetch_technicians, req.tenant_id, day, tenant)
    tech_jobs = await asyncio.to_thread(
        repo.fetch_tech_jobs, req.tenant_id, req.tech_id, day, tenant
    )
    result = await reassign(req.tech_id, techs, tech_jobs, weights, mode, _provider())
    result.tenant_id = req.tenant_id

    log_id = await _log_and_apply(
        repo, req.tenant_id, "tech_unavailable", techs, tech_jobs, result, mode, day, tenant
    )
    result.dispatch_log_id = log_id
    return result.model_dump()


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def _require_db(repo: Repository) -> None:
    if not repo.enabled:
        raise HTTPException(
            503,
            "Supabase not configured: set SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY.",
        )


async def _log_and_apply(
    repo: Repository,
    tenant_id: str,
    trigger_type: str,
    techs,
    jobs,
    result,
    mode: DispatchMode,
    day: date,
    tenant: dict,
) -> Optional[str]:
    """Write the dispatch log and, in auto mode, apply the assignments."""
    assignments = [a.model_dump() for a in result.assignments]
    accepted = True if mode == DispatchMode.auto else None
    log_id = await asyncio.to_thread(
        repo.write_dispatch_log,
        tenant_id,
        trigger_type,
        {
            "tech_ids": [t.id for t in techs],
            "job_ids": [j.id for j in jobs],
            "mode": mode.value,
        },
        result.model_dump(),
        result.solve_time_ms,
        assignments,
        None,
        accepted,
        "system" if mode == DispatchMode.auto else None,
    )
    if mode == DispatchMode.auto and assignments:
        tz = ZoneInfo(tenant.get("timezone", "America/Chicago"))
        job_statuses = {j.id: j.status for j in jobs if j.status}
        result.apply_errors = await asyncio.to_thread(
            repo.apply_assignments, tenant_id, assignments, day, tz, job_statuses
        )
    return log_id
