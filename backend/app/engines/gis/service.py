"""
GIS Mapping & Spatial Analysis Engine — service.py
---------------------------------------------------
Provides spatial calculations and GeoJSON layer generation for:
1. Upwind Gaussian dispersion cone calculation based on wind direction & speed.
2. Real-time sensor node GeoJSON layer with live AQI status and health.
3. Industrial facilities GeoJSON layer with consent status and emission profiles.
4. Comprehensive multi-layer event dossier for the GSPCB Inspector Map.
"""

import math
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text as sa_text
from uuid import UUID

from backend.app.models.sensor import SensorNode, SensorReading
from backend.app.models.industry import IndustrialSite
from backend.app.models.pollution_event import PollutionEvent
from backend.app.models.evidence import SourceAttribution, EvidenceRecord
from backend.app.models.geography import Village


def calculate_upwind_dispersion_cone(
    centroid_lat: float,
    centroid_lon: float,
    wind_direction_deg: float,
    length_km: float = 4.5,
    angular_spread_deg: float = 30.0,
    steps: int = 12,
) -> Dict[str, Any]:
    """
    Computes an upwind plume dispersion cone as a GeoJSON Polygon.
    
    If the wind is blowing towards azimuth theta (e.g. 135 deg SE), the plume came
    from the upwind direction (theta + 180 = 315 deg NW).
    The cone begins at the sensor centroid, opens symmetrically by +/- angular_spread_deg,
    and extends length_km into the upwind zone.
    """
    upwind_bearing = (wind_direction_deg + 180.0) % 360.0

    # Earth radius in kilometers
    r_earth = 6371.0
    lat_rad = math.radians(centroid_lat)
    lon_rad = math.radians(centroid_lon)

    left_bearing = (upwind_bearing - angular_spread_deg) % 360.0
    right_bearing = (upwind_bearing + angular_spread_deg) % 360.0

    polygon_coords: List[List[float]] = []
    # Origin apex at sensor node [lon, lat]
    polygon_coords.append([centroid_lon, centroid_lat])

    # Generate arc points along the outer edge from left bearing to right bearing
    for i in range(steps + 1):
        frac = i / float(steps)
        # Account for 360 wrap-around
        if right_bearing < left_bearing:
            current_bearing = (left_bearing + frac * (right_bearing + 360.0 - left_bearing)) % 360.0
        else:
            current_bearing = left_bearing + frac * (right_bearing - left_bearing)

        b_rad = math.radians(current_bearing)
        d_div_r = length_km / r_earth

        point_lat = math.asin(
            math.sin(lat_rad) * math.cos(d_div_r)
            + math.cos(lat_rad) * math.sin(d_div_r) * math.cos(b_rad)
        )
        point_lon = lon_rad + math.atan2(
            math.sin(b_rad) * math.sin(d_div_r) * math.cos(lat_rad),
            math.cos(d_div_r) - math.sin(lat_rad) * math.sin(point_lat),
        )

        polygon_coords.append([math.degrees(point_lon), math.degrees(point_lat)])

    # Close the polygon loop back to origin apex
    polygon_coords.append([centroid_lon, centroid_lat])

    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [polygon_coords],
        },
        "properties": {
            "layer_type": "plume_dispersion_cone",
            "wind_direction_deg": wind_direction_deg,
            "upwind_bearing_deg": upwind_bearing,
            "angular_spread_deg": angular_spread_deg,
            "reach_km": length_km,
            "color": "#ef4444",
            "fill_opacity": 0.25,
            "stroke": "#b91c1c",
            "stroke_width": 2,
        },
    }


def _get_aqi_category(pm25: Optional[float], so2: Optional[float]) -> Dict[str, Any]:
    """Calculates CPCB AQI status category and styling colors."""
    max_val = max(pm25 or 0.0, (so2 or 0.0) * 0.8)

    if max_val <= 30:
        return {"category": "Good", "color": "#22c55e", "code": "good"}
    elif max_val <= 60:
        return {"category": "Satisfactory", "color": "#84cc16", "code": "satisfactory"}
    elif max_val <= 90:
        return {"category": "Moderate", "color": "#eab308", "code": "moderate"}
    elif max_val <= 120:
        return {"category": "Poor", "color": "#f97316", "code": "poor"}
    elif max_val <= 250:
        return {"category": "Very Poor", "color": "#ef4444", "code": "very_poor"}
    else:
        return {"category": "Severe", "color": "#7f1d1d", "code": "severe"}


def get_nodes_geojson(db: Session) -> Dict[str, Any]:
    """
    Returns a GeoJSON FeatureCollection of all active sensor nodes
    with their most recent telemetry reading and calculated AQI status.
    """
    # Fetch all nodes with lat/lon from PostGIS
    query = sa_text("""
        SELECT 
            sn.node_id,
            sn.village_id,
            sn.status,
            sn.battery_percent,
            sn.signal_strength,
            sn.last_seen_at,
            ST_Y(sn.location::geometry) as lat,
            ST_X(sn.location::geometry) as lon,
            v.name as village_name,
            v.district as village_district
        FROM sensor_nodes sn
        LEFT JOIN villages v ON sn.village_id = v.village_id
        ORDER BY sn.node_id
    """)
    rows = db.execute(query).fetchall()

    features = []
    for r in rows:
        node_id = r[0]
        # Fetch latest reading
        latest_reading = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == node_id)
            .order_by(SensorReading.recorded_at.desc())
            .first()
        )

        raw_measurements = {}
        if latest_reading and latest_reading.raw_payload and isinstance(latest_reading.raw_payload, dict):
            raw_measurements = latest_reading.raw_payload.get("measurements", {}) or {}

        def extract_metric(key: str):
            value = raw_measurements.get(key)
            if isinstance(value, dict):
                return value.get("value")
            return None

        pm25 = latest_reading.pm25 if latest_reading else extract_metric("pm25")
        pm10 = extract_metric("pm10") if latest_reading else None
        so2 = latest_reading.so2 if latest_reading else extract_metric("so2")
        nox = extract_metric("nox")
        no2 = extract_metric("no2")
        co = extract_metric("co")
        co2 = extract_metric("co2")
        temp = latest_reading.temperature if latest_reading else extract_metric("temperature")
        hum = latest_reading.humidity if latest_reading else extract_metric("humidity")
        ws = latest_reading.wind_speed if latest_reading else extract_metric("wind_speed")
        wd = latest_reading.wind_direction if latest_reading else extract_metric("wind_direction")

        aqi_info = _get_aqi_category(pm25, so2)

        properties = {
            "node_id": node_id,
            "village_id": str(r[1]) if r[1] else None,
            "village_name": r[8] or "Ankleshwar Rural",
            "district": r[9] or "Bharuch",
            "status": r[2],
            "battery_percent": r[3],
            "signal_strength": r[4],
            "last_seen_at": r[5].isoformat() if r[5] else None,
            "pm25": pm25,
            "pm10": pm10,
            "so2": so2,
            "nox": nox,
            "no2": no2,
            "co": co,
            "co2": co2,
            "temperature": temp,
            "humidity": hum,
            "wind_speed": ws,
            "wind_direction": wd,
            "latest_telemetry": {
                "pm25": pm25,
                "pm10": pm10,
                "so2": so2,
                "nox": nox,
                "no2": no2,
                "co": co,
                "co2": co2,
                "temperature": temp,
                "humidity": hum,
                "wind_speed": ws,
                "wind_direction": wd,
            },
            "aqi": aqi_info.get("category"),
            "aqi_color": aqi_info.get("color"),
        }

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(r[7]), float(r[6])],
            },
            "properties": properties,
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def get_industries_geojson(db: Session) -> Dict[str, Any]:
    """
    Returns a GeoJSON FeatureCollection of all registered industrial sites
    with consent IDs, sector type, declared process, and chemical emission profiles.
    """
    query = sa_text("""
        SELECT 
            i.industry_id,
            i.name,
            i.industry_type,
            i.gspcb_consent_id,
            i.address,
            i.is_active,
            i.declared_process,
            i.emission_profile,
            ST_Y(i.location::geometry) as lat,
            ST_X(i.location::geometry) as lon,
            v.name as village_name
        FROM industrial_sites i
        LEFT JOIN villages v ON i.village_id = v.village_id
        ORDER BY i.name
    """)
    rows = db.execute(query).fetchall()

    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(r[9]), float(r[8])],
            },
            "properties": {
                "industry_id": str(r[0]),
                "name": r[1],
                "industry_type": r[2],
                "gspcb_consent_id": r[3],
                "address": r[4],
                "is_active": r[5],
                "declared_process": r[6],
                "emission_profile": r[7] or {},
                "village_name": r[10] or "GIDC Industrial Estate",
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def get_event_gis_layers(db: Session, event_id: str) -> Dict[str, Any]:
    """
    Generates a full multi-layer GeoJSON composite for a specific pollution event:
    1. Upwind dispersion cone polygon
    2. Attributed culprit industries with rank, distance, probability, and azimuth
    3. Affected sensor nodes with peak readings
    4. Main wind vector arrow
    """
    # Parse event UUID
    try:
        e_uuid = UUID(event_id)
    except ValueError:
        e_uuid = None

    event = db.query(PollutionEvent).filter(PollutionEvent.event_id == e_uuid).first()
    if not event:
        return {"error": "Event not found", "event_id": event_id}

    # Fetch source attributions
    attributions = (
        db.query(SourceAttribution)
        .filter(SourceAttribution.event_id == e_uuid)
        .order_by(SourceAttribution.rank.asc())
        .all()
    )

    # Determine event sensor coordinate centroid
    query_node = sa_text("""
        SELECT 
            sn.node_id,
            ST_Y(sn.location::geometry) as lat,
            ST_X(sn.location::geometry) as lon,
            sr.wind_speed,
            sr.wind_direction
        FROM event_readings er
        JOIN sensor_readings sr ON er.reading_id = sr.reading_id
        JOIN sensor_nodes sn ON sr.node_id = sn.node_id
        WHERE er.event_id = :eid
        ORDER BY sr.recorded_at DESC
        LIMIT 1
    """)
    node_row = db.execute(query_node, {"eid": e_uuid}).fetchone()

    sensor_lat = float(node_row[1]) if node_row else 21.6320
    sensor_lon = float(node_row[2]) if node_row else 73.0150
    wind_speed = float(node_row[3]) if (node_row and node_row[3] is not None) else 2.5
    wind_dir   = float(node_row[4]) if (node_row and node_row[4] is not None) else 135.0

    # 1. Upwind plume cone
    plume_cone = calculate_upwind_dispersion_cone(
        centroid_lat=sensor_lat,
        centroid_lon=sensor_lon,
        wind_direction_deg=wind_dir,
        length_km=4.5,
        angular_spread_deg=30.0,
    )

    # 2. Attributed industries layer
    industry_features = []
    for att in attributions:
        ind = db.query(IndustrialSite).filter(IndustrialSite.industry_id == att.industry_id).first()
        if not ind:
            continue

        loc_query = sa_text(
            "SELECT ST_Y(location::geometry), ST_X(location::geometry) FROM industrial_sites WHERE industry_id = :iid"
        )
        coords = db.execute(loc_query, {"iid": ind.industry_id}).fetchone()
        ind_lat = float(coords[0]) if coords else sensor_lat + 0.01
        ind_lon = float(coords[1]) if coords else sensor_lon - 0.01

        industry_features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [ind_lon, ind_lat],
            },
            "properties": {
                "industry_id": str(ind.industry_id),
                "name": ind.name,
                "industry_type": ind.industry_type,
                "gspcb_consent_id": ind.gspcb_consent_id,
                "rank": att.rank,
                "probability_score": att.probability_score,
                "confidence_percent": round(att.probability_score * 100, 1),
                "plume_model_params": att.plume_model_params or {},
                "is_primary_culprit": att.rank == 1,
            },
        })

    # 3. Wind vector line (from upwind center towards sensor centroid)
    upwind_rad = math.radians((wind_dir + 180.0) % 360.0)
    wind_origin_lat = sensor_lat + (3.5 / 111.0) * math.cos(upwind_rad)
    wind_origin_lon = sensor_lon + (3.5 / (111.0 * math.cos(math.radians(sensor_lat)))) * math.sin(upwind_rad)

    wind_vector_feature = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [wind_origin_lon, wind_origin_lat],
                [sensor_lon, sensor_lat],
            ],
        },
        "properties": {
            "layer_type": "wind_vector",
            "wind_direction_deg": wind_dir,
            "wind_speed_ms": wind_speed,
            "color": "#3b82f6",
            "stroke_width": 3,
        },
    }

    return {
        "event_id": str(event.event_id),
        "severity": event.severity,
        "started_at": event.started_at.isoformat() if event.started_at else None,
        "peak_pm25": event.peak_pm25,
        "peak_so2": event.peak_so2,
        "centroid": {"latitude": sensor_lat, "longitude": sensor_lon},
        "layers": {
            "plume_cone": plume_cone,
            "wind_vector": wind_vector_feature,
            "attributed_industries": {
                "type": "FeatureCollection",
                "features": industry_features,
            },
        },
    }
