import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlalchemy import String, Integer, Float, DateTime, CheckConstraint, text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography
from backend.app.db.base import Base, TimestampMixin


class Village(Base, TimestampMixin):
    __tablename__ = "villages"

    village_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the village"
    )
    name: Mapped[str] = mapped_column(
        String(128),
        index=True,
        nullable=False,
        doc="Village / locality name"
    )
    district: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="District (e.g. Bharuch)"
    )
    state: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        default="Gujarat",
        server_default=text("'Gujarat'"),
        doc="State name"
    )
    center_location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
        doc="PostGIS Point (longitude, latitude) representing village center"
    )
    population: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Estimated village population"
    )
    boundary_geojson: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="GeoJSON polygon geometry for village administrative boundary"
    )

    # Relationships
    sensor_nodes: Mapped[List["SensorNode"]] = relationship(
        "SensorNode",
        back_populates="village"
    )
    industrial_sites: Mapped[List["IndustrialSite"]] = relationship(
        "IndustrialSite",
        back_populates="village"
    )
    pollution_events: Mapped[List["PollutionEvent"]] = relationship(
        "PollutionEvent",
        back_populates="village"
    )
    complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint",
        back_populates="village"
    )


class WeatherObservation(Base):
    __tablename__ = "weather_observations"
    __table_args__ = (
        CheckConstraint("humidity >= 0.0 AND humidity <= 100.0", name="chk_weather_humidity_range"),
        CheckConstraint("wind_speed >= 0.0", name="chk_weather_wind_speed_non_negative"),
        CheckConstraint("wind_direction >= 0.0 AND wind_direction < 360.0", name="chk_weather_wind_direction_range"),
    )

    weather_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the weather observation"
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
        doc="UTC observation timestamp from meteorological station/API"
    )
    location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
        doc="PostGIS Point (longitude, latitude) of weather station or grid cell"
    )
    temperature: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Ambient temperature in degrees Celsius"
    )
    humidity: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Relative humidity percentage (0-100)"
    )
    wind_speed: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Wind speed in meters per second (m/s)"
    )
    wind_direction: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Wind direction in degrees [0, 360) clockwise from true North"
    )
    pressure: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Atmospheric pressure in hPa/mbar"
    )
    source_provider: Mapped[str] = mapped_column(
        String(64),
        default="IMD_OR_MET",
        server_default=text("'IMD_OR_MET'"),
        nullable=False,
        doc="Data source (e.g. IMD, OpenWeatherMap, Onsite Station)"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="UTC timestamp when the record was inserted"
    )
