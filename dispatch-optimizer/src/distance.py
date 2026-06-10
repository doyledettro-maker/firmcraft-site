"""Distance/duration matrix with caching, a cost circuit breaker, and a
straight-line fallback.

Pipeline for ``matrix(points)``:

1. Snap every point to a grid cell (``distance_grid_precision`` decimals; 2 =>
   0.01deg ~= 1.1 km). Points in the same cell share a cache entry, so a new job
   on the same block as a recent one is a cache hit.
2. Look up every unique cell-pair in Redis (24h TTL).
3. On a miss, call the Google Routes ``computeRouteMatrix`` endpoint for the
   unique cells — unless the circuit breaker has tripped (estimated daily spend
   over budget) or no API key is configured.
4. Anything still unresolved (API disabled / over budget / error) falls back to
   a Haversine straight-line estimate.

Caching by grid cell is what makes the >50% hit-rate target reachable: after the
first solve of the day most cell-pairs in a metro are already warm.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from datetime import date
from typing import Iterator, Optional, Sequence

import httpx

from .config import Settings, get_settings

logger = logging.getLogger("dispatch_optimizer.distance")

try:  # redis is optional at runtime — a missing/broken Redis degrades to no-cache
    import redis.asyncio as aioredis
except Exception:  # pragma: no cover
    aioredis = None  # type: ignore

EARTH_RADIUS_M = 6_371_000.0
ROUTES_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"

# computeRouteMatrix caps a TRAFFIC_AWARE request at 625 elements
# (origins × destinations) — larger requests 400. Real fleets exceed this fast
# (5 techs + 20 jobs = 25 cells = 625 elements is already the edge), so missing
# pairs are fetched in sub-625-element blocks.
MAX_MATRIX_ELEMENTS = 625
MAX_MATRIX_SIDE = 25


@dataclass
class MatrixResult:
    """Durations (seconds) and distances (meters), indexed by input order."""

    durations: list[list[int]]  # seconds
    distances: list[list[int]]  # meters
    cache_hits: int = 0
    cache_misses: int = 0
    api_elements: int = 0  # elements fetched from Google this call
    used_fallback: bool = False

    @property
    def hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        return (self.cache_hits / total) if total else 0.0


def haversine_meters(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle distance in meters between (lat, lng) pairs."""
    lat1, lng1 = a
    lat2, lng2 = b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))


class DistanceProvider:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self._redis = None
        self._redis_ready = False

    # ---- Redis lifecycle -------------------------------------------------
    async def _get_redis(self):
        if self._redis_ready:
            return self._redis
        self._redis_ready = True
        if aioredis is None or not self.settings.redis_url:
            self._redis = None
            return None
        try:
            client = aioredis.from_url(self.settings.redis_url, decode_responses=True)
            await client.ping()
            self._redis = client
        except Exception:
            # No Redis? Run without a cache rather than failing the request.
            self._redis = None
        return self._redis

    async def close(self) -> None:
        if self._redis is not None:
            try:
                await self._redis.aclose()
            except Exception:
                pass

    # ---- grid-cell helpers ----------------------------------------------
    def _cell(self, point: tuple[float, float]) -> tuple[float, float]:
        p = self.settings.distance_grid_precision
        return (round(point[0], p), round(point[1], p))

    @staticmethod
    def _pair_key(o: tuple[float, float], d: tuple[float, float]) -> str:
        return f"dm:{o[0]}:{o[1]}:{d[0]}:{d[1]}"

    @staticmethod
    def _spend_key() -> str:
        return f"dm:spend:{date.today().isoformat()}"

    # ---- circuit breaker -------------------------------------------------
    async def _today_spend(self) -> float:
        r = await self._get_redis()
        if r is None:
            return 0.0
        try:
            v = await r.get(self._spend_key())
            return float(v) if v else 0.0
        except Exception:
            return 0.0

    async def _add_spend(self, usd: float) -> None:
        r = await self._get_redis()
        if r is None or usd <= 0:
            return
        try:
            await r.incrbyfloat(self._spend_key(), usd)
            await r.expire(self._spend_key(), self.settings.distance_cache_ttl)
        except Exception:
            pass

    # ---- public API ------------------------------------------------------
    async def matrix(self, points: Sequence[tuple[float, float]]) -> MatrixResult:
        """Full N×N duration/distance matrix for ``points`` (lat, lng)."""
        n = len(points)
        durations = [[0] * n for _ in range(n)]
        distances = [[0] * n for _ in range(n)]
        if n == 0:
            return MatrixResult(durations, distances)

        cells = [self._cell(p) for p in points]
        # Unique cells preserve a stable index for the API call.
        uniq: list[tuple[float, float]] = []
        cell_index: dict[tuple[float, float], int] = {}
        for c in cells:
            if c not in cell_index:
                cell_index[c] = len(uniq)
                uniq.append(c)

        k = len(uniq)
        # Per cell-pair cache: dur[i][j], dist[i][j] over unique cells.
        dur = [[None] * k for _ in range(k)]  # type: ignore
        dist = [[None] * k for _ in range(k)]  # type: ignore

        result = MatrixResult(durations, distances)
        await self._load_from_cache(uniq, dur, dist, result)

        missing = [
            (i, j)
            for i in range(k)
            for j in range(k)
            if dur[i][j] is None
        ]
        if missing:
            await self._fill_missing(uniq, dur, dist, result)

        # Anything still unresolved => Haversine (also covers i==j => 0).
        for i in range(k):
            for j in range(k):
                if dur[i][j] is None:
                    meters = 0.0 if i == j else haversine_meters(uniq[i], uniq[j])
                    dur[i][j] = int(meters / self.settings.fallback_speed_mps)
                    dist[i][j] = int(meters)
                    result.used_fallback = True

        # Expand unique-cell matrix back to the full N×N input order.
        for a in range(n):
            ia = cell_index[cells[a]]
            for b in range(n):
                ib = cell_index[cells[b]]
                durations[a][b] = int(dur[ia][ib])
                distances[a][b] = int(dist[ia][ib])
        return result

    async def _load_from_cache(self, uniq, dur, dist, result: MatrixResult) -> None:
        k = len(uniq)
        for i in range(k):
            dur[i][i] = 0
            dist[i][i] = 0
        r = await self._get_redis()
        if r is None:
            # No cache: every off-diagonal pair is a miss.
            result.cache_misses += k * k - k
            return
        keys, idx = [], []
        for i in range(k):
            for j in range(k):
                if i == j:
                    continue
                keys.append(self._pair_key(uniq[i], uniq[j]))
                idx.append((i, j))
        if not keys:
            return
        try:
            vals = await r.mget(keys)
        except Exception:
            vals = [None] * len(keys)
        for (i, j), v in zip(idx, vals):
            if v:
                d_s, m = v.split(",")
                dur[i][j] = int(d_s)
                dist[i][j] = int(m)
                result.cache_hits += 1
            else:
                result.cache_misses += 1

    @staticmethod
    def _chunks(
        missing_by_origin: dict[int, list[int]],
    ) -> Iterator[tuple[list[int], list[int]]]:
        """Split missing pairs into ≤MAX_MATRIX_ELEMENTS origin×destination blocks.

        Origins are grouped (≤25 per block, the per-side cap), each group's
        needed destinations unioned, and the destination list sliced so the
        block's cross product stays under the element cap. Only origins with
        missing pairs are requested — one cold pair no longer re-bills k².
        """
        origins = sorted(missing_by_origin)
        for a in range(0, len(origins), MAX_MATRIX_SIDE):
            o_chunk = origins[a : a + MAX_MATRIX_SIDE]
            dests = sorted({j for i in o_chunk for j in missing_by_origin[i]})
            per = max(1, MAX_MATRIX_ELEMENTS // len(o_chunk))
            for b in range(0, len(dests), per):
                yield o_chunk, dests[b : b + per]

    async def _fill_missing(self, uniq, dur, dist, result: MatrixResult) -> None:
        """Fetch unresolved cell-pairs from Google Routes, honoring the breaker."""
        if not self.settings.google_maps_api_key:
            return  # no key => Haversine handles the rest
        k = len(uniq)
        missing_by_origin: dict[int, list[int]] = {}
        for i in range(k):
            dests = [j for j in range(k) if j != i and dur[i][j] is None]
            if dests:
                missing_by_origin[i] = dests
        if not missing_by_origin:
            return

        r = await self._get_redis()
        ttl = self.settings.distance_cache_ttl

        for o_chunk, d_chunk in self._chunks(missing_by_origin):
            elements = len(o_chunk) * len(d_chunk)
            cost = elements * self.settings.distance_cost_per_element
            if await self._today_spend() + cost > self.settings.distance_daily_budget_usd:
                # Circuit breaker tripped: stay on cached + Haversine for the day.
                logger.warning(
                    "distance budget exhausted; skipping %d-element Routes chunk "
                    "(Haversine fallback)",
                    elements,
                )
                return
            try:
                rows = await self._call_routes_api(
                    [uniq[i] for i in o_chunk], [uniq[j] for j in d_chunk]
                )
            except Exception:
                logger.exception(
                    "Google Routes computeRouteMatrix failed for a %dx%d chunk; "
                    "those pairs fall back to Haversine",
                    len(o_chunk),
                    len(d_chunk),
                )
                continue
            result.api_elements += elements
            await self._add_spend(cost)
            pipe = r.pipeline() if r is not None else None
            for cell in rows:
                gi = o_chunk[cell["originIndex"]]
                gj = d_chunk[cell["destinationIndex"]]
                if gi == gj:
                    continue
                d_s = cell["seconds"]
                m = cell["meters"]
                dur[gi][gj] = d_s
                dist[gi][gj] = m
                if pipe is not None:
                    pipe.set(self._pair_key(uniq[gi], uniq[gj]), f"{d_s},{m}", ex=ttl)
            if pipe is not None:
                try:
                    await pipe.execute()
                except Exception:
                    logger.warning("Redis pipeline write failed; chunk not cached")

    async def _call_routes_api(self, origins, destinations) -> list[dict]:
        """POST computeRouteMatrix and normalize the response rows.

        originIndex/destinationIndex in the result are positions in the
        *request* lists — the caller maps them back to global cell indices.
        """
        def wp(cell):
            return {"waypoint": {"location": {"latLng": {"latitude": cell[0], "longitude": cell[1]}}}}

        body = {
            "origins": [wp(c) for c in origins],
            "destinations": [wp(c) for c in destinations],
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.settings.google_maps_api_key,
            "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,condition",
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(ROUTES_MATRIX_URL, json=body, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        out = []
        for cell in data:
            # duration is like "1234s"; condition ROUTE_NOT_FOUND => skip (Haversine).
            if cell.get("condition") == "ROUTE_NOT_FOUND":
                continue
            dur_str = cell.get("duration", "0s")
            seconds = int(str(dur_str).rstrip("s") or 0)
            out.append(
                {
                    "originIndex": cell["originIndex"],
                    "destinationIndex": cell["destinationIndex"],
                    "seconds": seconds,
                    "meters": int(cell.get("distanceMeters", 0)),
                }
            )
        return out
