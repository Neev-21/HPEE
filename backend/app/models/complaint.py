import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any, Dict
from sqlalchemy import (
    String, Integer, DateTime,
    ForeignKey, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base, TimestampMixin


class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the citizen/sarpanch complaint"
    )
    complaint_number: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        doc="Official tracking number e.g. GSPCB-HPEE-2026-001"
    )
    event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pollution_events.event_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
        doc="Reference to detected pollution event"
    )
    filed_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
        doc="User / Sarpanch filing the complaint"
    )
    village_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("villages.village_id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
        doc="Affected village jurisdiction"
    )
    gspcb_form_data: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        doc="Structured Form-A payload for GSPCB submission"
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="draft",
        server_default=text("'draft'"),
        nullable=False,
        doc="Workflow status: draft, submitted, under_review, action_taken, closed, rejected"
    )
    submission_reference: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
        doc="External GSPCB portal reference / acknowledgement receipt number"
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp of official dispatch to GSPCB"
    )

    # Relationships
    event: Mapped[Optional["PollutionEvent"]] = relationship(
        "PollutionEvent",
        back_populates="complaints"
    )
    filed_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="complaints_filed",
        foreign_keys=[filed_by_user_id]
    )
    village: Mapped["Village"] = relationship(
        "Village",
        back_populates="complaints"
    )
    documents: Mapped[List["ComplaintDocument"]] = relationship(
        "ComplaintDocument",
        back_populates="complaint",
        cascade="all, delete-orphan"
    )


class ComplaintDocument(Base):
    __tablename__ = "complaint_documents"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for generated complaint PDF / document"
    )
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.complaint_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Associated complaint reference"
    )
    generated_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        doc="User who triggered generation"
    )
    version_number: Mapped[int] = mapped_column(
        Integer,
        default=1,
        server_default=text("1"),
        nullable=False,
        doc="Sequential document version number"
    )
    file_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        doc="Object storage path or filesystem path"
    )
    file_hash: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="SHA-256 hash of PDF document for legal verification"
    )
    document_type: Mapped[str] = mapped_column(
        String(64),
        default="gspcb_form_a_pdf",
        server_default=text("'gspcb_form_a_pdf'"),
        nullable=False,
        doc="Document type: gspcb_form_a_pdf, evidence_annexure_pdf"
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Generation timestamp"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Insert timestamp"
    )

    # Relationships
    complaint: Mapped["Complaint"] = relationship(
        "Complaint",
        back_populates="documents"
    )
    generated_by_user: Mapped["User"] = relationship(
        "User"
    )
