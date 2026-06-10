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


# ---------------------------------------------------------------------------
# Google Routes 625-element chunking
# ---------------------------------------------------------------------------

def test_chunks_respect_element_cap_and_cover_all_missing_pairs():
    # 40 cells, every off-diagonal pair missing => 1560 elements, far over 625.
    missing = {i: [j for j in range(40) if j != i] for i in range(40)}
    needed = {(i, j) for i, dests in missing.items() for j in dests}
    covered = set()
    for o_chunk, d_chunk in DistanceProvider._chunks(missing):
        assert len(o_chunk) * len(d_chunk) <= 625
        assert len(o_chunk) <= 25
        covered |= {(i, j) for i in o_chunk for j in d_chunk}
    assert needed <= covered


def test_chunks_request_only_origins_with_missing_pairs():
    # One cold pair must not re-bill the whole matrix.
    missing = {3: [7]}
    blocks = list(DistanceProvider._chunks(missing))
    assert blocks == [([3], [7])]


async def test_large_matrix_chunked_through_api(monkeypatch):
    # 30 distinct cells = 900 elements: must be split into <=625-element calls
    # and still fill the full matrix with API (not Haversine) values.
    from src.config import Settings

    p = DistanceProvider(Settings(redis_url="", google_maps_api_key="key"))
    calls: list[tuple[int, int]] = []

    async def fake_call(origins, destinations):
        calls.append((len(origins), len(destinations)))
        return [
            {"originIndex": oi, "destinationIndex": di, "seconds": 111, "meters": 999}
            for oi in range(len(origins))
            for di in range(len(destinations))
        ]

    monkeypatch.setattr(p, "_call_routes_api", fake_call)
    points = [(29.0 + i * 0.1, -95.0) for i in range(30)]
    res = await p.matrix(points)

    assert len(calls) > 1
    assert all(o * d <= 625 for o, d in calls)
    assert res.used_fallback is False
    assert res.api_elements == sum(o * d for o, d in calls)
    for i in range(30):
        for j in range(30):
            assert res.durations[i][j] == (0 if i == j else 111)
            assert res.distances[i][j] == (0 if i == j else 999)


async def test_api_failure_is_logged_not_silent(monkeypatch, caplog):
    from src.config import Settings

    p = DistanceProvider(Settings(redis_url="", google_maps_api_key="key"))

    async def boom(origins, destinations):
        raise RuntimeError("400 from Google")

    monkeypatch.setattr(p, "_call_routes_api", boom)
    with caplog.at_level("ERROR", logger="dispatch_optimizer.distance"):
        res = await p.matrix([(29.80, -95.41), (29.67, -95.32)])

    # Falls back to Haversine and says so, instead of swallowing the error.
    assert res.used_fallback is True
    assert any("computeRouteMatrix failed" in r.message for r in caplog.records)
