import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, BigInteger, Float, Text, DateTime,
    ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base, TimestampMixin


class PollutionEvent(Base, TimestampMixin):
    __tablename__ = "pollution_events"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the detected pollution episode"
    )
    village_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("villages.village_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
        doc="Primary affected village / cluster"
    )
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Timestamp when backend algorithm or rule engine flagged the event"
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        doc="Estimated start time of the pollution spike"
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Estimated conclusion time of the pollution spike (null if active)"
    )
    severity: Mapped[str] = mapped_column(
        String(32),
        default="medium",
        server_default=text("'medium'"),
        nullable=False,
        doc="Severity rating: low, medium, high, severe"
    )
    peak_pm25: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Maximum observed PM2.5 (ug/m3) during the event"
    )
    peak_so2: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Maximum observed SO2 (ug/m3) during the event"
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="active",
        server_default=text("'active'"),
        nullable=False,
        doc="Event lifecycle: active, resolved, false_positive, under_investigation"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Summary narrative of event context and triggers"
    )

    # Relationships
    village: Mapped[Optional["Village"]] = relationship(
        "Village",
        back_populates="pollution_events"
    )
    event_readings: Mapped[List["EventReading"]] = relationship(
        "EventReading",
        back_populates="event",
        cascade="all, delete-orphan"
    )
    classifications: Mapped[List["EventClassification"]] = relationship(
        "EventClassification",
        back_populates="event",
        cascade="all, delete-orphan"
    )
    source_attributions: Mapped[List["SourceAttribution"]] = relationship(
        "SourceAttribution",
        back_populates="event",
        cascade="all, delete-orphan"
    )
    evidence_records: Mapped[List["EvidenceRecord"]] = relationship(
        "EvidenceRecord",
        back_populates="event",
        cascade="all, delete-orphan"
    )
    evidence_snapshots: Mapped[List["EvidenceSnapshot"]] = relationship(
        "EvidenceSnapshot",
        back_populates="event",
        cascade="all, delete-orphan"
    )
    complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint",
        back_populates="event"
    )


class EventReading(Base):
    __tablename__ = "event_readings"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pollution_events.event_id", ondelete="CASCADE"),
        primary_key=True,
        doc="Foreign key to pollution event"
    )
    reading_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("sensor_readings.reading_id", ondelete="CASCADE"),
        primary_key=True,
        doc="Foreign key to sensor reading"
    )

    # Relationships
    event: Mapped["PollutionEvent"] = relationship(
        "PollutionEvent",
        back_populates="event_readings"
    )
    reading: Mapped["SensorReading"] = relationship(
        "SensorReading",
        back_populates="event_associations"
    )
