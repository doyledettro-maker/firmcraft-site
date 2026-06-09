"""Shared fixtures. All offline: no Redis, no Google — the DistanceProvider
falls back to Haversine, so the whole suite runs hermetically in CI."""

from __future__ import annotations

import pytest

from src.config import Settings
from src.distance import DistanceProvider


@pytest.fixture
def offline_settings() -> Settings:
    # Blank redis_url => no connection attempt; blank google key => Haversine.
    return Settings(redis_url="", google_maps_api_key="")


@pytest.fixture
def provider(offline_settings) -> DistanceProvider:
    return DistanceProvider(offline_settings)
