"""Deterministic Sensor Telemetry, Pollution Events, Weather, and Evidence Generator

Uses a fixed random seed (42) for reproducible synthetic datasets.
"""

import math
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any


def generate_synthetic_dataset(
    nodes: List[Dict[str, Any]],
    villages_map: Dict[str, Any],
    industries_map: Dict[str, Any],
    users_map: Dict[str, Any],
    start_date: datetime = datetime(2026, 8, 15, 0, 0, 0, tzinfo=timezone.utc),
    days: int = 7,
    interval_minutes: int = 15
) -> Dict[str, Any]:
    """Generates deterministic sensor readings, weather, events, attributions, and complaints."""
    rng = random.Random(42)

    total_steps = (days * 24 * 60) // interval_minutes
    readings = []
    weather_records = []
    events = []
    event_readings_map = []
    classifications = []
    attributions = []
    evidence_records = []
    snapshots = []
    complaints = []
    complaint_documents = []
    maintenance_records = []
    notifications = []
    audit_logs = []
    industrial_activities = []

    # 1. Generate Industrial Activity Schedules
    ank_ind_1 = industries_map.get("Gujarat Organics & Dyes Ltd - Plot 401")
    ank_ind_2 = industries_map.get("Narmada Synthetic Chemicals Pvt Ltd")

    if ank_ind_1:
        # High-load night batch on Day 3 (2026-08-18 22:00 to 2026-08-19 06:00)
        industrial_activities.append({
            "industry_id": ank_ind_1["industry_id"],
            "shift_name": "Night Batch Sulphonation - Reactor 3",
            "start_time": start_date + timedelta(days=3, hours=22),
            "end_time": start_date + timedelta(days=4, hours=6),
            "declared_operating_status": "high_load_batch",
            "estimated_emission_factor": 2.8,
            "notes": "Sulphonation unit active during nocturnal shift.",
        })

    if ank_ind_2:
        industrial_activities.append({
            "industry_id": ank_ind_2["industry_id"],
            "shift_name": "Standard Continuous Shift B",
            "start_time": start_date + timedelta(days=3, hours=16),
            "end_time": start_date + timedelta(days=4, hours=0),
            "declared_operating_status": "normal_operations",
            "estimated_emission_factor": 1.1,
            "notes": "Solvent distillation line running at 80% capacity.",
        })

    # 2. Time-series loop
    for step in range(total_steps):
        current_time = start_date + timedelta(minutes=step * interval_minutes)
        hour = current_time.hour + current_time.minute / 60.0

        # Diurnal weather pattern for Bharuch/Ankleshwar
        # Temp: min at 05:00 (~24C), max at 14:00 (~35C)
        temp_baseline = 29.5 + 5.5 * math.sin((hour - 9) * math.pi / 12) + rng.uniform(-0.8, 0.8)
        # Humidity: inverse to temp (~55% to 85%)
        hum_baseline = 70.0 - 15.0 * math.sin((hour - 9) * math.pi / 12) + rng.uniform(-2.0, 2.0)
        hum_baseline = max(10.0, min(99.0, hum_baseline))

        # Baseline wind: NW-to-SE (approx 310-330 deg) during monsoon/post-monsoon
        wind_dir_baseline = (315.0 + 20.0 * math.sin(step / 20.0) + rng.uniform(-10, 10)) % 360.0
        wind_spd_baseline = max(0.5, 3.2 + 1.5 * math.sin((hour - 11) * math.pi / 12) + rng.uniform(-0.5, 0.5))
        pressure_baseline = 1008.0 + 3.0 * math.sin((hour - 4) * math.pi / 12) + rng.uniform(-0.5, 0.5)

        # Weather observation record (hourly or half-hourly)
        if step % 2 == 0:
            weather_records.append({
                "recorded_at": current_time,
                "longitude": 73.0150,
                "latitude": 21.6320,
                "temperature": round(temp_baseline, 2),
                "humidity": round(hum_baseline, 2),
                "wind_speed": round(wind_spd_baseline, 2),
                "wind_direction": round(wind_dir_baseline, 2),
                "pressure": round(pressure_baseline, 2),
                "source_provider": "IMD_BHARUCH_AWS",
            })

        # Event flag checks
        # Event 1: Day 3 23:30 to Day 4 04:30 (Industrial Chemical Release)
        is_event_1 = (
            (start_date + timedelta(days=3, hours=23, minutes=30))
            <= current_time
            <= (start_date + timedelta(days=4, hours=4, minutes=30))
        )

        # Event 2: Day 5 17:00 to Day 5 22:00 (Agricultural Burning)
        is_event_2 = (
            (start_date + timedelta(days=5, hours=17))
            <= current_time
            <= (start_date + timedelta(days=5, hours=22))
        )

        # Event 3: Day 6 02:00 to Day 6 07:30 (Nocturnal Inversion)
        is_event_3 = (
            (start_date + timedelta(days=6, hours=2))
            <= current_time
            <= (start_date + timedelta(days=6, hours=7, minutes=30))
        )

        # Node Fault: Day 4 08:00 to 20:00 on HPEE-ANK-007
        is_fault_node = (
            (start_date + timedelta(days=4, hours=8))
            <= current_time
            <= (start_date + timedelta(days=4, hours=20))
        )

        for node in nodes:
            node_id = node["node_id"]
            node_lon = node["longitude"]
            node_lat = node["latitude"]

            # Background diurnal PM2.5 & SO2
            pm25 = 32.0 + 12.0 * math.sin((hour + 3) * math.pi / 12) + rng.uniform(-4.0, 4.0)
            so2 = 14.0 + 6.0 * math.sin((hour + 1) * math.pi / 12) + rng.uniform(-2.0, 2.0)
            pm25_qual = "valid"
            so2_qual = "valid"

            # Apply Event 1 (Industrial spike on Ankleshwar GIDC, Sanoli, Piraman)
            if is_event_1 and node_id in ("HPEE-ANK-001", "HPEE-ANK-002", "HPEE-ANK-003"):
                intensity = math.sin(((current_time - (start_date + timedelta(days=3, hours=23, minutes=30))).total_seconds() / (5 * 3600)) * math.pi)
                pm25 += 140.0 * max(0.0, intensity) + rng.uniform(5.0, 15.0)
                so2 += 115.0 * max(0.0, intensity) + rng.uniform(8.0, 20.0)

            # Apply Event 2 (Agri burning on Dadhal & Jhagadia)
            if is_event_2 and node_id in ("HPEE-ANK-005", "HPEE-ANK-012"):
                intensity = math.sin(((current_time - (start_date + timedelta(days=5, hours=17))).total_seconds() / (5 * 3600)) * math.pi)
                pm25 += 180.0 * max(0.0, intensity) + rng.uniform(10.0, 25.0)
                so2 += rng.uniform(0.0, 4.0)  # low SO2 in biomass burning

            # Apply Event 3 (Inversion across all nodes)
            if is_event_3:
                pm25 += 75.0 + rng.uniform(-5.0, 8.0)
                so2 += 22.0 + rng.uniform(-2.0, 5.0)

            # Apply Sensor Fault on HPEE-ANK-007
            if is_fault_node and node_id == "HPEE-ANK-007":
                pm25 = 999.0  # sensor saturation/stuck fault
                pm25_qual = "invalid"
                so2 = 0.0
                so2_qual = "suspect"

            pm25 = round(max(0.0, pm25), 2)
            so2 = round(max(0.0, so2), 2)

            received_time = current_time + timedelta(seconds=rng.randint(2, 8))

            readings.append({
                "node_id": node_id,
                "recorded_at": current_time,
                "received_at": received_time,
                "longitude": node_lon,
                "latitude": node_lat,
                "pm25": pm25,
                "pm25_quality": pm25_qual,
                "so2": so2,
                "so2_quality": so2_qual,
                "temperature": round(temp_baseline + rng.uniform(-0.4, 0.4), 2),
                "humidity": round(hum_baseline + rng.uniform(-1.0, 1.0), 2),
                "wind_speed": round(wind_spd_baseline + rng.uniform(-0.2, 0.2), 2),
                "wind_direction": round(wind_dir_baseline + rng.uniform(-5.0, 5.0), 2),
                "raw_payload": {
                    "node_id": node_id,
                    "ts": current_time.isoformat(),
                    "pm25": pm25,
                    "so2": so2,
                    "batt": node["battery_percent"],
                    "rssi": node["signal_strength"],
                },
            })

    # 3. Create Defined Pollution Events & Lineage
    piraman_village = villages_map.get("Piraman")
    dadhal_village = villages_map.get("Dadhal")
    ankleshwar_village = villages_map.get("Ankleshwar GIDC Locality")
    sarpanch_user = users_map.get("sarpanch.piraman@gujaratpanchayat.in")

    # Event 1: Industrial SO2 & PM2.5 plume
    event_1_data = {
        "village_id": piraman_village["village_id"] if piraman_village else None,
        "detected_at": start_date + timedelta(days=3, hours=23, minutes=45),
        "started_at": start_date + timedelta(days=3, hours=23, minutes=30),
        "ended_at": start_date + timedelta(days=4, hours=4, minutes=30),
        "severity": "severe",
        "peak_pm25": 194.8,
        "peak_so2": 141.6,
        "status": "resolved",
        "description": "Severe nocturnal SO2 and PM2.5 plume detected downwind from Ankleshwar GIDC Phase II towards Piraman locality.",
    }
    events.append(event_1_data)

    # Event 1 Classification
    classifications.append({
        "event_index": 0,
        "classification_type": "industrial",
        "confidence_score": 0.94,
        "model_version": "hpee_multisensor_classifier_v1.4",
        "features_used": {
            "so2_to_pm25_ratio": 0.73,
            "wind_consistency": 0.92,
            "nocturnal_profile": True,
            "chemical_signature_match": True,
        },
        "classified_at": start_date + timedelta(days=4, hours=0, minutes=15),
    })

    # Event 1 Source Attributions
    if ank_ind_1:
        attributions.append({
            "event_index": 0,
            "industry_id": ank_ind_1["industry_id"],
            "rank": 1,
            "probability_score": 0.87,
            "plume_model_params": {
                "dispersion_model": "Gaussian_Plume_AERMOD_Lite",
                "upwind_vector_angle_deg": 315.0,
                "distance_to_sensor_m": 1250.0,
                "stack_height_m": 30.0,
                "confidence_interval": [0.81, 0.93],
            },
            "calculated_at": start_date + timedelta(days=4, hours=0, minutes=30),
        })

    if ank_ind_2:
        attributions.append({
            "event_index": 0,
            "industry_id": ank_ind_2["industry_id"],
            "rank": 2,
            "probability_score": 0.13,
            "plume_model_params": {
                "dispersion_model": "Gaussian_Plume_AERMOD_Lite",
                "upwind_vector_angle_deg": 328.0,
                "distance_to_sensor_m": 1680.0,
                "stack_height_m": 25.0,
                "confidence_interval": [0.08, 0.18],
            },
            "calculated_at": start_date + timedelta(days=4, hours=0, minutes=30),
        })

    # Event 1 Evidence Records
    evidence_records.extend([
        {
            "event_index": 0,
            "evidence_type": "sensor_spike",
            "data_payload": {
                "peak_so2_ug_m3": 141.6,
                "baseline_so2_ug_m3": 18.2,
                "peak_pm25_ug_m3": 194.8,
                "nodes_triggered": ["HPEE-ANK-001", "HPEE-ANK-003"],
            },
            "confidence_weight": 0.95,
        },
        {
            "event_index": 0,
            "evidence_type": "wind_vector_alignment",
            "data_payload": {
                "mean_wind_direction_deg": 316.4,
                "culprit_bearing_deg": 315.0,
                "bearing_delta_deg": 1.4,
                "mean_wind_speed_m_s": 2.8,
            },
            "confidence_weight": 0.92,
        },
        {
            "event_index": 0,
            "evidence_type": "industrial_schedule_match",
            "data_payload": {
                "culprit_name": "Gujarat Organics & Dyes Ltd - Plot 401",
                "declared_shift": "Night Batch Sulphonation - Reactor 3",
                "operating_status": "high_load_batch",
                "emission_factor": 2.8,
            },
            "confidence_weight": 0.88,
        },
    ])

    # Event 1 Snapshot
    snapshots.append({
        "event_index": 0,
        "snapshot_type": "composite_dossier",
        "file_path": "evidence/snapshots/2026-08-19_piraman_industrial_event_dossier.png",
        "file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "generated_at": start_date + timedelta(days=4, hours=5, minutes=0),
        "metadata_json": {
            "rendered_components": ["plume_map", "time_series", "wind_rose", "attribution_table"],
            "resolution": "1920x1080",
        },
    })

    # Event 1 GSPCB Form-A Complaint
    if sarpanch_user and piraman_village:
        complaints.append({
            "event_index": 0,
            "complaint_number": "GSPCB-HPEE-2026-ANK-0001",
            "filed_by_user_id": sarpanch_user["user_id"],
            "village_id": piraman_village["village_id"],
            "gspcb_form_data": {
                "form_title": "GSPCB Form-A Environmental Pollution Complaint",
                "complainant_name": "Sureshbhai Patel (Sarpanch Piraman)",
                "complainant_contact": "+919879011223",
                "locality": "Piraman Village, Ankleshwar Taluka, Bharuch District",
                "alleged_source": "Gujarat Organics & Dyes Ltd (Plot 401, GIDC Phase II)",
                "pollutants_observed": ["Sulphur Dioxide (SO2)", "Particulate Matter (PM2.5)", "Noxious Chemical Odor"],
                "peak_concentration_recorded": "SO2: 141.6 ug/m3, PM2.5: 194.8 ug/m3",
                "evidence_summary": "Continuous sensor readings from HPEE-ANK-003 showing sustained spike between 23:30 and 04:30 with 315° NW wind vector directly aligned with Plot 401 stack.",
                "action_requested": "Urgent inspection and stack monitoring under Air (Prevention and Control of Pollution) Act, 1981 Section 21.",
            },
            "status": "submitted",
            "submission_reference": "GSPCB/ONLINE/2026/BH-78412",
            "submitted_at": start_date + timedelta(days=4, hours=7, minutes=30),
        })

        complaint_documents.append({
            "complaint_index": 0,
            "generated_by_user_id": sarpanch_user["user_id"],
            "version_number": 1,
            "file_path": "complaints/docs/GSPCB-HPEE-2026-ANK-0001_FormA.pdf",
            "file_hash": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
            "document_type": "gspcb_form_a_pdf",
            "generated_at": start_date + timedelta(days=4, hours=7, minutes=20),
        })

    # Event 2: Agricultural Biomass Burning
    events.append({
        "village_id": dadhal_village["village_id"] if dadhal_village else None,
        "detected_at": start_date + timedelta(days=5, hours=17, minutes=30),
        "started_at": start_date + timedelta(days=5, hours=17, minutes=0),
        "ended_at": start_date + timedelta(days=5, hours=22, minutes=0),
        "severity": "high",
        "peak_pm25": 231.4,
        "peak_so2": 16.2,
        "status": "resolved",
        "description": "Post-harvest sugarcane stubble burning episode identified along agricultural periphery.",
    })

    classifications.append({
        "event_index": 1,
        "classification_type": "agricultural_burning",
        "confidence_score": 0.92,
        "model_version": "hpee_multisensor_classifier_v1.4",
        "features_used": {
            "so2_to_pm25_ratio": 0.07,
            "dusk_onset": True,
            "spatial_dispersion": "broad_rural",
        },
        "classified_at": start_date + timedelta(days=5, hours=18, minutes=0),
    })

    # Event 3: Weather Inversion
    events.append({
        "village_id": ankleshwar_village["village_id"] if ankleshwar_village else None,
        "detected_at": start_date + timedelta(days=6, hours=3, minutes=0),
        "started_at": start_date + timedelta(days=6, hours=2, minutes=0),
        "ended_at": start_date + timedelta(days=6, hours=7, minutes=30),
        "severity": "medium",
        "peak_pm25": 138.2,
        "peak_so2": 31.0,
        "status": "resolved",
        "description": "Nocturnal boundary layer thermal inversion causing regional accumulation of background particulate matter.",
    })

    classifications.append({
        "event_index": 2,
        "classification_type": "seasonal_inversion",
        "confidence_score": 0.89,
        "model_version": "hpee_multisensor_classifier_v1.4",
        "features_used": {
            "low_wind_speed": True,
            "high_humidity": True,
            "uniform_regional_rise": True,
        },
        "classified_at": start_date + timedelta(days=6, hours=3, minutes=30),
    })

    # Maintenance Record for Faulty Node HPEE-ANK-007
    maintenance_records.append({
        "node_id": "HPEE-ANK-007",
        "reported_by_user_id": sarpanch_user["user_id"] if sarpanch_user else None,
        "issue_type": "calibration_drift",
        "description": "Optical particle counter saturated at max reading (999 ug/m3). Suspected insect/dust ingress in intake chamber.",
        "status": "in_progress",
        "scheduled_date": start_date + timedelta(days=5, hours=10),
        "resolved_at": None,
        "notes": "Field technician dispatched with replacement laser scattering unit.",
    })

    # Notifications
    notifications.append({
        "recipient_user_id": sarpanch_user["user_id"] if sarpanch_user else None,
        "recipient_contact": "+919879011223",
        "channel": "whatsapp",
        "notification_type": "pollution_alert",
        "title": "CRITICAL: Severe Chemical Emission Detected in Piraman",
        "message_body": "HPEE Alert: SO2 levels reached 141.6 ug/m3 at 01:15 AM. Wind vector indicates emission source at GIDC Phase II. Pre-filled GSPCB Form-A is ready for your digital signature.",
        "status": "delivered",
        "sent_at": start_date + timedelta(days=4, hours=1, minutes=30),
    })

    # Audit Logs
    audit_logs.extend([
        {
            "user_id": sarpanch_user["user_id"] if sarpanch_user else None,
            "action": "SUBMIT_GSPCB_FORM_A",
            "entity_type": "complaints",
            "entity_id": "GSPCB-HPEE-2026-ANK-0001",
            "changes": {"status": {"from": "draft", "to": "submitted"}},
            "ip_address": "103.212.145.32",
            "created_at": start_date + timedelta(days=4, hours=7, minutes=30),
        },
        {
            "user_id": None,
            "action": "AUTO_DETECT_POLLUTION_EVENT",
            "entity_type": "pollution_events",
            "entity_id": "EVENT-001",
            "changes": {"severity": "severe", "peak_pm25": 194.8, "peak_so2": 141.6},
            "ip_address": "127.0.0.1",
            "created_at": start_date + timedelta(days=3, hours=23, minutes=45),
        }
    ])

    return {
        "readings": readings,
        "weather_records": weather_records,
        "industrial_activities": industrial_activities,
        "events": events,
        "classifications": classifications,
        "attributions": attributions,
        "evidence_records": evidence_records,
        "snapshots": snapshots,
        "complaints": complaints,
        "complaint_documents": complaint_documents,
        "maintenance_records": maintenance_records,
        "notifications": notifications,
        "audit_logs": audit_logs,
    }
