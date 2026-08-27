"""Schema and Constraint Validation Test Suite

Validates all 19 approved tables, primary keys, foreign keys, check constraints,
indexes, and PostGIS spatial types against HPEE specification.
"""

import pytest
from sqlalchemy import CheckConstraint, UniqueConstraint, ForeignKeyConstraint, Index
from geoalchemy2 import Geography
from backend.app.models import Base

EXPECTED_TABLES = {
    "users",
    "villages",
    "weather_observations",
    "sensor_nodes",
    "sensor_configurations",
    "sensor_readings",
    "pollution_events",
    "event_readings",
    "industrial_sites",
    "industrial_activity",
    "event_classifications",
    "source_attributions",
    "evidence_records",
    "evidence_snapshots",
    "complaints",
    "complaint_documents",
    "notifications",
    "maintenance_records",
    "audit_logs",
}


def test_all_19_tables_exist():
    """Verify that all 19 approved tables are registered in Base.metadata."""
    registered_tables = set(Base.metadata.tables.keys())
    missing_tables = EXPECTED_TABLES - registered_tables
    extra_tables = registered_tables - EXPECTED_TABLES
    assert not missing_tables, f"Missing tables: {missing_tables}"
    assert not extra_tables, f"Extra unauthorized tables: {extra_tables}"
    assert len(registered_tables) == 19


def test_sensor_readings_constraints_and_indexes():
    """Validate sensor_readings columns, check constraints, and time-series indexes."""
    table = Base.metadata.tables["sensor_readings"]

    # 1. Primary key must be BigInteger
    pk_col = table.columns["reading_id"]
    assert str(pk_col.type).startswith("BIGINT") or "INT" in str(pk_col.type)

    # 2. Check recorded_at and received_at separation
    assert "recorded_at" in table.columns
    assert "received_at" in table.columns
    assert table.columns["recorded_at"].type.timezone is True
    assert table.columns["received_at"].type.timezone is True

    # 3. Check constraints
    check_names = {c.name for c in table.constraints if isinstance(c, CheckConstraint)}
    assert "chk_reading_pm25_non_negative" in check_names
    assert "chk_reading_so2_non_negative" in check_names
    assert "chk_reading_humidity_range" in check_names
    assert "chk_reading_wind_speed_non_negative" in check_names
    assert "chk_reading_wind_direction_range" in check_names

    # 4. Time-series indexes
    index_names = {idx.name for idx in table.indexes}
    assert "ix_sensor_readings_node_recorded" in index_names
    assert "ix_sensor_readings_recorded_at" in index_names


def test_weather_observations_check_constraints():
    """Validate check constraints on weather_observations table."""
    table = Base.metadata.tables["weather_observations"]
    check_names = {c.name for c in table.constraints if isinstance(c, CheckConstraint)}
    assert "chk_weather_humidity_range" in check_names
    assert "chk_weather_wind_speed_non_negative" in check_names
    assert "chk_weather_wind_direction_range" in check_names


def test_ml_and_evidence_probability_constraints():
    """Validate confidence and probability score range constraints [0, 1]."""
    # Event Classification
    ec_table = Base.metadata.tables["event_classifications"]
    ec_checks = {c.name for c in ec_table.constraints if isinstance(c, CheckConstraint)}
    assert "chk_classification_confidence_range" in ec_checks

    # Source Attribution
    sa_table = Base.metadata.tables["source_attributions"]
    sa_checks = {c.name for c in sa_table.constraints if isinstance(c, CheckConstraint)}
    assert "chk_attribution_probability_range" in sa_checks

    # Evidence Record
    er_table = Base.metadata.tables["evidence_records"]
    er_checks = {c.name for c in er_table.constraints if isinstance(c, CheckConstraint)}
    assert "chk_evidence_confidence_range" in er_checks


def test_spatial_geography_columns():
    """Verify that spatial columns use Geography(POINT, 4326)."""
    spatial_checks = [
        ("villages", "center_location"),
        ("sensor_nodes", "location"),
        ("sensor_readings", "location"),
        ("industrial_sites", "location"),
        ("weather_observations", "location"),
    ]

    for tbl_name, col_name in spatial_checks:
        col = Base.metadata.tables[tbl_name].columns[col_name]
        assert isinstance(col.type, Geography), f"{tbl_name}.{col_name} is not a Geography type"
        assert col.type.geometry_type == "POINT", f"{tbl_name}.{col_name} geometry type is not POINT"
        assert col.type.srid == 4326, f"{tbl_name}.{col_name} SRID is not 4326"


def test_unique_constraints():
    """Verify unique constraints and flags on required business keys."""
    # users.email
    users_table = Base.metadata.tables["users"]
    email_col = users_table.columns["email"]
    assert email_col.unique is True or any(
        "email" in [col.name for col in u.columns]
        for u in users_table.constraints
        if isinstance(u, UniqueConstraint)
    ) or any(
        "email" in [col.name for col in idx.columns]
        for idx in users_table.indexes
        if idx.unique
    )

    # complaints.complaint_number
    complaints_table = Base.metadata.tables["complaints"]
    cmp_col = complaints_table.columns["complaint_number"]
    assert cmp_col.unique is True or any(
        "complaint_number" in [col.name for col in u.columns]
        for u in complaints_table.constraints
        if isinstance(u, UniqueConstraint)
    )

    # industrial_sites.gspcb_consent_id
    ind_table = Base.metadata.tables["industrial_sites"]
    gspcb_col = ind_table.columns["gspcb_consent_id"]
    assert gspcb_col.unique is True or any(
        "gspcb_consent_id" in [col.name for col in u.columns]
        for u in ind_table.constraints
        if isinstance(u, UniqueConstraint)
    )


def test_foreign_key_relationships():
    """Verify presence of foreign keys across tables."""
    fk_checks = [
        ("sensor_nodes", "village_id", "villages.village_id"),
        ("sensor_configurations", "node_id", "sensor_nodes.node_id"),
        ("sensor_readings", "node_id", "sensor_nodes.node_id"),
        ("pollution_events", "village_id", "villages.village_id"),
        ("event_readings", "event_id", "pollution_events.event_id"),
        ("event_readings", "reading_id", "sensor_readings.reading_id"),
        ("industrial_sites", "village_id", "villages.village_id"),
        ("industrial_activity", "industry_id", "industrial_sites.industry_id"),
        ("event_classifications", "event_id", "pollution_events.event_id"),
        ("source_attributions", "event_id", "pollution_events.event_id"),
        ("source_attributions", "industry_id", "industrial_sites.industry_id"),
        ("evidence_records", "event_id", "pollution_events.event_id"),
        ("evidence_snapshots", "event_id", "pollution_events.event_id"),
        ("complaints", "event_id", "pollution_events.event_id"),
        ("complaints", "filed_by_user_id", "users.user_id"),
        ("complaints", "village_id", "villages.village_id"),
        ("complaint_documents", "complaint_id", "complaints.complaint_id"),
        ("complaint_documents", "generated_by_user_id", "users.user_id"),
        ("notifications", "recipient_user_id", "users.user_id"),
        ("maintenance_records", "node_id", "sensor_nodes.node_id"),
        ("audit_logs", "user_id", "users.user_id"),
    ]

    for source_tbl, source_col, target in fk_checks:
        tbl = Base.metadata.tables[source_tbl]
        fks = [
            f"{fk.column.table.name}.{fk.column.name}"
            for fk in tbl.columns[source_col].foreign_keys
        ]
        assert target in fks, f"Missing foreign key {source_tbl}.{source_col} -> {target}"


def test_check_constraint_sql_clauses():
    """Verify exact check constraint expressions match the specification."""
    # Sensor reading PM2.5 >= 0, SO2 >= 0, humidity [0, 100], wind [0, 360)
    sr = Base.metadata.tables["sensor_readings"]
    sr_checks = {c.name: str(c.sqltext) for c in sr.constraints if isinstance(c, CheckConstraint)}
    assert "pm25 >= 0" in sr_checks["chk_reading_pm25_non_negative"]
    assert "so2 >= 0" in sr_checks["chk_reading_so2_non_negative"]
    assert "humidity >= 0" in sr_checks["chk_reading_humidity_range"] and "100" in sr_checks["chk_reading_humidity_range"]
    assert "wind_direction >= 0" in sr_checks["chk_reading_wind_direction_range"] and "360" in sr_checks["chk_reading_wind_direction_range"]

    # Weather observations
    wo = Base.metadata.tables["weather_observations"]
    wo_checks = {c.name: str(c.sqltext) for c in wo.constraints if isinstance(c, CheckConstraint)}
    assert "humidity >= 0" in wo_checks["chk_weather_humidity_range"] and "100" in wo_checks["chk_weather_humidity_range"]
    assert "wind_direction >= 0" in wo_checks["chk_weather_wind_direction_range"] and "360" in wo_checks["chk_weather_wind_direction_range"]

    # Battery
    sn = Base.metadata.tables["sensor_nodes"]
    sn_checks = {c.name: str(c.sqltext) for c in sn.constraints if isinstance(c, CheckConstraint)}
    assert "battery_percent >= 0" in sn_checks["chk_sensor_node_battery_range"] and "100" in sn_checks["chk_sensor_node_battery_range"]

