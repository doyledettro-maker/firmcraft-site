"""Distance matrix: Haversine correctness, matrix shape, grid-cell caching."""

from __future__ import annotations

import pytest

from src.distance import DistanceProvider, haversine_meters


def test_haversine_known_distance():
    # Houston Heights -> Bellaire, ~13 km straight line.
    d = haversine_meters((29.7900, -95.3980), (29.7050, -95.4600))
    assert 10_000 < d < 16_000


def test_haversine_zero_for_same_point():
    assert haversine_meters((29.79, -95.39), (29.79, -95.39)) == pytest.approx(0.0, abs=1)


async def test_matrix_shape_and_diagonal(provider):
    points = [(29.80, -95.41), (29.67, -95.32), (29.74, -95.52)]
    res = await provider.matrix(points)
    assert len(res.durations) == 3 and len(res.durations[0]) == 3
    # Diagonal is zero (no drive to self).
    for i in range(3):
        assert res.durations[i][i] == 0
        assert res.distances[i][i] == 0
    # Off-diagonal legs are positive and symmetric (Haversine is symmetric).
    assert res.durations[0][1] > 0
    assert res.durations[0][1] == res.durations[1][0]


async def test_matrix_uses_fallback_without_api(provider):
    res = await provider.matrix([(29.80, -95.41), (29.67, -95.32)])
    assert res.used_fallback is True
    # No Redis + no Google => every off-diagonal pair is a cache miss.
    assert res.cache_hits == 0
    assert res.cache_misses >= 1


async def test_grid_cell_dedup(provider):
    # Two points in the same 0.01deg cell collapse to one unique location, so a
    # 3-point matrix has only two distinct cells.
    points = [(29.801, -95.411), (29.8009, -95.4106), (29.67, -95.32)]
    res = await provider.matrix(points)
    # First two share a cell => zero travel time between them.
    assert res.durations[0][1] == 0
    assert res.durations[0][2] == res.durations[1][2]


def test_grid_cell_rounding(provider):
    assert provider._cell((29.8049, -95.4151)) == (29.80, -95.42)
