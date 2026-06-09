"""Scoring engine: skill quality, deterministic scores, and the headline
requirement that changing weights changes rankings."""

from __future__ import annotations

import pytest

from src.models import GeoPoint, Job, JobPriority, OptimizationWeights
from src.scoring import (
    ScoringContext,
    build_context,
    rank_candidates,
    score_one,
    skill_match_quality,
)
from tests.factory import EPA, ELEC, PLUMB, seed_technicians


def test_skill_quality_levels():
    techs = {t.id: t for t in seed_technicians()}
    epa_job = Job(id="j", location=GeoPoint(lat=29.7, lng=-95.4), required_skill_ids={EPA})
    # Dave is EPA expert (1.0), Mike standard (0.7).
    assert skill_match_quality(techs["tech-dave"], epa_job) == 1.0
    assert skill_match_quality(techs["tech-mike"], epa_job) == pytest.approx(0.7)
    # Sarah lacks EPA entirely -> hard 0.
    assert skill_match_quality(techs["tech-sarah"], epa_job) == 0.0


def test_no_required_skill_is_neutral():
    tech = seed_technicians()[0]
    job = Job(id="j", location=GeoPoint(lat=29.7, lng=-95.4), required_skill_ids=set())
    assert skill_match_quality(tech, job) == 1.0


def test_score_in_unit_range():
    tech = seed_technicians()[0]
    job = Job(
        id="j", location=GeoPoint(lat=29.7, lng=-95.4),
        required_skill_ids={EPA}, estimated_revenue=149.0,
    )
    ctx = ScoringContext(max_drive_min=60, max_avg_ticket=900, max_revenue=1850)
    b = score_one(job, tech, 10.0, OptimizationWeights(), ctx)
    assert 0.0 <= b.total <= 1.0
    assert b.skill_match == 1.0  # Dave is EPA expert


def test_changing_weights_changes_ranking():
    """Two EPA-qualified techs: a drive-heavy weighting prefers the closer/
    cheaper tech; a revenue-heavy weighting flips to the higher-ticket tech."""
    techs = [t for t in seed_technicians() if t.id in {"tech-dave", "tech-carlos"}]
    # Carlos closes bigger tickets but is the farther/lower-skill option here.
    carlos = next(t for t in techs if t.id == "tech-carlos")
    dave = next(t for t in techs if t.id == "tech-dave")
    carlos.historical_avg_ticket = 1000.0
    dave.historical_avg_ticket = 150.0

    job = Job(
        id="j", location=GeoPoint(lat=29.80, lng=-95.41),  # right by Dave's base
        required_skill_ids={EPA}, estimated_revenue=325.0,
    )
    # Dave is close (5 min), Carlos far (40 min).
    drive_times = {"tech-dave": 5.0, "tech-carlos": 40.0}
    ctx = build_context(techs, [job], drive_min=40.0)

    drive_heavy = OptimizationWeights(
        drive_time=0.7, skill_match=0.1, revenue=0.1, workload=0.05, customer_preference=0.05
    )
    revenue_heavy = OptimizationWeights(
        drive_time=0.05, skill_match=0.05, revenue=0.8, workload=0.05, customer_preference=0.05
    )

    top_drive = rank_candidates(job, techs, drive_times, drive_heavy, ctx)[0].tech_id
    top_revenue = rank_candidates(job, techs, drive_times, revenue_heavy, ctx)[0].tech_id

    assert top_drive == "tech-dave"
    assert top_revenue == "tech-carlos"
    assert top_drive != top_revenue


def test_preferred_tech_bonus():
    techs = [t for t in seed_technicians() if t.id in {"tech-dave", "tech-mike"}]
    job = Job(
        id="j", location=GeoPoint(lat=29.80, lng=-95.41),
        required_skill_ids={EPA}, estimated_revenue=149.0,
        preferred_tech_id="tech-mike",
    )
    ctx = build_context(techs, [job], drive_min=20.0)
    # Equal drive so preference is the differentiator.
    drive_times = {"tech-dave": 10.0, "tech-mike": 10.0}
    pref_heavy = OptimizationWeights(
        drive_time=0.1, skill_match=0.1, revenue=0.1, workload=0.1, customer_preference=0.6
    )
    top = rank_candidates(job, techs, drive_times, pref_heavy, ctx)[0]
    assert top.tech_id == "tech-mike"
