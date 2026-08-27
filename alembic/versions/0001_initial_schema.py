"""Initial HPEE schema migration covering all 19 approved tables

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-27 12:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable Required PostgreSQL Extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. Table: users
    op.create_table(
        "users",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default=sa.text("'public'")),
        sa.Column("phone_number", sa.String(length=32), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("user_id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email")
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 3. Table: villages
    op.create_table(
        "villages",
        sa.Column("village_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("district", sa.String(length=128), nullable=False),
        sa.Column("state", sa.String(length=128), server_default=sa.text("'Gujarat'"), nullable=False),
        sa.Column("center_location", geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, spatial_index=False, from_text="ST_GeogFromText", name="geography", nullable=False), nullable=False),
        sa.Column("population", sa.Integer(), nullable=True),
        sa.Column("boundary_geojson", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("village_id", name="pk_villages")
    )
    op.create_index("ix_villages_name", "villages", ["name"], unique=False)
    op.create_index("idx_villages_center_location", "villages", ["center_location"], postgresql_using="gist")

    # 4. Table: weather_observations
    op.create_table(
        "weather_observations",
        sa.Column("weather_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, spatial_index=False, from_text="ST_GeogFromText", name="geography", nullable=False), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("humidity", sa.Float(), nullable=True),
        sa.Column("wind_speed", sa.Float(), nullable=True),
        sa.Column("wind_direction", sa.Float(), nullable=True),
        sa.Column("pressure", sa.Float(), nullable=True),
        sa.Column("source_provider", sa.String(length=64), server_default=sa.text("'IMD_OR_MET'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("weather_id", name="pk_weather_observations"),
        sa.CheckConstraint("humidity >= 0.0 AND humidity <= 100.0", name="chk_weather_humidity_range"),
        sa.CheckConstraint("wind_speed >= 0.0", name="chk_weather_wind_speed_non_negative"),
        sa.CheckConstraint("wind_direction >= 0.0 AND wind_direction < 360.0", name="chk_weather_wind_direction_range")
    )
    op.create_index("ix_weather_observations_recorded_at", "weather_observations", ["recorded_at"], unique=False)
    op.create_index("idx_weather_observations_location", "weather_observations", ["location"], postgresql_using="gist")

    # 5. Table: sensor_nodes
    op.create_table(
        "sensor_nodes",
        sa.Column("node_id", sa.String(length=64), nullable=False),
        sa.Column("village_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("location", geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, spatial_index=False, from_text="ST_GeogFromText", name="geography", nullable=False), nullable=False),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'online'"), nullable=False),
        sa.Column("battery_percent", sa.Float(), nullable=True),
        sa.Column("signal_strength", sa.Integer(), nullable=True),
        sa.Column("installed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["village_id"], ["villages.village_id"], ondelete="SET NULL", name="fk_sensor_nodes_village_id"),
        sa.PrimaryKeyConstraint("node_id", name="pk_sensor_nodes"),
        sa.CheckConstraint("battery_percent >= 0.0 AND battery_percent <= 100.0", name="chk_sensor_node_battery_range")
    )
    op.create_index("ix_sensor_nodes_village_id", "sensor_nodes", ["village_id"], unique=False)
    op.create_index("idx_sensor_nodes_location", "sensor_nodes", ["location"], postgresql_using="gist")

    # 6. Table: sensor_configurations
    op.create_table(
        "sensor_configurations",
        sa.Column("configuration_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("node_id", sa.String(length=64), nullable=False),
        sa.Column("sensor_type", sa.String(length=64), nullable=False),
        sa.Column("calibration_factors", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("firmware_version", sa.String(length=32), server_default=sa.text("'v1.0.0'"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("configured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["node_id"], ["sensor_nodes.node_id"], ondelete="CASCADE", name="fk_sensor_configurations_node_id"),
        sa.PrimaryKeyConstraint("configuration_id", name="pk_sensor_configurations")
    )
    op.create_index("ix_sensor_configurations_node_id", "sensor_configurations", ["node_id"], unique=False)

    # 7. Table: sensor_readings
    op.create_table(
        "sensor_readings",
        sa.Column("reading_id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("node_id", sa.String(length=64), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("location", geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, spatial_index=False, from_text="ST_GeogFromText", name="geography", nullable=True), nullable=True),
        sa.Column("pm25", sa.Float(), nullable=True),
        sa.Column("pm25_quality", sa.String(length=32), server_default=sa.text("'valid'"), nullable=False),
        sa.Column("so2", sa.Float(), nullable=True),
        sa.Column("so2_quality", sa.String(length=32), server_default=sa.text("'valid'"), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("humidity", sa.Float(), nullable=True),
        sa.Column("wind_speed", sa.Float(), nullable=True),
        sa.Column("wind_direction", sa.Float(), nullable=True),
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["node_id"], ["sensor_nodes.node_id"], ondelete="CASCADE", name="fk_sensor_readings_node_id"),
        sa.PrimaryKeyConstraint("reading_id", name="pk_sensor_readings"),
        sa.CheckConstraint("pm25 >= 0.0", name="chk_reading_pm25_non_negative"),
        sa.CheckConstraint("so2 >= 0.0", name="chk_reading_so2_non_negative"),
        sa.CheckConstraint("humidity >= 0.0 AND humidity <= 100.0", name="chk_reading_humidity_range"),
        sa.CheckConstraint("wind_speed >= 0.0", name="chk_reading_wind_speed_non_negative"),
        sa.CheckConstraint("wind_direction >= 0.0 AND wind_direction < 360.0", name="chk_reading_wind_direction_range")
    )
    op.create_index("ix_sensor_readings_node_recorded", "sensor_readings", ["node_id", sa.text("recorded_at DESC")], unique=False)
    op.create_index("ix_sensor_readings_recorded_at", "sensor_readings", [sa.text("recorded_at DESC")], unique=False)
    op.create_index("idx_sensor_readings_location", "sensor_readings", ["location"], postgresql_using="gist")

    # 8. Table: pollution_events
    op.create_table(
        "pollution_events",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("village_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("severity", sa.String(length=32), server_default=sa.text("'medium'"), nullable=False),
        sa.Column("peak_pm25", sa.Float(), nullable=True),
        sa.Column("peak_so2", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'active'"), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["village_id"], ["villages.village_id"], ondelete="SET NULL", name="fk_pollution_events_village_id"),
        sa.PrimaryKeyConstraint("event_id", name="pk_pollution_events")
    )
    op.create_index("ix_pollution_events_village_id", "pollution_events", ["village_id"], unique=False)

    # 9. Table: event_readings (Many-to-Many junction)
    op.create_table(
        "event_readings",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reading_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["pollution_events.event_id"], ondelete="CASCADE", name="fk_event_readings_event_id"),
        sa.ForeignKeyConstraint(["reading_id"], ["sensor_readings.reading_id"], ondelete="CASCADE", name="fk_event_readings_reading_id"),
        sa.PrimaryKeyConstraint("event_id", "reading_id", name="pk_event_readings")
    )

    # 10. Table: industrial_sites
    op.create_table(
        "industrial_sites",
        sa.Column("industry_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("industry_type", sa.String(length=128), nullable=False),
        sa.Column("gspcb_consent_id", sa.String(length=64), nullable=True),
        sa.Column("location", geoalchemy2.types.Geography(geometry_type="POINT", srid=4326, spatial_index=False, from_text="ST_GeogFromText", name="geography", nullable=False), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("village_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["village_id"], ["villages.village_id"], ondelete="SET NULL", name="fk_industrial_sites_village_id"),
        sa.PrimaryKeyConstraint("industry_id", name="pk_industrial_sites"),
        sa.UniqueConstraint("gspcb_consent_id", name="uq_industrial_sites_gspcb_consent_id")
    )
    op.create_index("ix_industrial_sites_name", "industrial_sites", ["name"], unique=False)
    op.create_index("ix_industrial_sites_village_id", "industrial_sites", ["village_id"], unique=False)
    op.create_index("idx_industrial_sites_location", "industrial_sites", ["location"], postgresql_using="gist")

    # 11. Table: industrial_activity
    op.create_table(
        "industrial_activity",
        sa.Column("activity_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("industry_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("shift_name", sa.String(length=64), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("declared_operating_status", sa.String(length=64), server_default=sa.text("'normal_operations'"), nullable=False),
        sa.Column("estimated_emission_factor", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["industry_id"], ["industrial_sites.industry_id"], ondelete="CASCADE", name="fk_industrial_activity_industry_id"),
        sa.PrimaryKeyConstraint("activity_id", name="pk_industrial_activity")
    )
    op.create_index("ix_industrial_activity_industry_id", "industrial_activity", ["industry_id"], unique=False)

    # 12. Table: event_classifications
    op.create_table(
        "event_classifications",
        sa.Column("classification_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("classification_type", sa.String(length=64), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("model_version", sa.String(length=64), nullable=False),
        sa.Column("features_used", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("classified_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["pollution_events.event_id"], ondelete="CASCADE", name="fk_event_classifications_event_id"),
        sa.PrimaryKeyConstraint("classification_id", name="pk_event_classifications"),
        sa.CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0", name="chk_classification_confidence_range")
    )
    op.create_index("ix_event_classifications_event_id", "event_classifications", ["event_id"], unique=False)

    # 13. Table: source_attributions
    op.create_table(
        "source_attributions",
        sa.Column("attribution_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("industry_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("probability_score", sa.Float(), nullable=False),
        sa.Column("plume_model_params", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["pollution_events.event_id"], ondelete="CASCADE", name="fk_source_attributions_event_id"),
        sa.ForeignKeyConstraint(["industry_id"], ["industrial_sites.industry_id"], ondelete="CASCADE", name="fk_source_attributions_industry_id"),
        sa.PrimaryKeyConstraint("attribution_id", name="pk_source_attributions"),
        sa.CheckConstraint("probability_score >= 0.0 AND probability_score <= 1.0", name="chk_attribution_probability_range")
    )
    op.create_index("ix_source_attributions_event_id", "source_attributions", ["event_id"], unique=False)
    op.create_index("ix_source_attributions_industry_id", "source_attributions", ["industry_id"], unique=False)

    # 14. Table: evidence_records
    op.create_table(
        "evidence_records",
        sa.Column("evidence_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("evidence_type", sa.String(length=64), nullable=False),
        sa.Column("data_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("confidence_weight", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["pollution_events.event_id"], ondelete="CASCADE", name="fk_evidence_records_event_id"),
        sa.PrimaryKeyConstraint("evidence_id", name="pk_evidence_records"),
        sa.CheckConstraint("confidence_weight >= 0.0 AND confidence_weight <= 1.0", name="chk_evidence_confidence_range")
    )
    op.create_index("ix_evidence_records_event_id", "evidence_records", ["event_id"], unique=False)

    # 15. Table: evidence_snapshots
    op.create_table(
        "evidence_snapshots",
        sa.Column("snapshot_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("snapshot_type", sa.String(length=64), nullable=False),
        sa.Column("file_path", sa.String(length=512), nullable=False),
        sa.Column("file_hash", sa.String(length=128), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["pollution_events.event_id"], ondelete="CASCADE", name="fk_evidence_snapshots_event_id"),
        sa.PrimaryKeyConstraint("snapshot_id", name="pk_evidence_snapshots")
    )
    op.create_index("ix_evidence_snapshots_event_id", "evidence_snapshots", ["event_id"], unique=False)

    # 16. Table: complaints
    op.create_table(
        "complaints",
        sa.Column("complaint_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("complaint_number", sa.String(length=64), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("filed_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("village_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("gspcb_form_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'draft'"), nullable=False),
        sa.Column("submission_reference", sa.String(length=128), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["pollution_events.event_id"], ondelete="SET NULL", name="fk_complaints_event_id"),
        sa.ForeignKeyConstraint(["filed_by_user_id"], ["users.user_id"], ondelete="RESTRICT", name="fk_complaints_filed_by_user_id"),
        sa.ForeignKeyConstraint(["village_id"], ["villages.village_id"], ondelete="RESTRICT", name="fk_complaints_village_id"),
        sa.PrimaryKeyConstraint("complaint_id", name="pk_complaints"),
        sa.UniqueConstraint("complaint_number", name="uq_complaints_complaint_number")
    )
    op.create_index("ix_complaints_complaint_number", "complaints", ["complaint_number"], unique=True)
    op.create_index("ix_complaints_event_id", "complaints", ["event_id"], unique=False)
    op.create_index("ix_complaints_filed_by_user_id", "complaints", ["filed_by_user_id"], unique=False)
    op.create_index("ix_complaints_village_id", "complaints", ["village_id"], unique=False)

    # 17. Table: complaint_documents
    op.create_table(
        "complaint_documents",
        sa.Column("document_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("complaint_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("generated_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version_number", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("file_path", sa.String(length=512), nullable=False),
        sa.Column("file_hash", sa.String(length=128), nullable=False),
        sa.Column("document_type", sa.String(length=64), server_default=sa.text("'gspcb_form_a_pdf'"), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.complaint_id"], ondelete="CASCADE", name="fk_complaint_documents_complaint_id"),
        sa.ForeignKeyConstraint(["generated_by_user_id"], ["users.user_id"], ondelete="RESTRICT", name="fk_complaint_documents_user_id"),
        sa.PrimaryKeyConstraint("document_id", name="pk_complaint_documents")
    )
    op.create_index("ix_complaint_documents_complaint_id", "complaint_documents", ["complaint_id"], unique=False)

    # 18. Table: notifications
    op.create_table(
        "notifications",
        sa.Column("notification_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("recipient_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("recipient_contact", sa.String(length=255), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("notification_type", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message_body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["recipient_user_id"], ["users.user_id"], ondelete="SET NULL", name="fk_notifications_user_id"),
        sa.PrimaryKeyConstraint("notification_id", name="pk_notifications")
    )
    op.create_index("ix_notifications_recipient_user_id", "notifications", ["recipient_user_id"], unique=False)

    # 19. Table: maintenance_records
    op.create_table(
        "maintenance_records",
        sa.Column("maintenance_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("node_id", sa.String(length=64), nullable=False),
        sa.Column("reported_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("issue_type", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), server_default=sa.text("'open'"), nullable=False),
        sa.Column("scheduled_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["node_id"], ["sensor_nodes.node_id"], ondelete="CASCADE", name="fk_maintenance_records_node_id"),
        sa.ForeignKeyConstraint(["reported_by_user_id"], ["users.user_id"], ondelete="SET NULL", name="fk_maintenance_records_user_id"),
        sa.PrimaryKeyConstraint("maintenance_id", name="pk_maintenance_records")
    )
    op.create_index("ix_maintenance_records_node_id", "maintenance_records", ["node_id"], unique=False)

    # 20. Table: audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("audit_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=128), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=128), nullable=False),
        sa.Column("changes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="SET NULL", name="fk_audit_logs_user_id"),
        sa.PrimaryKeyConstraint("audit_id", name="pk_audit_logs")
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("maintenance_records")
    op.drop_table("notifications")
    op.drop_table("complaint_documents")
    op.drop_table("complaints")
    op.drop_table("evidence_snapshots")
    op.drop_table("evidence_records")
    op.drop_table("source_attributions")
    op.drop_table("event_classifications")
    op.drop_table("industrial_activity")
    op.drop_table("industrial_sites")
    op.drop_table("event_readings")
    op.drop_table("pollution_events")
    op.drop_table("sensor_readings")
    op.drop_table("sensor_configurations")
    op.drop_table("sensor_nodes")
    op.drop_table("weather_observations")
    op.drop_table("villages")
    op.drop_table("users")
