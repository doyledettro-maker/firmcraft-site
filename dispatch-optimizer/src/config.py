"""Runtime configuration, loaded from environment / .env.

Everything the service needs to reach external systems (Supabase, Google Routes,
Redis) and to tune the distance cache and circuit breaker lives here. Defaults
are chosen so the service runs locally with no external dependencies: blank
``google_maps_api_key`` forces Haversine fallback, and a missing Redis just
disables caching rather than crashing.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Bearer token required on every endpoint except /health. The service does
    # service-role DB writes, so it FAILS CLOSED: with this unset, all requests
    # are rejected. Callers send `Authorization: Bearer <key>`.
    dispatch_api_key: str = ""

    # Supabase (service-role key — bypasses RLS, server-side only).
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Google Routes API. Blank => Haversine fallback only.
    google_maps_api_key: str = ""

    # Redis distance cache.
    redis_url: str = "redis://localhost:6379/0"
    distance_grid_precision: int = 2  # decimal places; 2 => 0.01deg grid (~1km)
    distance_cache_ttl: int = 86_400  # 24h

    # Cost circuit breaker for the Google Routes API.
    distance_daily_budget_usd: float = 15.0
    distance_cost_per_element: float = 0.005  # $5 / 1000 elements

    # Haversine fallback driving speed (m/s). ~25 mph metro average.
    fallback_speed_mps: float = 11.176

    # Service. Bind loopback by default — in production the service sits behind
    # the Caddy reverse proxy on the VPS and must not be reachable directly.
    # (Inside Docker the container still listens on 0.0.0.0; the loopback
    # restriction is applied at the published port in docker-compose.yml.)
    host: str = "127.0.0.1"
    port: int = 8080
    log_level: str = "info"


@lru_cache
def get_settings() -> Settings:
    """Cached singleton so config is parsed once per process."""
    return Settings()
