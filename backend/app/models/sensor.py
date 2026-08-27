import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlalchemy import (
    String, Integer, BigInteger, Float, Boolean, DateTime,
    ForeignKey, CheckConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography
from backend.app.db.base import Base, TimestampMixin


class SensorNode(Base, TimestampMixin):
    __tablename__ = "sensor_nodes"
    __table_args__ = (
        CheckConstraint("battery_percent >= 0.0 AND battery_percent <= 100.0", name="chk_sensor_node_battery_range"),
    )

    node_id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Human-readable node code e.g. HPEE-ANK-001"
    )
    village_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("villages.village_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
        doc="Reference to associated village"
    )
    location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
        doc="Deployment coordinates (longitude, latitude) as PostGIS Geography Point"
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="online",
        server_default=text("'online'"),
        nullable=False,
        doc="Current node status: online, offline, maintenance, fault"
    )
    battery_percent: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Current battery percentage (0-100)"
    )
    signal_strength: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Cellular/WiFi RSSI signal in dBm"
    )
    installed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp of physical deployment"
    )
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp of last received telemetry packet"
    )

    # Relationships
    village: Mapped[Optional["Village"]] = relationship(
        "Village",
        back_populates="sensor_nodes"
    )
    configurations: Mapped[List["SensorConfiguration"]] = relationship(
        "SensorConfiguration",
        back_populates="node",
        cascade="all, delete-orphan"
    )
    readings: Mapped[List["SensorReading"]] = relationship(
        "SensorReading",
        back_populates="node",
        cascade="all, delete-orphan"
    )
    maintenance_records: Mapped[List["MaintenanceRecord"]] = relationship(
        "MaintenanceRecord",
        back_populates="node",
        cascade="all, delete-orphan"
    )


class SensorConfiguration(Base):
    __tablename__ = "sensor_configurations"

    configuration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique configuration identifier"
    )
    node_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("sensor_nodes.node_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Target sensor node code"
    )
    sensor_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Hardware type e.g. PMS5003_SO2_MET"
    )
    calibration_factors: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Calibration curve gains, offsets, and temperature compensation factors"
    )
    firmware_version: Mapped[str] = mapped_column(
        String(32),
        default="v1.0.0",
        server_default=text("'v1.0.0'"),
        nullable=False,
        doc="Firmware version running on node ESP32/MCU"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
        doc="Whether this calibration is currently active"
    )
    configured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp calibration was applied"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Record creation timestamp"
    )

    # Relationships
    node: Mapped["SensorNode"] = relationship(
        "SensorNode",
        back_populates="configurations"
    )


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    __table_args__ = (
        CheckConstraint("pm25 >= 0.0", name="chk_reading_pm25_non_negative"),
        CheckConstraint("so2 >= 0.0", name="chk_reading_so2_non_negative"),
        CheckConstraint("humidity >= 0.0 AND humidity <= 100.0", name="chk_reading_humidity_range"),
        CheckConstraint("wind_speed >= 0.0", name="chk_reading_wind_speed_non_negative"),
        CheckConstraint("wind_direction >= 0.0 AND wind_direction < 360.0", name="chk_reading_wind_direction_range"),
        Index("ix_sensor_readings_node_recorded", "node_id", text("recorded_at DESC")),
        Index("ix_sensor_readings_recorded_at", text("recorded_at DESC")),
    )

    reading_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
        doc="Sequential 64-bit integer identifier for high-volume telemetry"
    )
    node_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("sensor_nodes.node_id", ondelete="CASCADE"),
        nullable=False,
        doc="Originating sensor node"
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Observation time recorded by the sensor node clock in UTC"
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Ingestion time recorded by backend server in UTC"
    )
    location: Mapped[Optional[Any]] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
        doc="GPS location of node at time of reading if mobile/dynamic"
    )
    pm25: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="PM2.5 concentration in ug/m3"
    )
    pm25_quality: Mapped[str] = mapped_column(
        String(32),
        default="valid",
        server_default=text("'valid'"),
        nullable=False,
        doc="Quality flag: valid, estimated, suspect, invalid"
    )
    so2: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="SO2 concentration in ug/m3 (or ppb)"
    )
    so2_quality: Mapped[str] = mapped_column(
        String(32),
        default="valid",
        server_default=text("'valid'"),
        nullable=False,
        doc="Quality flag: valid, estimated, suspect, invalid"
    )
    temperature: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Temperature in Celsius"
    )
    humidity: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Relative humidity percentage (0-100)"
    )
    wind_speed: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Anemometer wind speed in m/s"
    )
    wind_direction: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Wind vane direction in degrees [0, 360)"
    )
    raw_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Original unaltered JSON packet from MQTT/HTTP broker for full provenance"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Database insert timestamp"
    )

    # Relationships
    node: Mapped["SensorNode"] = relationship(
        "SensorNode",
        back_populates="readings"
    )
    event_associations: Mapped[List["EventReading"]] = relationship(
        "EventReading",
        back_populates="reading",
        cascade="all, delete-orphan"
    )
