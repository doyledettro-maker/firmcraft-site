"""Supabase data access for the optimizer.

Reads techs/jobs (service-role key → bypasses RLS, correct for a trusted
server-side service) and writes ``dispatch_logs``. DB rows are translated into
the plain domain models in ``src/models.py`` so the solver/scorer never touch
Supabase shapes.

Geometry note: PostgREST returns PostGIS columns as opaque WKB, so locations are
read from the ``lat``/``lng`` fields embedded in the ``address``/``home_address``
JSON instead. The seed data carries lat/lng on customer addresses.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional
from zoneinfo import ZoneInfo

from .config import Settings, get_settings
from .models import (
    DispatchMode,
    GeoPoint,
    Job,
    JobPriority,
    OptimizationWeights,
    Technician,
)

try:
    from supabase import Client, create_client
except Exception:  # pragma: no cover
    Client = Any  # type: ignore
    create_client = None  # type: ignore

_WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def _hhmm_to_min(s: str) -> int:
    h, m = s.split(":")
    return int(h) * 60 + int(m)


def _point_from_address(addr: Optional[dict]) -> Optional[GeoPoint]:
    if not addr:
        return None
    lat, lng = addr.get("lat"), addr.get("lng")
    if lat is None or lng is None:
        return None
    return GeoPoint(lat=float(lat), lng=float(lng))


def _ts_to_min(ts: Optional[str], tz: ZoneInfo) -> Optional[int]:
    """timestamptz string -> minutes from midnight in the tenant timezone."""
    if not ts:
        return None
    dt = datetime.fromisoformat(ts)
    local = dt.astimezone(tz)
    return local.hour * 60 + local.minute


class Repository:
    """Thin Supabase wrapper. All methods are synchronous; call from async code
    via ``asyncio.to_thread`` (the FastAPI layer does)."""

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self._client: Optional[Client] = None

    @property
    def enabled(self) -> bool:
        return bool(
            self.settings.supabase_url
            and self.settings.supabase_service_role_key
            and create_client is not None
        )

    def client(self) -> Client:
        if not self.enabled:
            raise RuntimeError(
                "Supabase is not configured. Set SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY (service-role key) in the environment."
            )
        if self._client is None:
            self._client = create_client(
                self.settings.supabase_url, self.settings.supabase_service_role_key
            )
        return self._client

    # ---- tenant ----------------------------------------------------------
    def fetch_tenant(self, tenant_id: str) -> dict:
        res = (
            self.client()
            .table("tenants")
            .select("id,timezone,business_hours,settings")
            .eq("id", tenant_id)
            .single()
            .execute()
        )
        return res.data or {}

    def tenant_weights(self, tenant: dict) -> OptimizationWeights:
        w = (tenant.get("settings") or {}).get("optimization_weights")
        return OptimizationWeights(**w) if isinstance(w, dict) else OptimizationWeights()

    def tenant_mode(self, tenant: dict) -> DispatchMode:
        m = (tenant.get("settings") or {}).get("dispatch_mode", "manual")
        try:
            return DispatchMode(m)
        except ValueError:
            return DispatchMode.manual

    # ---- technicians -----------------------------------------------------
    def fetch_technicians(self, tenant_id: str, day: date, tenant: dict) -> list[Technician]:
        tz = ZoneInfo(tenant.get("timezone", "America/Chicago"))
        business = tenant.get("business_hours") or {}
        weekday = _WEEKDAYS[day.weekday()]

        res = (
            self.client()
            .table("technicians")
            .select(
                "id,name,home_address,hourly_rate,work_hours,is_active,"
                "technician_skills(skill_id,proficiency,expires_at),"
                "technician_zones(service_area_id,priority)"
            )
            .eq("tenant_id", tenant_id)
            .eq("is_active", True)
            .is_("deleted_at", "null")
            .execute()
        )
        rows = res.data or []

        avg_ticket = self._historical_avg_ticket(tenant_id)
        booked = self._assigned_hours(tenant_id, day, tz)
        # Current GPS positions (override home as routing start when present).
        current = self._current_locations(tenant_id)

        techs: list[Technician] = []
        for r in rows:
            loc = current.get(r["id"]) or _point_from_address(r.get("home_address"))
            if loc is None:
                continue  # cannot route a tech with no location
            # Work window: per-tech override for the weekday, else tenant default.
            wh = (r.get("work_hours") or {}).get(weekday) or business.get(weekday)
            if wh:
                ws, we = _hhmm_to_min(wh["start"]), _hhmm_to_min(wh["end"])
            else:
                ws, we = 8 * 60, 17 * 60

            skills, prof = set(), {}
            for ts in r.get("technician_skills") or []:
                exp = ts.get("expires_at")
                # Exclude expired certifications as of the optimization day.
                if exp and date.fromisoformat(exp) < day:
                    continue
                skills.add(ts["skill_id"])
                prof[ts["skill_id"]] = ts.get("proficiency", "standard")

            primary, secondary = set(), set()
            for z in r.get("technician_zones") or []:
                (primary if z.get("priority", 1) == 1 else secondary).add(
                    z["service_area_id"]
                )

            max_hours = max(0.5, (we - ws) / 60.0)
            techs.append(
                Technician(
                    id=r["id"],
                    name=r["name"],
                    location=loc,
                    skill_ids=skills,
                    proficiency=prof,
                    work_start_min=ws,
                    work_end_min=we,
                    hourly_rate=float(r.get("hourly_rate") or 0),
                    historical_avg_ticket=avg_ticket.get(r["id"], 0.0),
                    assigned_hours_today=booked.get(r["id"], 0.0),
                    max_hours=max_hours,
                    primary_zone_ids=primary,
                    secondary_zone_ids=secondary,
                )
            )
        return techs

    def _current_locations(self, tenant_id: str) -> dict[str, GeoPoint]:
        # technician_current_location.location is WKB via PostgREST; we can't
        # decode it without PostGIS helpers, so this is best-effort empty for
        # now and techs route from home. A future RPC can expose lat/lng.
        return {}

    def _historical_avg_ticket(self, tenant_id: str) -> dict[str, float]:
        res = (
            self.client()
            .table("jobs")
            .select("technician_id,actual_revenue,estimated_revenue,status")
            .eq("tenant_id", tenant_id)
            .in_("status", ["completed", "invoiced"])
            .limit(2000)
            .execute()
        )
        agg: dict[str, list[float]] = {}
        for r in res.data or []:
            tid = r.get("technician_id")
            if not tid:
                continue
            rev = r.get("actual_revenue") or r.get("estimated_revenue")
            if rev is None:
                continue
            agg.setdefault(tid, []).append(float(rev))
        return {k: sum(v) / len(v) for k, v in agg.items() if v}

    def _assigned_hours(self, tenant_id: str, day: date, tz: ZoneInfo) -> dict[str, float]:
        start = datetime(day.year, day.month, day.day, tzinfo=tz)
        end = datetime(day.year, day.month, day.day, 23, 59, 59, tzinfo=tz)
        res = (
            self.client()
            .table("jobs")
            .select("technician_id,estimated_duration,scheduled_start,status")
            .eq("tenant_id", tenant_id)
            .gte("scheduled_start", start.isoformat())
            .lte("scheduled_start", end.isoformat())
            .not_.in_("status", ["cancelled", "completed", "invoiced"])
            .execute()
        )
        out: dict[str, float] = {}
        for r in res.data or []:
            tid = r.get("technician_id")
            if not tid:
                continue
            out[tid] = out.get(tid, 0.0) + (r.get("estimated_duration") or 60) / 60.0
        return out

    # ---- jobs ------------------------------------------------------------
    def fetch_unassigned_jobs(self, tenant_id: str, day: date, tenant: dict) -> list[Job]:
        tz = ZoneInfo(tenant.get("timezone", "America/Chicago"))
        res = (
            self.client()
            .table("jobs")
            .select(self._JOB_SELECT)
            .eq("tenant_id", tenant_id)
            .is_("technician_id", "null")
            .in_("status", ["created", "scheduled"])
            .is_("deleted_at", "null")
            .execute()
        )
        return [j for j in (self._job_from_row(r, tz) for r in res.data or []) if j]

    def fetch_job(self, job_id: str) -> tuple[Optional[Job], Optional[str], Optional[dict]]:
        res = (
            self.client()
            .table("jobs")
            .select(self._JOB_SELECT + ",tenant_id")
            .eq("id", job_id)
            .single()
            .execute()
        )
        row = res.data
        if not row:
            return None, None, None
        tenant = self.fetch_tenant(row["tenant_id"])
        tz = ZoneInfo(tenant.get("timezone", "America/Chicago"))
        return self._job_from_row(row, tz), row["tenant_id"], tenant

    def fetch_tech_jobs(self, tenant_id: str, tech_id: str, day: date, tenant: dict) -> list[Job]:
        tz = ZoneInfo(tenant.get("timezone", "America/Chicago"))
        start = datetime(day.year, day.month, day.day, tzinfo=tz)
        end = datetime(day.year, day.month, day.day, 23, 59, 59, tzinfo=tz)
        res = (
            self.client()
            .table("jobs")
            .select(self._JOB_SELECT)
            .eq("tenant_id", tenant_id)
            .eq("technician_id", tech_id)
            .gte("scheduled_start", start.isoformat())
            .lte("scheduled_start", end.isoformat())
            .in_("status", ["scheduled", "dispatched"])
            .execute()
        )
        return [j for j in (self._job_from_row(r, tz) for r in res.data or []) if j]

    _JOB_SELECT = (
        "id,title,priority,status,estimated_duration,estimated_revenue,"
        "arrival_window_start,arrival_window_end,technician_id,address,"
        "customer:customers(address,preferred_tech_id),"
        "job_type:job_types(required_skills,default_duration,estimated_revenue)"
    )

    def _job_from_row(self, r: dict, tz: ZoneInfo) -> Optional[Job]:
        customer = r.get("customer") or {}
        loc = _point_from_address(r.get("address")) or _point_from_address(
            customer.get("address")
        )
        if loc is None:
            return None
        job_type = r.get("job_type") or {}
        required = set(job_type.get("required_skills") or [])
        duration = (
            r.get("estimated_duration")
            or job_type.get("default_duration")
            or 60
        )
        revenue = r.get("estimated_revenue") or job_type.get("estimated_revenue") or 0.0
        try:
            priority = JobPriority(r.get("priority", "standard"))
        except ValueError:
            priority = JobPriority.standard
        return Job(
            id=r["id"],
            location=loc,
            title=r.get("title", ""),
            required_skill_ids=required,
            duration_min=int(duration),
            window_start_min=_ts_to_min(r.get("arrival_window_start"), tz),
            window_end_min=_ts_to_min(r.get("arrival_window_end"), tz),
            estimated_revenue=float(revenue),
            priority=priority,
            preferred_tech_id=customer.get("preferred_tech_id"),
            technician_id=r.get("technician_id"),
        )

    # ---- writes ----------------------------------------------------------
    def write_dispatch_log(
        self,
        tenant_id: str,
        trigger_type: str,
        input_snapshot: dict,
        solution: dict,
        solve_time_ms: int,
        assignments: list[dict],
        trigger_job_id: Optional[str] = None,
        accepted: Optional[bool] = None,
        accepted_by: Optional[str] = None,
    ) -> Optional[str]:
        payload = {
            "tenant_id": tenant_id,
            "trigger_type": trigger_type,
            "trigger_job_id": trigger_job_id,
            "input_snapshot": input_snapshot,
            "solution": solution,
            "solve_time_ms": solve_time_ms,
            "assignments": assignments,
            "accepted": accepted,
            "accepted_by": accepted_by,
        }
        res = self.client().table("dispatch_logs").insert(payload).execute()
        data = res.data or []
        return data[0]["id"] if data else None

    def apply_assignments(self, assignments: list[dict]) -> None:
        """Write tech assignments to jobs (auto mode / accepted suggestions)."""
        client = self.client()
        for a in assignments:
            client.table("jobs").update(
                {"technician_id": a["tech_id"], "status": "scheduled"}
            ).eq("id", a["job_id"]).execute()
