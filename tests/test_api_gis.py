from unittest.mock import patch
import pytest

def test_list_nodes_geojson(client):
    with patch("backend.app.api.v1.gis.get_nodes_geojson") as mock_get_nodes:
        mock_get_nodes.return_value = {"type": "FeatureCollection", "features": []}
        
        response = client.get("/api/v1/gis/nodes")
        
        assert response.status_code == 200
        assert response.json() == {"type": "FeatureCollection", "features": []}

def test_list_industries_geojson(client):
    with patch("backend.app.api.v1.gis.get_industries_geojson") as mock_get_industries:
        mock_get_industries.return_value = {"type": "FeatureCollection", "features": []}
        
        response = client.get("/api/v1/gis/industries")
        
        assert response.status_code == 200
        assert response.json() == {"type": "FeatureCollection", "features": []}

def test_get_event_layers(client):
    with patch("backend.app.api.v1.gis.get_event_gis_layers") as mock_get_layers:
        mock_get_layers.return_value = {"event": {"type": "FeatureCollection", "features": []}}
        
        response = client.get("/api/v1/gis/event/test-event-id/layers")
        
        assert response.status_code == 200
        assert response.json() == {"event": {"type": "FeatureCollection", "features": []}}

def test_get_event_layers_not_found(client):
    with patch("backend.app.api.v1.gis.get_event_gis_layers") as mock_get_layers:
        mock_get_layers.return_value = {"error": "Event not found"}
        
        response = client.get("/api/v1/gis/event/missing-event-id/layers")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Event not found"

def test_compute_plume_cone(client):
    with patch("backend.app.api.v1.gis.calculate_upwind_dispersion_cone") as mock_calc:
        mock_calc.return_value = {"type": "Polygon", "coordinates": []}
        
        response = client.get("/api/v1/gis/plume-cone?lat=21.6320&lon=73.0150&wind_direction=135.0")
        
        assert response.status_code == 200
        assert response.json() == {"type": "Polygon", "coordinates": []}
        mock_calc.assert_called_once_with(
            centroid_lat=21.6320,
            centroid_lon=73.0150,
            wind_direction_deg=135.0,
            length_km=4.5,
            angular_spread_deg=30.0
        )
