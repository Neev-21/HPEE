import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        doc="Unique identifier for the user"
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="User email address for authentication"
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Bcrypt/Argon2 password hash"
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Full legal name of the user"
    )
    role: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="public",
        doc="Role: admin, sarpanch, inspector, public"
    )
    phone_number: Mapped[Optional[str]] = mapped_column(
        String(32),
        nullable=True,
        doc="Contact phone number for SMS/WhatsApp notifications"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
        doc="Whether the user account is active"
    )

    # Relationships
    complaints_filed: Mapped[List["Complaint"]] = relationship(
        "Complaint",
        back_populates="filed_by_user",
        foreign_keys="Complaint.filed_by_user_id"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="recipient_user"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user"
    )
