"""Seed Data Integrity and Determinism Test Suite

Validates that synthetic development data adheres to all business rules,
geographic boundaries, value bounds, and determinism.
"""

from database.seed.gujarat_corridor_data import (
    USERS_DATA,
    VILLAGES_DATA,
    INDUSTRIAL_SITES_DATA,
    SENSOR_NODES_DATA,
)
from database.seed.telemetry_generator import generate_synthetic_dataset


def test_corridor_static_entities_counts():
    """Verify entity counts meet the requirements (10-20 villages, 10-20 nodes, 10-50 industries)."""
    assert 10 <= len(VILLAGES_DATA) <= 20, f"Expected 10-20 villages, got {len(VILLAGES_DATA)}"
    assert 10 <= len(SENSOR_NODES_DATA) <= 20, f"Expected 10-20 sensor nodes, got {len(SENSOR_NODES_DATA)}"
    assert 10 <= len(INDUSTRIAL_SITES_DATA) <= 50, f"Expected 10-50 industrial sites, got {len(INDUSTRIAL_SITES_DATA)}"
    assert len(USERS_DATA) >= 4, f"Expected at least 4 test user personas, got {len(USERS_DATA)}"


def test_seed_coordinates_within_gujarat_corridor():
    """Verify all latitude/longitude coordinates fall within the Bharuch/Gujarat industrial corridor bounding box."""
    # Bounding box for Ankleshwar-Dahej-Panoli-Jhagadia corridor:
    # Lat: 21.4 to 21.9 N, Lon: 72.4 to 73.3 E
    for v in VILLAGES_DATA:
        assert 21.4 <= v["latitude"] <= 21.9, f"Village {v['name']} latitude out of corridor: {v['latitude']}"
        assert 72.4 <= v["longitude"] <= 73.3, f"Village {v['name']} longitude out of corridor: {v['longitude']}"

    for node in SENSOR_NODES_DATA:
        assert 21.4 <= node["latitude"] <= 21.9, f"Node {node['node_id']} latitude out of corridor: {node['latitude']}"
        assert 72.4 <= node["longitude"] <= 73.3, f"Node {node['node_id']} longitude out of corridor: {node['longitude']}"

    for ind in INDUSTRIAL_SITES_DATA:
        assert 21.4 <= ind["latitude"] <= 21.9, f"Industry {ind['name']} latitude out of corridor: {ind['latitude']}"
        assert 72.4 <= ind["longitude"] <= 73.3, f"Industry {ind['name']} longitude out of corridor: {ind['longitude']}"


def test_deterministic_telemetry_generation():
    """Verify that dataset generation is deterministic and satisfies all physical constraints."""
    villages_map = {v["name"]: {"village_id": f"dummy-v-{i}", "name": v["name"]} for i, v in enumerate(VILLAGES_DATA)}
    industries_map = {ind["name"]: {"industry_id": f"dummy-ind-{i}", "name": ind["name"]} for i, ind in enumerate(INDUSTRIAL_SITES_DATA)}
    users_map = {u["email"]: {"user_id": f"dummy-u-{i}", "email": u["email"]} for i, u in enumerate(USERS_DATA)}

    dataset_1 = generate_synthetic_dataset(
        nodes=SENSOR_NODES_DATA,
        villages_map=villages_map,
        industries_map=industries_map,
        users_map=users_map,
        days=7,
        interval_minutes=30
    )

    dataset_2 = generate_synthetic_dataset(
        nodes=SENSOR_NODES_DATA,
        villages_map=villages_map,
        industries_map=industries_map,
        users_map=users_map,
        days=7,
        interval_minutes=30
    )

    # 1. Determinism check
    assert len(dataset_1["readings"]) == len(dataset_2["readings"])
    assert dataset_1["readings"][0]["pm25"] == dataset_2["readings"][0]["pm25"]
    assert dataset_1["readings"][-1]["so2"] == dataset_2["readings"][-1]["so2"]

    # 2. Reading value bounds
    for r in dataset_1["readings"]:
        assert r["pm25"] >= 0.0, f"Negative PM2.5 found: {r['pm25']}"
        assert r["so2"] >= 0.0, f"Negative SO2 found: {r['so2']}"
        assert 0.0 <= r["humidity"] <= 100.0, f"Humidity out of bounds: {r['humidity']}"
        assert 0.0 <= r["wind_direction"] < 360.0, f"Wind direction out of bounds: {r['wind_direction']}"
        assert r["wind_speed"] >= 0.0, f"Negative wind speed: {r['wind_speed']}"

    # 3. Events check: At least 3 pollution events
    assert len(dataset_1["events"]) >= 3, f"Expected at least 3 events, got {len(dataset_1['events'])}"
    event_types = {c["classification_type"] for c in dataset_1["classifications"]}
    assert "industrial" in event_types
    assert "agricultural_burning" in event_types
    assert "seasonal_inversion" in event_types

    # 4. Sensor fault check
    assert any(r["pm25_quality"] == "invalid" for r in dataset_1["readings"]), "Expected at least 1 sensor fault reading"
    assert len(dataset_1["maintenance_records"]) >= 1, "Expected maintenance record for faulty sensor node"

    # 5. GSPCB Complaint and Evidence Snapshot check
    assert len(dataset_1["complaints"]) >= 1
    cmp = dataset_1["complaints"][0]
    assert "GSPCB Form-A" in cmp["gspcb_form_data"]["form_title"]
    assert len(dataset_1["snapshots"]) >= 1
    assert len(dataset_1["attributions"]) >= 1
