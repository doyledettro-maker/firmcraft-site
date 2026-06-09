"""Deterministic test data factories.

Builds domain ``Technician``/``Job`` objects mirroring the Phase 2.1 Houston
seed (5 techs, 3 skills) and scales up to arbitrary fleet sizes for benchmarks.
A tiny seeded LCG keeps coordinates reproducible without ``random`` global state
(and without the disallowed ``Math.random`` equivalent), so fixtures and the
regression dataset are byte-stable.
"""

from __future__ import annotations

from src.models import GeoPoint, Job, JobPriority, Technician

# Houston metro bounding box (matches the seed service-area polygons).
LAT_MIN, LAT_MAX = 29.55, 29.98
LNG_MIN, LNG_MAX = -95.55, -95.20

# Skill ids reused from the seed taxonomy.
EPA = "skill-epa-608"
ELEC = "skill-electrician"
PLUMB = "skill-plumber"


class _LCG:
    """Deterministic linear congruential generator → floats in [0, 1)."""

    def __init__(self, seed: int = 1):
        self.state = seed & 0xFFFFFFFF

    def next(self) -> float:
        self.state = (1103515245 * self.state + 12345) & 0x7FFFFFFF
        return self.state / 0x7FFFFFFF


def _coord(rng: _LCG) -> GeoPoint:
    return GeoPoint(
        lat=LAT_MIN + (LAT_MAX - LAT_MIN) * rng.next(),
        lng=LNG_MIN + (LNG_MAX - LNG_MIN) * rng.next(),
    )


def seed_technicians() -> list[Technician]:
    """The five seed techs with skills, proficiency, and avg-ticket history."""
    return [
        Technician(
            id="tech-dave", name="Dave Martinez",
            location=GeoPoint(lat=29.8025, lng=-95.4150),
            skill_ids={EPA}, proficiency={EPA: "expert"},
            work_start_min=7 * 60, work_end_min=16 * 60,
            historical_avg_ticket=180.0, max_hours=9.0,
        ),
        Technician(
            id="tech-mike", name="Mike Chen",
            location=GeoPoint(lat=29.8480, lng=-95.3760),
            skill_ids={EPA}, proficiency={EPA: "standard"},
            work_start_min=8 * 60, work_end_min=17 * 60,
            historical_avg_ticket=150.0, max_hours=9.0,
        ),
        Technician(
            id="tech-sarah", name="Sarah Johnson",
            location=GeoPoint(lat=29.6710, lng=-95.3250),
            skill_ids={ELEC}, proficiency={ELEC: "expert"},
            work_start_min=8 * 60, work_end_min=17 * 60,
            historical_avg_ticket=900.0, max_hours=9.0,
        ),
        Technician(
            id="tech-carlos", name="Carlos Reyes",
            location=GeoPoint(lat=29.7080, lng=-95.2780),
            skill_ids={EPA, PLUMB},
            proficiency={EPA: "apprentice", PLUMB: "standard"},
            work_start_min=8 * 60, work_end_min=17 * 60,
            historical_avg_ticket=200.0, max_hours=9.0,
        ),
        Technician(
            id="tech-tony", name="Tony Russo",
            location=GeoPoint(lat=29.7380, lng=-95.5240),
            skill_ids={PLUMB, ELEC},
            proficiency={PLUMB: "expert", ELEC: "standard"},
            work_start_min=8 * 60, work_end_min=17 * 60,
            historical_avg_ticket=320.0, max_hours=9.0,
        ),
    ]


# Job archetypes: (title, required skill, duration, revenue). Every skill here
# is covered by at least one seed tech, so a well-formed problem is solvable.
_ARCHETYPES = [
    ("AC Tune-Up", EPA, 60, 149.0),
    ("Furnace Repair", EPA, 90, 325.0),
    ("Panel Upgrade", ELEC, 240, 1850.0),
    ("Drain Cleaning", PLUMB, 45, 189.0),
    ("Water Heater Install", PLUMB, 120, 1200.0),
]


def make_jobs(n: int, seed: int = 42, with_skills: bool = True) -> list[Job]:
    rng = _LCG(seed)
    jobs: list[Job] = []
    for i in range(n):
        title, skill, dur, rev = _ARCHETYPES[i % len(_ARCHETYPES)]
        jobs.append(
            Job(
                id=f"job-{i:04d}",
                location=_coord(rng),
                title=f"{title} #{i}",
                required_skill_ids={skill} if with_skills else set(),
                duration_min=dur,
                estimated_revenue=rev,
                priority=JobPriority.standard,
            )
        )
    return jobs


def make_technicians(n: int, seed: int = 7) -> list[Technician]:
    """Scale to n techs for benchmarks, guaranteeing full skill coverage."""
    base = seed_technicians()
    if n <= len(base):
        return base[:n]
    rng = _LCG(seed)
    techs = list(base)
    skill_cycle = [EPA, ELEC, PLUMB]
    for i in range(len(base), n):
        # Two skills each, cycled so coverage stays balanced.
        s1 = skill_cycle[i % 3]
        s2 = skill_cycle[(i + 1) % 3]
        techs.append(
            Technician(
                id=f"tech-{i:04d}",
                name=f"Tech {i}",
                location=_coord(rng),
                skill_ids={s1, s2},
                proficiency={s1: "standard", s2: "standard"},
                work_start_min=8 * 60, work_end_min=17 * 60,
                historical_avg_ticket=150.0 + (i % 5) * 40,
                max_hours=9.0,
            )
        )
    return techs
