"""Deterministic Seed Script for HPEE PostgreSQL + PostGIS Database

Executes idempotent seeding of Gujarat Industrial Corridor dataset.
Usage:
    python -m database.seed.seed_data
"""

import sys
from datetime import datetime, timezone
from sqlalchemy import select, delete, func
from geoalchemy2.elements import WKTElement

from backend.app.db.session import SessionLocal
from backend.app.models import (
    User,
    Village,
    WeatherObservation,
    SensorNode,
    SensorConfiguration,
    SensorReading,
    PollutionEvent,
    EventReading,
    IndustrialSite,
    IndustrialActivity,
    EventClassification,
    SourceAttribution,
    EvidenceRecord,
    EvidenceSnapshot,
    Complaint,
    ComplaintDocument,
    Notification,
    MaintenanceRecord,
    AuditLog,
)
from database.seed.gujarat_corridor_data import (
    USERS_DATA,
    VILLAGES_DATA,
    INDUSTRIAL_SITES_DATA,
    SENSOR_NODES_DATA,
)
from database.seed.telemetry_generator import generate_synthetic_dataset


def seed_database():
    """Populates the database with complete deterministic baseline data."""
    print("==================================================")
    print("  HPEE Database Deterministic Seed Execution")
    print("==================================================")

    db = SessionLocal()
    try:
        # 1. Seed Users
        print("\n[1/10] Seeding Users...")
        users_map = {}
        for u in USERS_DATA:
            existing = db.execute(select(User).where(User.email == u["email"])).scalar_one_or_none()
            if not existing:
                user_obj = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    role=u["role"],
                    phone_number=u["phone_number"],
                    password_hash=u["password_hash"],
                    is_active=u["is_active"],
                )
                db.add(user_obj)
                db.flush()
                users_map[u["email"]] = {"user_id": user_obj.user_id, "email": u["email"]}
                print(f"  + Created User: {u['email']} ({u['role']})")
            else:
                users_map[u["email"]] = {"user_id": existing.user_id, "email": existing.email}
                print(f"  * Existing User: {u['email']}")

        # 2. Seed Villages
        print("\n[2/10] Seeding Villages...")
        villages_map = {}
        for v in VILLAGES_DATA:
            existing = db.execute(select(Village).where(Village.name == v["name"])).scalar_one_or_none()
            if not existing:
                geom = WKTElement(f"POINT({v['longitude']} {v['latitude']})", srid=4326)
                village_obj = Village(
                    name=v["name"],
                    district=v["district"],
                    state=v["state"],
                    center_location=geom,
                    population=v["population"],
                )
                db.add(village_obj)
                db.flush()
                villages_map[v["name"]] = {"village_id": village_obj.village_id, "name": v["name"]}
                print(f"  + Created Village: {v['name']} ({v['district']})")
            else:
                villages_map[v["name"]] = {"village_id": existing.village_id, "name": existing.name}
                print(f"  * Existing Village: {v['name']}")

        # 3. Seed Industrial Sites
        print("\n[3/10] Seeding Industrial Sites...")
        industries_map = {}
        for ind in INDUSTRIAL_SITES_DATA:
            existing = db.execute(select(IndustrialSite).where(IndustrialSite.name == ind["name"])).scalar_one_or_none()
            village_id = villages_map.get(ind["village_name"], {}).get("village_id")
            if not existing:
                geom = WKTElement(f"POINT({ind['longitude']} {ind['latitude']})", srid=4326)
                ind_obj = IndustrialSite(
                    name=ind["name"],
                    industry_type=ind["industry_type"],
                    gspcb_consent_id=ind["gspcb_consent_id"],
                    location=geom,
                    address=ind["address"],
                    village_id=village_id,
                    is_active=True,
                )
                db.add(ind_obj)
                db.flush()
                industries_map[ind["name"]] = {"industry_id": ind_obj.industry_id, "name": ind["name"]}
                print(f"  + Created Industrial Site: {ind['name']} ({ind['industry_type']})")
            else:
                industries_map[ind["name"]] = {"industry_id": existing.industry_id, "name": existing.name}
                print(f"  * Existing Industrial Site: {ind['name']}")

        # 4. Seed Sensor Nodes & Configurations
        print("\n[4/10] Seeding Sensor Nodes & Configurations...")
        for node in SENSOR_NODES_DATA:
            existing = db.execute(select(SensorNode).where(SensorNode.node_id == node["node_id"])).scalar_one_or_none()
            village_id = villages_map.get(node["village_name"], {}).get("village_id")
            if not existing:
                geom = WKTElement(f"POINT({node['longitude']} {node['latitude']})", srid=4326)
                node_obj = SensorNode(
                    node_id=node["node_id"],
                    village_id=village_id,
                    location=geom,
                    status=node["status"],
                    battery_percent=node["battery_percent"],
                    signal_strength=node["signal_strength"],
                    installed_at=datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc),
                    last_seen_at=datetime(2026, 8, 22, 0, 0, 0, tzinfo=timezone.utc),
                )
                db.add(node_obj)
                db.flush()

                # Add configuration
                config_obj = SensorConfiguration(
                    node_id=node["node_id"],
                    sensor_type=node["sensor_type"],
                    calibration_factors={"pm25_gain": 1.02, "so2_offset_ppb": -1.5, "temp_comp": True},
                    firmware_version="v1.2.0",
                    is_active=True,
                )
                db.add(config_obj)
                print(f"  + Created Sensor Node: {node['node_id']} in {node['village_name']}")
            else:
                print(f"  * Existing Sensor Node: {node['node_id']}")

        db.commit()

        # 5. Generate Synthetic Telemetry, Weather & Events
        print("\n[5/10] Generating Synthetic Telemetry & Pollution Episodes (7 days)...")
        synthetic_data = generate_synthetic_dataset(
            nodes=SENSOR_NODES_DATA,
            villages_map=villages_map,
            industries_map=industries_map,
            users_map=users_map,
            days=7,
            interval_minutes=30  # 30-min intervals for clean seed volume
        )

        # 6. Seed Weather Observations
        print(f"\n[6/10] Inserting {len(synthetic_data['weather_records'])} Weather Observations...")
        existing_weather_count = db.execute(select(func.count(WeatherObservation.weather_id))).scalar()
        if existing_weather_count == 0:
            weather_objs = [
                WeatherObservation(
                    recorded_at=w["recorded_at"],
                    location=WKTElement(f"POINT({w['longitude']} {w['latitude']})", srid=4326),
                    temperature=w["temperature"],
                    humidity=w["humidity"],
                    wind_speed=w["wind_speed"],
                    wind_direction=w["wind_direction"],
                    pressure=w["pressure"],
                    source_provider=w["source_provider"],
                )
                for w in synthetic_data["weather_records"]
            ]
            db.bulk_save_objects(weather_objs)
            db.commit()
            print(f"  + Inserted {len(weather_objs)} weather observation records.")
        else:
            print(f"  * Weather observations already exist ({existing_weather_count} rows).")

        # 7. Seed Industrial Activity
        print(f"\n[7/10] Inserting {len(synthetic_data['industrial_activities'])} Industrial Activity Records...")
        for act in synthetic_data["industrial_activities"]:
            act_obj = IndustrialActivity(
                industry_id=act["industry_id"],
                shift_name=act["shift_name"],
                start_time=act["start_time"],
                end_time=act["end_time"],
                declared_operating_status=act["declared_operating_status"],
                estimated_emission_factor=act["estimated_emission_factor"],
                notes=act["notes"],
            )
            db.add(act_obj)
        db.commit()

        # 8. Seed Sensor Readings
        print(f"\n[8/10] Inserting {len(synthetic_data['readings'])} Sensor Readings...")
        existing_readings_count = db.execute(select(func.count(SensorReading.reading_id))).scalar()
        if existing_readings_count == 0:
            reading_objs = []
            for r in synthetic_data["readings"]:
                geom = WKTElement(f"POINT({r['longitude']} {r['latitude']})", srid=4326)
                reading_objs.append(
                    SensorReading(
                        node_id=r["node_id"],
                        recorded_at=r["recorded_at"],
                        received_at=r["received_at"],
                        location=geom,
                        pm25=r["pm25"],
                        pm25_quality=r["pm25_quality"],
                        so2=r["so2"],
                        so2_quality=r["so2_quality"],
                        temperature=r["temperature"],
                        humidity=r["humidity"],
                        wind_speed=r["wind_speed"],
                        wind_direction=r["wind_direction"],
                        raw_payload=r["raw_payload"],
                    )
                )
            db.bulk_save_objects(reading_objs)
            db.commit()
            print(f"  + Inserted {len(reading_objs)} telemetry readings.")
        else:
            print(f"  * Sensor readings already exist ({existing_readings_count} rows).")

        # 9. Seed Pollution Events & Derived Intelligence
        print("\n[9/10] Seeding Pollution Events, Classifications, Attributions & Evidence...")
        created_events = []
        for ev in synthetic_data["events"]:
            existing_ev = db.execute(
                select(PollutionEvent).where(
                    PollutionEvent.detected_at == ev["detected_at"],
                    PollutionEvent.village_id == ev["village_id"]
                )
            ).scalar_one_or_none()

            if not existing_ev:
                ev_obj = PollutionEvent(
                    village_id=ev["village_id"],
                    detected_at=ev["detected_at"],
                    started_at=ev["started_at"],
                    ended_at=ev["ended_at"],
                    severity=ev["severity"],
                    peak_pm25=ev["peak_pm25"],
                    peak_so2=ev["peak_so2"],
                    status=ev["status"],
                    description=ev["description"],
                )
                db.add(ev_obj)
                db.flush()
                created_events.append(ev_obj)
                print(f"  + Created Pollution Event: {ev['severity'].upper()} on {ev['started_at']}")
            else:
                created_events.append(existing_ev)

        # Classifications
        for cl in synthetic_data["classifications"]:
            target_event = created_events[cl["event_index"]]
            db.add(
                EventClassification(
                    event_id=target_event.event_id,
                    classification_type=cl["classification_type"],
                    confidence_score=cl["confidence_score"],
                    model_version=cl["model_version"],
                    features_used=cl["features_used"],
                    classified_at=cl["classified_at"],
                )
            )

        # Source Attributions
        for attr in synthetic_data["attributions"]:
            target_event = created_events[attr["event_index"]]
            db.add(
                SourceAttribution(
                    event_id=target_event.event_id,
                    industry_id=attr["industry_id"],
                    rank=attr["rank"],
                    probability_score=attr["probability_score"],
                    plume_model_params=attr["plume_model_params"],
                    calculated_at=attr["calculated_at"],
                )
            )

        # Evidence Records
        for evr in synthetic_data["evidence_records"]:
            target_event = created_events[evr["event_index"]]
            db.add(
                EvidenceRecord(
                    event_id=target_event.event_id,
                    evidence_type=evr["evidence_type"],
                    data_payload=evr["data_payload"],
                    confidence_weight=evr["confidence_weight"],
                )
            )

        # Evidence Snapshots
        for snap in synthetic_data["snapshots"]:
            target_event = created_events[snap["event_index"]]
            db.add(
                EvidenceSnapshot(
                    event_id=target_event.event_id,
                    snapshot_type=snap["snapshot_type"],
                    file_path=snap["file_path"],
                    file_hash=snap["file_hash"],
                    generated_at=snap["generated_at"],
                    metadata_json=snap["metadata_json"],
                )
            )

        # 10. Seed Complaints, Documents, Ops & Maintenance
        print("\n[10/10] Seeding Complaints, Documents, Notifications & Audit Logs...")
        created_complaints = []
        for cmp in synthetic_data["complaints"]:
            target_event = created_events[cmp["event_index"]]
            existing_cmp = db.execute(
                select(Complaint).where(Complaint.complaint_number == cmp["complaint_number"])
            ).scalar_one_or_none()

            if not existing_cmp:
                cmp_obj = Complaint(
                    complaint_number=cmp["complaint_number"],
                    event_id=target_event.event_id,
                    filed_by_user_id=cmp["filed_by_user_id"],
                    village_id=cmp["village_id"],
                    gspcb_form_data=cmp["gspcb_form_data"],
                    status=cmp["status"],
                    submission_reference=cmp["submission_reference"],
                    submitted_at=cmp["submitted_at"],
                )
                db.add(cmp_obj)
                db.flush()
                created_complaints.append(cmp_obj)
                print(f"  + Created Complaint: {cmp['complaint_number']} ({cmp['status']})")
            else:
                created_complaints.append(existing_cmp)

        for doc in synthetic_data["complaint_documents"]:
            target_cmp = created_complaints[doc["complaint_index"]]
            db.add(
                ComplaintDocument(
                    complaint_id=target_cmp.complaint_id,
                    generated_by_user_id=doc["generated_by_user_id"],
                    version_number=doc["version_number"],
                    file_path=doc["file_path"],
                    file_hash=doc["file_hash"],
                    document_type=doc["document_type"],
                    generated_at=doc["generated_at"],
                )
            )

        for maint in synthetic_data["maintenance_records"]:
            db.add(
                MaintenanceRecord(
                    node_id=maint["node_id"],
                    reported_by_user_id=maint["reported_by_user_id"],
                    issue_type=maint["issue_type"],
                    description=maint["description"],
                    status=maint["status"],
                    scheduled_date=maint["scheduled_date"],
                    resolved_at=maint["resolved_at"],
                    notes=maint["notes"],
                )
            )

        for notif in synthetic_data["notifications"]:
            db.add(
                Notification(
                    recipient_user_id=notif["recipient_user_id"],
                    recipient_contact=notif["recipient_contact"],
                    channel=notif["channel"],
                    notification_type=notif["notification_type"],
                    title=notif["title"],
                    message_body=notif["message_body"],
                    status=notif["status"],
                    sent_at=notif["sent_at"],
                )
            )

        for alog in synthetic_data["audit_logs"]:
            db.add(
                AuditLog(
                    user_id=alog["user_id"],
                    action=alog["action"],
                    entity_type=alog["entity_type"],
                    entity_id=alog["entity_id"],
                    changes=alog["changes"],
                    ip_address=alog["ip_address"],
                    created_at=alog["created_at"],
                )
            )

        db.commit()
        print("\n==================================================")
        print("  Deterministic Seed Completed Successfully!")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seed process failed: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
