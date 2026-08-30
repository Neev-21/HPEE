"""
Weather Intelligence Engine — service.py

Fetches real-time meteorological Data-B from OpenMeteo API (free, no API key).
Used to independently verify the sensor node's own wind/temperature readings
and provide the `weather_data_quality` factor for Evidence Fusion.

OpenMeteo docs: https://open-meteo.com/en/docs
"""

import logging
import time
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from typing import Optional
import urllib.request
import json

logger = logging.getLogger(__name__)

# OpenMeteo free endpoint — no API key needed
_OPENMETEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude={lat}&longitude={lon}"
    "&hourly=wind_speed_10m,wind_direction_10m,temperature_2m,relative_humidity_2m"
    "&wind_speed_unit=ms"
    "&timezone=Asia%2FKolkata"
    "&forecast_days=1"
)

# Timeout for HTTP requests
_REQUEST_TIMEOUT_SEC = 8

# How old weather data can be before quality degrades (seconds)
_FRESH_THRESHOLD_SEC  = 3600   # 1 hour → quality 1.0
_STALE_THRESHOLD_SEC  = 7200   # 2 hours → quality 0.2


@dataclass
class WeatherObservation:
    """Result of a weather API fetch."""
    source: str
    fetched_at: datetime
    wind_speed_ms: float
    wind_direction_deg: float
    temperature_c: float
    humidity_percent: float
    data_age_seconds: float
    quality_score: float
    is_fallback: bool = False  # True if we used sensor's own readings as fallback


def _compute_quality_score(fetched_at: datetime) -> float:
    """
    Linear quality degradation:
    - 0 → 1 hour: 1.0
    - 1 → 2 hours: linearly from 1.0 to 0.2
    - > 2 hours: 0.2 (stale)
    """
    age_sec = (datetime.now(timezone.utc) - fetched_at).total_seconds()
    if age_sec <= _FRESH_THRESHOLD_SEC:
        return 1.0
    if age_sec >= _STALE_THRESHOLD_SEC:
        return 0.2
    fraction = (age_sec - _FRESH_THRESHOLD_SEC) / (_STALE_THRESHOLD_SEC - _FRESH_THRESHOLD_SEC)
    return round(1.0 - fraction * 0.8, 3)


def _parse_openmeteo_response(data: dict, lat: float, lon: float) -> WeatherObservation:
    """
    Parse the OpenMeteo API response and extract the most recent hourly values.
    OpenMeteo returns hourly arrays; we take the entry matching the current hour.
    """
    now = datetime.now(timezone.utc)
    hourly = data.get("hourly", {})

    times           = hourly.get("time", [])
    wind_speeds     = hourly.get("wind_speed_10m", [])
    wind_directions = hourly.get("wind_direction_10m", [])
    temperatures    = hourly.get("temperature_2m", [])
    humidities      = hourly.get("relative_humidity_2m", [])

    # Find the closest hour to now
    best_idx = 0
    best_diff = float("inf")
    for i, t_str in enumerate(times):
        try:
            t = datetime.fromisoformat(t_str).replace(tzinfo=timezone.utc)
            diff = abs((t - now).total_seconds())
            if diff < best_diff:
                best_diff = diff
                best_idx = i
        except Exception:
            continue

    def _safe(lst, idx, default):
        try:
            v = lst[idx]
            return float(v) if v is not None else default
        except (IndexError, TypeError):
            return default

    wind_speed  = _safe(wind_speeds,     best_idx, 3.0)
    wind_dir    = _safe(wind_directions, best_idx, 270.0)
    temperature = _safe(temperatures,    best_idx, 28.0)
    humidity    = _safe(humidities,      best_idx, 65.0)

    fetched_at = now
    return WeatherObservation(
        source="openmeteo",
        fetched_at=fetched_at,
        wind_speed_ms=round(wind_speed, 2),
        wind_direction_deg=round(wind_dir, 1),
        temperature_c=round(temperature, 1),
        humidity_percent=round(humidity, 1),
        data_age_seconds=0.0,
        quality_score=1.0,
        is_fallback=False,
    )


def fetch_weather(
    lat: float,
    lon: float,
    sensor_wind_speed: Optional[float] = None,
    sensor_wind_direction: Optional[float] = None,
    sensor_temperature: Optional[float] = None,
    sensor_humidity: Optional[float] = None,
) -> WeatherObservation:
    """
    Fetches real-time weather data from OpenMeteo for a given location.

    Falls back to the sensor node's own readings (Data-A) if the API is
    unavailable, with a degraded quality_score of 0.4.

    Args:
        lat, lon: Coordinates of the sensor node
        sensor_*: Fallback values from the sensor node's own readings

    Returns:
        WeatherObservation with wind, temperature, humidity, and quality_score
    """
    url = _OPENMETEO_URL.format(lat=round(lat, 6), lon=round(lon, 6))

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "HPEE/1.0"})
        with urllib.request.urlopen(req, timeout=_REQUEST_TIMEOUT_SEC) as resp:
            raw = resp.read()
            data = json.loads(raw)

        obs = _parse_openmeteo_response(data, lat, lon)
        logger.info(
            "OpenMeteo fetch OK — wind=%.1f m/s dir=%.0f deg temp=%.1f C",
            obs.wind_speed_ms, obs.wind_direction_deg, obs.temperature_c
        )
        return obs

    except Exception as e:
        logger.warning(
            "OpenMeteo fetch failed (%s) — falling back to sensor readings with quality=0.4", e
        )

    # ---------------------------------------------------------------------------
    # Fallback: use the sensor's own readings
    # ---------------------------------------------------------------------------
    return WeatherObservation(
        source="sensor_fallback",
        fetched_at=datetime.now(timezone.utc),
        wind_speed_ms=sensor_wind_speed or 3.0,
        wind_direction_deg=sensor_wind_direction or 270.0,
        temperature_c=sensor_temperature or 28.0,
        humidity_percent=sensor_humidity or 65.0,
        data_age_seconds=0.0,
        quality_score=0.4,  # Degraded: same sensor we're investigating
        is_fallback=True,
    )
