import pytest
from backend.app.engines.gis.service import (
    calculate_upwind_dispersion_cone,
    get_nodes_geojson,
    get_industries_geojson,
    get_event_gis_layers,
)
from backend.app.db.session import SessionLocal


def test_upwind_dispersion_cone_geometry():
    """Verify upwind plume dispersion cone calculation generates valid GeoJSON Polygon."""
    # Centroid near Ankleshwar (21.6320 N, 73.0150 E), wind from 135 deg (SE) -> upwind 315 deg (NW)
    cone = calculate_upwind_dispersion_cone(
        centroid_lat=21.6320,
        centroid_lon=73.0150,
        wind_direction_deg=135.0,
        length_km=4.5,
        angular_spread_deg=30.0,
    )

    assert cone["type"] == "Feature"
    assert cone["geometry"]["type"] == "Polygon"
    coords = cone["geometry"]["coordinates"][0]

    # Polygon must be closed (first and last coordinate identical)
    assert coords[0] == coords[-1]
    assert coords[0] == [73.0150, 21.6320]
    assert len(coords) >= 14 # Origin + 12 arc points + origin

    # Properties check
    props = cone["properties"]
    assert props["layer_type"] == "plume_dispersion_cone"
    assert props["upwind_bearing_deg"] == 315.0
    assert props["reach_km"] == 4.5


def test_nodes_and_industries_geojson_endpoints():
    """Verify nodes and industries GeoJSON collections return valid GeoJSON structure."""
    db = SessionLocal()
    try:
        nodes_gj = get_nodes_geojson(db)
        assert nodes_gj["type"] == "FeatureCollection"
        assert len(nodes_gj["features"]) > 0

        first_node = nodes_gj["features"][0]
        assert first_node["type"] == "Feature"
        assert first_node["geometry"]["type"] == "Point"
        assert "aqi" in first_node["properties"]
        assert "battery_percent" in first_node["properties"]

        ind_gj = get_industries_geojson(db)
        assert ind_gj["type"] == "FeatureCollection"
        assert len(ind_gj["features"]) > 0

        first_ind = ind_gj["features"][0]
        assert first_ind["type"] == "Feature"
        assert first_ind["geometry"]["type"] == "Point"
        assert "gspcb_consent_id" in first_ind["properties"]
        assert "emission_profile" in first_ind["properties"]
    finally:
        db.close()
