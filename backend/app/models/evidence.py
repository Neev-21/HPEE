import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import (
    String, Integer, Float, DateTime,
    ForeignKey, CheckConstraint, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class EventClassification(Base):
    __tablename__ = "event_classifications"
    __table_args__ = (
        CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0", name="chk_classification_confidence_range"),
    )

    classification_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for ML classification output"
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pollution_events.event_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Reference to associated pollution event"
    )
    classification_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Inferred emission source category: industrial, agricultural_burning, vehicular, seasonal_inversion, unknown"
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Model confidence probability between 0.0 and 1.0"
    )
    model_version: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Model identifier e.g. hpee_xgb_classifier_v1.2"
    )
    features_used: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Feature vector / input values used for classification explainability"
    )
    classified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Classification run timestamp"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Record creation timestamp"
    )

    # Relationships
    event: Mapped["PollutionEvent"] = relationship(
        "PollutionEvent",
        back_populates="classifications"
    )


class SourceAttribution(Base):
    __tablename__ = "source_attributions"
    __table_args__ = (
        CheckConstraint("probability_score >= 0.0 AND probability_score <= 1.0", name="chk_attribution_probability_range"),
    )

    attribution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for source attribution entry"
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pollution_events.event_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Target pollution event"
    )
    industry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("industrial_sites.industry_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Probable culprit industrial site"
    )
    rank: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Rank order (1 = highest probable culprit)"
    )
    probability_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Calculated attribution probability (0.0 - 1.0)"
    )
    plume_model_params: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Gaussian plume / backward-trajectory parameters and spatial intersection metrics"
    )
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Calculation timestamp"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Record creation timestamp"
    )

    # Relationships
    event: Mapped["PollutionEvent"] = relationship(
        "PollutionEvent",
        back_populates="source_attributions"
    )
    industry: Mapped["IndustrialSite"] = relationship(
        "IndustrialSite",
        back_populates="attributions"
    )


class EvidenceRecord(Base):
    __tablename__ = "evidence_records"
    __table_args__ = (
        CheckConstraint("confidence_weight >= 0.0 AND confidence_weight <= 1.0", name="chk_evidence_confidence_range"),
    )

    evidence_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for atomic piece of evidence"
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pollution_events.event_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Target pollution event"
    )
    evidence_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Type: sensor_spike, wind_vector_alignment, industrial_schedule_match, satellite_hotspot, weather_inversion"
    )
    data_payload: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        doc="Structured evidence parameters, proof values, and measurement vectors"
    )
    confidence_weight: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Weight of this evidence in final fusion dossier (0.0 - 1.0)"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Record creation timestamp"
    )

    # Relationships
    event: Mapped["PollutionEvent"] = relationship(
        "PollutionEvent",
        back_populates="evidence_records"
    )


class EvidenceSnapshot(Base):
    __tablename__ = "evidence_snapshots"

    snapshot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for generated evidence snapshot"
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pollution_events.event_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Target pollution event"
    )
    snapshot_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Snapshot type: plume_map, time_series_chart, wind_rose, composite_dossier"
    )
    file_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        doc="Object storage URI / local file path"
    )
    file_hash: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="SHA-256 cryptographic hash of the artifact for tamper-evidence"
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp artifact was rendered"
    )
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Render parameters and bounding box coordinates"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Database insert timestamp"
    )

    # Relationships
    event: Mapped["PollutionEvent"] = relationship(
        "PollutionEvent",
        back_populates="evidence_snapshots"
    )
