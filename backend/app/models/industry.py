import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any
from sqlalchemy import (
    String, Boolean, Float, Text, DateTime,
    ForeignKey, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography
from backend.app.db.base import Base, TimestampMixin


class IndustrialSite(Base, TimestampMixin):
    __tablename__ = "industrial_sites"

    industry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the industrial facility"
    )
    name: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
        doc="Company / Factory legal name"
    )
    industry_type: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Sector (e.g. Dyes & Intermediates, Specialty Chemicals, Pharma, Agrochemicals)"
    )
    gspcb_consent_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        unique=True,
        nullable=True,
        doc="GSPCB Consent to Operate (CTO) or Consolidated Consent Authorization (CCA) ID"
    )
    location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
        doc="Geographic point (longitude, latitude) of factory stack / perimeter"
    )
    address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Postal address or GIDC plot number"
    )
    village_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("villages.village_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
        doc="Nearest village or industrial estate"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
        doc="Operational status"
    )
    declared_process: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Declared manufacturing process (e.g. H-acid synthesis, Sulphonation, Azo coupling)"
    )
    emission_profile: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Relative emission intensities per pollutant (0-1). Keys: so2, nox, pm25, co, no2"
    )

    # Relationships
    village: Mapped[Optional["Village"]] = relationship(
        "Village",
        back_populates="industrial_sites"
    )
    activities: Mapped[List["IndustrialActivity"]] = relationship(
        "IndustrialActivity",
        back_populates="industry",
        cascade="all, delete-orphan"
    )
    attributions: Mapped[List["SourceAttribution"]] = relationship(
        "SourceAttribution",
        back_populates="industry",
        cascade="all, delete-orphan"
    )


class IndustrialActivity(Base):
    __tablename__ = "industrial_activity"

    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the activity/shift record"
    )
    industry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("industrial_sites.industry_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Foreign key to industrial site"
    )
    shift_name: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="Shift label (e.g. Day Shift, Night Batch, Reactor Cleaning)"
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Activity start UTC timestamp"
    )
    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Activity end UTC timestamp (nullable if ongoing)"
    )
    declared_operating_status: Mapped[str] = mapped_column(
        String(64),
        default="normal_operations",
        server_default=text("'normal_operations'"),
        nullable=False,
        doc="Operating status (e.g. normal_operations, high_load, maintenance_shutdown, flaring)"
    )
    estimated_emission_factor: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Relative emission scale factor (1.0 = baseline)"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Additional context / batch notes"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Record creation timestamp"
    )

    # Relationships
    industry: Mapped["IndustrialSite"] = relationship(
        "IndustrialSite",
        back_populates="activities"
    )
