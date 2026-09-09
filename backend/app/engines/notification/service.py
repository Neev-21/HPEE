"""
Notification & Alert Dispatch Engine — service.py
---------------------------------------------------
Dispatches localized alerts across WhatsApp and SMS to Sarpanch,
registered villagers, and GSPCB field inspectors.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text as sa_text
from uuid import UUID

from backend.app.models.ops import Notification
from backend.app.models.user import User
from backend.app.models.pollution_event import PollutionEvent
from backend.app.models.evidence import SourceAttribution
from backend.app.models.industry import IndustrialSite
from backend.app.models.geography import Village
from backend.app.engines.notification.templates import render_alert_message


def dispatch_pollution_alert(
    db: Session,
    event_id: str,
    channel: str = "whatsapp",
    lang: str = "gu",
    base_portal_url: str = "http://localhost:3100",
) -> List[Notification]:
    """
    Sends automated localized alert notifications for a detected pollution surge.
    Dispatches to the Sarpanch and relevant recipients, and persists log in `notifications`.
    """
    try:
        e_uuid = UUID(event_id)
    except ValueError:
        raise ValueError(f"Invalid event ID format: {event_id}")

    event = db.query(PollutionEvent).filter(PollutionEvent.event_id == e_uuid).first()
    if not event:
        raise ValueError(f"Pollution event {event_id} not found.")

    # Determine village
    village = None
    if event.village_id:
        village = db.query(Village).filter(Village.village_id == event.village_id).first()
    if not village:
        village = db.query(Village).first()

    village_name = village.name if village else "Piraman"

    # Fetch top culprit industry
    top_attr = (
        db.query(SourceAttribution)
        .filter(SourceAttribution.event_id == e_uuid)
        .order_by(SourceAttribution.rank.asc())
        .first()
    )

    culprit_name = "Industrial Facility"
    confidence_pct = 85.0
    if top_attr:
        ind = db.query(IndustrialSite).filter(IndustrialSite.industry_id == top_attr.industry_id).first()
        if ind:
            culprit_name = ind.name
        confidence_pct = round(top_attr.probability_score * 100, 1)

    # Fetch wind direction
    r_query = sa_text("""
        SELECT sr.wind_direction FROM event_readings er
        JOIN sensor_readings sr ON er.reading_id = sr.reading_id
        WHERE er.event_id = :eid ORDER BY sr.recorded_at DESC LIMIT 1
    """)
    w_row = db.execute(r_query, {"eid": e_uuid}).fetchone()
    wind_dir = float(w_row[0]) if (w_row and w_row[0] is not None) else 135.0

    action_url = f"{base_portal_url}/events/{event_id}?lang={lang}"

    # Find recipients (Sarpanch and GSPCB Inspector)
    recipients = db.query(User).filter(User.role.in_(["sarpanch", "inspector"])).all()
    if not recipients:
        # Default Sarpanch recipient if no users created yet
        dummy_user = User(
            email="sarpanch.piraman@gujarat.gov.in",
            password_hash="auto_generated",
            full_name="Rameshbhai Patel",
            role="sarpanch",
            phone_number="+919879011223",
        )
        db.add(dummy_user)
        db.flush()
        recipients = [dummy_user]

    created_notifications: List[Notification] = []

    for recipient in recipients:
        title, body = render_alert_message(
            lang=lang,
            village_name=village_name,
            recipient_name=recipient.full_name,
            peak_pm25=event.peak_pm25,
            peak_so2=event.peak_so2,
            culprit_name=culprit_name,
            confidence_percent=confidence_pct,
            wind_direction=wind_dir,
            action_url=action_url,
        )

        notif = Notification(
            recipient_user_id=recipient.user_id,
            recipient_contact=recipient.phone_number or recipient.email,
            channel=channel,
            notification_type="pollution_alert",
            title=title,
            message_body=body,
            status="delivered",  # Simulated instantaneous delivery
            sent_at=datetime.now(timezone.utc),
        )
        db.add(notif)
        created_notifications.append(notif)

    db.commit()
    return created_notifications


def get_event_notifications(db: Session, event_id: str) -> List[Dict[str, Any]]:
    """Retrieves all notifications dispatched for a specific event."""
    # Find notifications matching title or message body with event link
    notifs = (
        db.query(Notification)
        .filter(Notification.message_body.like(f"%{event_id}%"))
        .order_by(Notification.created_at.desc())
        .all()
    )

    return [
        {
            "notification_id": str(n.notification_id),
            "recipient_contact": n.recipient_contact,
            "channel": n.channel,
            "notification_type": n.notification_type,
            "title": n.title,
            "message_body": n.message_body,
            "status": n.status,
            "sent_at": n.sent_at.isoformat() if n.sent_at else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]
