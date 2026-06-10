"""Domain models for the dispatch optimizer.

These are deliberately decoupled from the Supabase row shapes: ``src/db.py``
translates DB rows into these models, and the solver / scorer only ever see
these. Times are modelled as integer **minutes from midnight** of the
optimization day (in the tenant's timezone). That keeps the whole pipeline in
plain integers — easy to reason about, trivial to unit-test, and a clean
conversion to VROOM's integer-seconds time windows.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

# Minutes-from-midnight bounds used when a job has no explicit time window:
# it can be served any time during the working day.
DAY_START_MIN = 0
DAY_END_MIN = 24 * 60


class DispatchMode(str, Enum):
    manual = "manual"   # suggestions only, no DB writes
    assist = "assist"   # top-N surfaced, dispatcher accepts
    auto = "auto"       # auto-assign with override window


class JobPriority(str, Enum):
    emergency = "emergency"
    urgent = "urgent"
    standard = "standard"
    flexible = "flexible"


# VROOM job priority is 0..100 (higher = more important to serve). Map the
# business priority enum onto that scale so emergencies are dropped last.
PRIORITY_RANK = {
    JobPriority.emergency: 100,
    JobPriority.urgent: 60,
    JobPriority.standard: 30,
    JobPriority.flexible: 10,
}


class GeoPoint(BaseModel):
    lat: float
    lng: float

    def as_tuple(self) -> tuple[float, float]:
        return (self.lat, self.lng)


class Technician(BaseModel):
    id: str
    name: str
    # Routing start/end location (home base, or current GPS position if on the
    # clock). VROOM uses this as the vehicle start & end.
    location: GeoPoint
    skill_ids: set[str] = Field(default_factory=set)
    # Proficiency per skill: skill_id -> "apprentice" | "standard" | "expert".
    proficiency: dict[str, str] = Field(default_factory=dict)
    # Working window for the optimization day, minutes from midnight.
    work_start_min: int = 8 * 60
    work_end_min: int = 17 * 60
    hourly_rate: float = 0.0
    # Average ticket this tech historically closes — feeds the revenue score.
    historical_avg_ticket: float = 0.0
    # Hours already committed today (existing assigned jobs) — feeds workload.
    assigned_hours_today: float = 0.0
    max_hours: float = 8.0
    # Service-area ids the tech covers (primary/secondary), for zone scoring.
    primary_zone_ids: set[str] = Field(default_factory=set)
    secondary_zone_ids: set[str] = Field(default_factory=set)

    @property
    def work_minutes(self) -> int:
        return max(0, self.work_end_min - self.work_start_min)


class Job(BaseModel):
    id: str
    location: GeoPoint
    title: str = ""
    required_skill_ids: set[str] = Field(default_factory=set)
    duration_min: int = 60
    # Customer availability window (minutes from midnight). None => any time.
    window_start_min: Optional[int] = None
    window_end_min: Optional[int] = None
    estimated_revenue: float = 0.0
    priority: JobPriority = JobPriority.standard
    preferred_tech_id: Optional[str] = None
    # Service-area ids this job's location falls in, for zone scoring.
    zone_ids: set[str] = Field(default_factory=set)
    # Already-assigned tech (for reassign/emergency disruption accounting).
    technician_id: Optional[str] = None
    # Current lifecycle status from the DB row (None for inline/synthetic jobs).
    # apply_assignments uses it to respect the status state machine.
    status: Optional[str] = None

    def window(self) -> tuple[int, int]:
        start = DAY_START_MIN if self.window_start_min is None else self.window_start_min
        end = DAY_END_MIN if self.window_end_min is None else self.window_end_min
        return (start, end)


class OptimizationWeights(BaseModel):
    """Multi-objective weights. Defaults match the architecture spec.

    They need not sum to 1 — the scorer normalizes by the weight total — but the
    defaults do, for interpretability.
    """

    drive_time: float = 0.30
    skill_match: float = 0.20
    revenue: float = 0.25
    workload: float = 0.15
    customer_preference: float = 0.10

    def total(self) -> float:
        return (
            self.drive_time
            + self.skill_match
            + self.revenue
            + self.workload
            + self.customer_preference
        )


class ScoreBreakdown(BaseModel):
    """Per-dimension normalized scores (0-1) plus the weighted total."""

    drive_time: float
    skill_match: float
    revenue: float
    workload: float
    customer_preference: float
    total: float


class Assignment(BaseModel):
    job_id: str
    tech_id: str
    tech_name: str = ""
    score: float
    drive_time_min: float
    breakdown: ScoreBreakdown
    reason: str = ""
    # Solver arrival time (minutes from midnight of the optimization day) and
    # job duration — used to write scheduled_start/scheduled_end in auto mode.
    arrival_min: Optional[float] = None
    duration_min: Optional[int] = None


class JobCandidates(BaseModel):
    """Ranked tech candidates for a single job (used by /suggest)."""

    job_id: str
    candidates: list[Assignment]


class OptimizationResult(BaseModel):
    tenant_id: Optional[str] = None
    mode: DispatchMode
    assignments: list[Assignment]
    unassigned_job_ids: list[str] = Field(default_factory=list)
    solve_time_ms: int = 0
    total_drive_time_min: float = 0.0
    dispatch_log_id: Optional[str] = None
    # Per-job DB write failures from auto-mode apply (empty in manual/assist).
    apply_errors: list[str] = Field(default_factory=list)


class EmergencyCandidate(BaseModel):
    tech_id: str
    tech_name: str = ""
    drive_time_min: float
    disruption_cost: float
    displaced_job_ids: list[str] = Field(default_factory=list)
    score: float
    reason: str = ""


class EmergencyResult(BaseModel):
    job_id: str
    chosen: Optional[EmergencyCandidate] = None
    candidates: list[EmergencyCandidate] = Field(default_factory=list)
    solve_time_ms: int = 0
    dispatch_log_id: Optional[str] = None
