import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import (
    String, Text, DateTime,
    ForeignKey, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base, TimestampMixin


class Notification(Base):
    __tablename__ = "notifications"

    notification_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the notification dispatch"
    )
    recipient_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
        doc="Target user (if registered)"
    )
    recipient_contact: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Destination phone number, email, or device push token"
    )
    channel: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        doc="Channel: sms, whatsapp, email, web_push"
    )
    notification_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Type: pollution_alert, complaint_status, maintenance_alert"
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Notification header / title"
    )
    message_body: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Full notification text / body"
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="pending",
        server_default=text("'pending'"),
        nullable=False,
        doc="Delivery status: pending, sent, delivered, failed"
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="UTC dispatch timestamp"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="Creation timestamp"
    )

    # Relationships
    recipient_user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="notifications"
    )


class MaintenanceRecord(Base, TimestampMixin):
    __tablename__ = "maintenance_records"

    maintenance_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the maintenance ticket"
    )
    node_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("sensor_nodes.node_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Faulty / target sensor node"
    )
    reported_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        doc="Technician or inspector reporting the fault"
    )
    issue_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Issue: offline, calibration_drift, physical_damage, battery_failure, unknown"
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Detailed description of symptoms or damage"
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="open",
        server_default=text("'open'"),
        nullable=False,
        doc="Ticket status: open, in_progress, resolved, cancelled"
    )
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Scheduled visit date/time"
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Ticket resolution timestamp"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Technician resolution log and replacement part notes"
    )

    # Relationships
    node: Mapped["SensorNode"] = relationship(
        "SensorNode",
        back_populates="maintenance_records"
    )
    reported_by_user: Mapped[Optional["User"]] = relationship(
        "User"
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for audit log entry"
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
        doc="Actor user ID (or null for automated system tasks)"
    )
    action: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Action identifier e.g. CREATE_COMPLAINT, CALIBRATE_SENSOR, SUBMIT_GSPCB_FORM_A"
    )
    entity_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Target entity type e.g. complaints, sensor_nodes, pollution_events"
    )
    entity_id: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Identifier of the affected entity"
    )
    changes: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Diff payload showing before and after states"
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="Client IP address"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        doc="UTC event timestamp"
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="audit_logs"
    )
