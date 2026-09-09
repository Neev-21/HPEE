import pytest
from backend.app.engines.notification.templates import render_alert_message
from backend.app.engines.notification.service import (
    dispatch_pollution_alert,
    get_event_notifications,
)
from backend.app.db.session import SessionLocal
from backend.app.models.pollution_event import PollutionEvent


def test_multilingual_template_rendering():
    """Verify template rendering in Gujarati, Hindi, and English."""
    common_args = {
        "village_name": "Piraman",
        "recipient_name": "Rameshbhai Patel",
        "peak_pm25": 215.0,
        "peak_so2": 170.0,
        "culprit_name": "Gujarat Organics Ltd",
        "confidence_percent": 88.0,
        "wind_direction": 135.0,
        "action_url": "http://localhost:3100/events/test-event-123",
    }

    # 1. Gujarati
    title_gu, body_gu = render_alert_message(lang="gu", **common_args)
    assert "HPEE ચેતવણી" in title_gu
    assert "Piraman" in title_gu
    assert "Gujarat Organics Ltd" in body_gu
    assert "88%" in body_gu
    assert "GSPCB" in body_gu

    # 2. Hindi
    title_hi, body_hi = render_alert_message(lang="hi", **common_args)
    assert "HPEE चेतावनी" in title_hi
    assert "Piraman" in title_hi
    assert "Gujarat Organics Ltd" in body_hi
    assert "GSPCB" in body_hi

    # 3. English
    title_en, body_en = render_alert_message(lang="en", **common_args)
    assert "HPEE Alert" in title_en
    assert "Piraman" in title_en
    assert "Gujarat Organics Ltd" in body_en
    assert "http://localhost:3100/events/test-event-123" in body_en



def test_notification_dispatch_and_audit():
    """Verify notification dispatch flow and database persistence."""
    db = SessionLocal()
    try:
        event = db.query(PollutionEvent).first()
        assert event is not None, "Need at least one pollution event in DB"

        notifs = dispatch_pollution_alert(
            db=db,
            event_id=str(event.event_id),
            channel="whatsapp",
            lang="gu",
        )
        assert len(notifs) >= 1
        first = notifs[0]
        assert first.channel == "whatsapp"
        assert first.status == "delivered"
        assert first.notification_type == "pollution_alert"
        assert "પિરામણ" in first.title or "HPEE" in first.title

        # Check retrieval
        history = get_event_notifications(db, str(event.event_id))
        assert len(history) >= 1
    finally:
        db.close()
