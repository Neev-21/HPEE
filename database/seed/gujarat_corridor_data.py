"""Deterministic Gujarat Industrial Corridor Static Seed Data (Ankleshwar - Panoli - Dahej - Jhagadia)

All coordinates are in SRID 4326 (longitude, latitude).

Emission profiles: 0-1 relative intensity per pollutant (1.0 = primary emitter)
Shift schedules: realistic GIDC Ankleshwar operating patterns (synthetic but domain-accurate)
"""

USERS_DATA = [
    {
        "email": "admin@hpee.gov.in",
        "full_name": "Dr. Rajesh Varma",
        "role": "admin",
        "phone_number": "+919825012345",
        "password_hash": "$2b$12$e8Yk1.7zU.7vH4E.PZqU/.Z1ZpQ4u1u.r9Y3k1p5o8E9y6z1y8e6e",
        "is_active": True,
    },
    {
        "email": "sarpanch.piraman@gujaratpanchayat.in",
        "full_name": "Sureshbhai Patel (Sarpanch Piraman)",
        "role": "sarpanch",
        "phone_number": "+919879011223",
        "password_hash": "$2b$12$e8Yk1.7zU.7vH4E.PZqU/.Z1ZpQ4u1u.r9Y3k1p5o8E9y6z1y8e6e",
        "is_active": True,
    },
    {
        "email": "inspector.ankleshwar@gspcb.gov.in",
        "full_name": "Mehul Joshi (Regional Officer GSPCB)",
        "role": "inspector",
        "phone_number": "+919426033445",
        "password_hash": "$2b$12$e8Yk1.7zU.7vH4E.PZqU/.Z1ZpQ4u1u.r9Y3k1p5o8E9y6z1y8e6e",
        "is_active": True,
    },
    {
        "email": "citizen.kiran@gmail.com",
        "full_name": "Kiranbhai Desai",
        "role": "public",
        "phone_number": "+919909055667",
        "password_hash": "$2b$12$e8Yk1.7zU.7vH4E.PZqU/.Z1ZpQ4u1u.r9Y3k1p5o8E9y6z1y8e6e",
        "is_active": True,
    },
]

VILLAGES_DATA = [
    {"name": "Ankleshwar GIDC Locality", "district": "Bharuch", "state": "Gujarat", "longitude": 73.0150, "latitude": 21.6320, "population": 45000},
    {"name": "Sanoli",                   "district": "Bharuch", "state": "Gujarat", "longitude": 73.0020, "latitude": 21.6180, "population": 8500},
    {"name": "Piraman",                  "district": "Bharuch", "state": "Gujarat", "longitude": 73.0300, "latitude": 21.6240, "population": 12000},
    {"name": "Jitali",                   "district": "Bharuch", "state": "Gujarat", "longitude": 73.0420, "latitude": 21.6450, "population": 9200},
    {"name": "Dadhal",                   "district": "Bharuch", "state": "Gujarat", "longitude": 72.9920, "latitude": 21.6580, "population": 6400},
    {"name": "Panoli GIDC Residential",  "district": "Bharuch", "state": "Gujarat", "longitude": 72.9640, "latitude": 21.5320, "population": 18000},
    {"name": "Bakrol",                   "district": "Bharuch", "state": "Gujarat", "longitude": 72.9810, "latitude": 21.5450, "population": 5800},
    {"name": "Kharod",                   "district": "Bharuch", "state": "Gujarat", "longitude": 72.9490, "latitude": 21.5210, "population": 7100},
    {"name": "Dahej Port Village",       "district": "Bharuch", "state": "Gujarat", "longitude": 72.5850, "latitude": 21.7120, "population": 14000},
    {"name": "Rahiyad",                  "district": "Bharuch", "state": "Gujarat", "longitude": 72.6100, "latitude": 21.7300, "population": 4900},
    {"name": "Jhagadia Township",        "district": "Bharuch", "state": "Gujarat", "longitude": 73.1530, "latitude": 21.7140, "population": 16500},
    {"name": "Andada",                   "district": "Bharuch", "state": "Gujarat", "longitude": 73.0100, "latitude": 21.6400, "population": 11200},
]

# ---------------------------------------------------------------------------
# Industrial Sites with emission profiles
# ---------------------------------------------------------------------------
# emission_profile keys: so2, nox, pm25, co, no2  (0.0-1.0 relative intensity)
# 1.0 = primary / heavy emitter of that pollutant
# 0.0 = negligible emission

INDUSTRIAL_SITES_DATA = [
    # -------------------------------------------------------------------------
    # Ankleshwar GIDC Cluster
    # -------------------------------------------------------------------------
    {
        "name": "Gujarat Organics & Dyes Ltd - Plot 401",
        "industry_type": "Dyes & Intermediates",
        "gspcb_consent_id": "GSPCB/CCA-BH-10492/2024",
        "longitude": 73.0185, "latitude": 21.6345,
        "address": "Plot 401/402, GIDC Phase II, Ankleshwar",
        "village_name": "Ankleshwar GIDC Locality",
        "declared_process": "H-acid synthesis, Sulphonation, Azo coupling",
        "emission_profile": {"so2": 0.92, "nox": 0.35, "pm25": 0.75, "co": 0.20, "no2": 0.30},
    },
    {
        "name": "Narmada Synthetic Chemicals Pvt Ltd",
        "industry_type": "Specialty Chemicals",
        "gspcb_consent_id": "GSPCB/CCA-BH-11205/2023",
        "longitude": 73.0210, "latitude": 21.6310,
        "address": "Plot 512, GIDC Phase II, Ankleshwar",
        "village_name": "Ankleshwar GIDC Locality",
        "declared_process": "Chlorination, Nitration, Hydrogenation",
        "emission_profile": {"so2": 0.45, "nox": 0.60, "pm25": 0.55, "co": 0.40, "no2": 0.65},
    },
    {
        "name": "Bharuch Pigments & Intermediates Corp",
        "industry_type": "Dyes & Pigments",
        "gspcb_consent_id": "GSPCB/CCA-BH-09881/2024",
        "longitude": 73.0120, "latitude": 21.6280,
        "address": "Plot 108, GIDC Phase I, Ankleshwar",
        "village_name": "Sanoli",
        "declared_process": "Diazotization, Coupling, Pigment press filtration",
        "emission_profile": {"so2": 0.80, "nox": 0.25, "pm25": 0.90, "co": 0.15, "no2": 0.20},
    },
    {
        "name": "Apex Agro-Chem Synthesis",
        "industry_type": "Agrochemicals",
        "gspcb_consent_id": "GSPCB/CCA-BH-14562/2025",
        "longitude": 73.0270, "latitude": 21.6260,
        "address": "Plot 805, GIDC Phase III, Ankleshwar",
        "village_name": "Piraman",
        "declared_process": "Organophosphate synthesis, Solvent extraction",
        "emission_profile": {"so2": 0.20, "nox": 0.55, "pm25": 0.40, "co": 0.70, "no2": 0.50},
    },
    {
        "name": "Zenith Pharma Intermediates Ltd",
        "industry_type": "Pharma (Active Ingredients)",
        "gspcb_consent_id": "GSPCB/CCA-BH-13110/2024",
        "longitude": 73.0390, "latitude": 21.6420,
        "address": "Plot 920, GIDC Phase IV, Ankleshwar",
        "village_name": "Jitali",
        "declared_process": "API synthesis, Solvent recovery, Distillation",
        "emission_profile": {"so2": 0.10, "nox": 0.30, "pm25": 0.35, "co": 0.50, "no2": 0.25},
    },
    {
        "name": "Shree Ram Sulphur & Acid Works",
        "industry_type": "Basic Chemicals & Acids",
        "gspcb_consent_id": "GSPCB/CCA-BH-08743/2023",
        "longitude": 73.0160, "latitude": 21.6380,
        "address": "Plot 220, GIDC Phase I, Ankleshwar",
        "village_name": "Andada",
        "declared_process": "Sulphuric acid production, Oleum handling, H2S absorption",
        "emission_profile": {"so2": 0.98, "nox": 0.10, "pm25": 0.45, "co": 0.05, "no2": 0.08},
    },
    {
        "name": "Sterling Fine Chemicals Ltd",
        "industry_type": "Specialty Chemicals",
        "gspcb_consent_id": "GSPCB/CCA-BH-12940/2024",
        "longitude": 72.9960, "latitude": 21.6540,
        "address": "Plot 64, Industrial Extension, Dadhal",
        "village_name": "Dadhal",
        "declared_process": "Fluorination, Bromination, Speciality polymer monomers",
        "emission_profile": {"so2": 0.30, "nox": 0.45, "pm25": 0.50, "co": 0.35, "no2": 0.55},
    },
    # -------------------------------------------------------------------------
    # Panoli GIDC Cluster
    # -------------------------------------------------------------------------
    {
        "name": "Panoli Chlor-Alkali & Derivatives",
        "industry_type": "Petrochemicals & Chlor-Alkali",
        "gspcb_consent_id": "GSPCB/CCA-BH-20112/2023",
        "longitude": 72.9680, "latitude": 21.5360,
        "address": "Plot 301-305, GIDC Panoli",
        "village_name": "Panoli GIDC Residential",
        "declared_process": "Chlorine electrolysis, Caustic soda, PVC compounding",
        "emission_profile": {"so2": 0.15, "nox": 0.50, "pm25": 0.60, "co": 0.30, "no2": 0.70},
    },
    {
        "name": "Vanguard Pesticides & Formulations",
        "industry_type": "Agrochemicals",
        "gspcb_consent_id": "GSPCB/CCA-BH-21445/2024",
        "longitude": 72.9780, "latitude": 21.5420,
        "address": "Plot 415, GIDC Panoli",
        "village_name": "Bakrol",
        "declared_process": "Pesticide formulation, Packaging, Solvent blending",
        "emission_profile": {"so2": 0.12, "nox": 0.40, "pm25": 0.55, "co": 0.60, "no2": 0.35},
    },
    {
        "name": "Shiva Petrochem Refining Additives",
        "industry_type": "Petrochemicals",
        "gspcb_consent_id": "GSPCB/CCA-BH-22980/2024",
        "longitude": 72.9520, "latitude": 21.5240,
        "address": "Plot 112, GIDC Panoli",
        "village_name": "Kharod",
        "declared_process": "Refinery additive blending, Lube oil processing",
        "emission_profile": {"so2": 0.55, "nox": 0.70, "pm25": 0.65, "co": 0.45, "no2": 0.60},
    },
    # -------------------------------------------------------------------------
    # Dahej PCPIR Cluster
    # -------------------------------------------------------------------------
    {
        "name": "Dahej Petrochemical Complex Unit-1",
        "industry_type": "Petrochemicals",
        "gspcb_consent_id": "GSPCB/CCA-BH-30554/2023",
        "longitude": 72.5890, "latitude": 21.7160,
        "address": "Plot Z-1, PCPIR SEZ, Dahej",
        "village_name": "Dahej Port Village",
        "declared_process": "Naphtha cracking, Ethylene/Propylene production, Furnace combustion",
        "emission_profile": {"so2": 0.65, "nox": 0.85, "pm25": 0.70, "co": 0.55, "no2": 0.80},
    },
    {
        "name": "Western India Bulk Fertilizers Corp",
        "industry_type": "Fertilizers",
        "gspcb_consent_id": "GSPCB/CCA-BH-31890/2024",
        "longitude": 72.6050, "latitude": 21.7280,
        "address": "Plot D-45, Dahej Industrial Zone",
        "village_name": "Rahiyad",
        "declared_process": "Urea synthesis, Ammonia handling, Granulation",
        "emission_profile": {"so2": 0.20, "nox": 0.75, "pm25": 0.80, "co": 0.25, "no2": 0.70},
    },
    # -------------------------------------------------------------------------
    # Jhagadia Industrial Estate Cluster
    # -------------------------------------------------------------------------
    {
        "name": "Jhagadia Specialty Resins & Polymers",
        "industry_type": "Polymers & Resins",
        "gspcb_consent_id": "GSPCB/CCA-BH-40112/2024",
        "longitude": 73.1580, "latitude": 21.7190,
        "address": "Plot 701, GIDC Jhagadia",
        "village_name": "Jhagadia Township",
        "declared_process": "Epoxy resin curing, Polymer extrusion, Solvent use",
        "emission_profile": {"so2": 0.08, "nox": 0.35, "pm25": 0.60, "co": 0.55, "no2": 0.30},
    },
    {
        "name": "United Carbon & Black Works",
        "industry_type": "Carbon & Pigments",
        "gspcb_consent_id": "GSPCB/CCA-BH-41550/2023",
        "longitude": 73.1490, "latitude": 21.7100,
        "address": "Plot 812, GIDC Jhagadia",
        "village_name": "Jhagadia Township",
        "declared_process": "Carbon black production, Furnace combustion, PM-heavy process",
        "emission_profile": {"so2": 0.50, "nox": 0.60, "pm25": 0.95, "co": 0.70, "no2": 0.55},
    },
]

# ---------------------------------------------------------------------------
# Industrial Shift Schedules (Data-C) — Synthetic but domain-realistic
# ---------------------------------------------------------------------------
# Format per shift:
#   industry_name: matches name in INDUSTRIAL_SITES_DATA
#   shift_name:    human-readable shift label
#   start_time:    HH:MM (24h, IST)
#   end_time:      HH:MM (24h, IST) — None means continuous / open-ended
#   days_of_week:  list of int (0=Mon, 6=Sun); None = all days
#   process_notes: what they're doing in this shift (relevant to emissions)

INDUSTRIAL_ACTIVITIES_DATA = [
    # --- Gujarat Organics & Dyes Ltd --- (Heavy sulphonation — 2 shifts)
    {"industry_name": "Gujarat Organics & Dyes Ltd - Plot 401",
     "shift_name": "Day Batch - Azo Coupling",
     "start_time": "08:00", "end_time": "20:00", "days_of_week": [0,1,2,3,4],
     "process_notes": "Azo dye coupling. Moderate SO2 from acid usage."},
    {"industry_name": "Gujarat Organics & Dyes Ltd - Plot 401",
     "shift_name": "Night Batch - Sulphonation",
     "start_time": "22:00", "end_time": "06:00", "days_of_week": None,  # Every night
     "process_notes": "H-acid sulphonation. High SO2 and PM2.5 release possible."},

    # --- Narmada Synthetic Chemicals --- (3 shifts)
    {"industry_name": "Narmada Synthetic Chemicals Pvt Ltd",
     "shift_name": "Morning Shift A",
     "start_time": "06:00", "end_time": "14:00", "days_of_week": None,
     "process_notes": "Chlorination step. NOx and HCl emission."},
    {"industry_name": "Narmada Synthetic Chemicals Pvt Ltd",
     "shift_name": "Afternoon Shift B",
     "start_time": "14:00", "end_time": "22:00", "days_of_week": None,
     "process_notes": "Nitration step. NOx + NO2 emission."},
    {"industry_name": "Narmada Synthetic Chemicals Pvt Ltd",
     "shift_name": "Night Shift C",
     "start_time": "22:00", "end_time": "06:00", "days_of_week": None,
     "process_notes": "Hydrogenation. Lower emissions. Maintenance window."},

    # --- Bharuch Pigments --- (Day only, 6 days)
    {"industry_name": "Bharuch Pigments & Intermediates Corp",
     "shift_name": "Diazotization Day Run",
     "start_time": "07:00", "end_time": "19:00", "days_of_week": [0,1,2,3,4,5],
     "process_notes": "Diazotization + press filtration. PM2.5 and SO2 spikes."},

    # --- Apex Agro-Chem --- (Day shift only)
    {"industry_name": "Apex Agro-Chem Synthesis",
     "shift_name": "Synthesis Day Shift",
     "start_time": "08:00", "end_time": "20:00", "days_of_week": [0,1,2,3,4],
     "process_notes": "Organophosphate synthesis. NOx + CO emission."},

    # --- Zenith Pharma --- (Day shift + weekend cleanup)
    {"industry_name": "Zenith Pharma Intermediates Ltd",
     "shift_name": "API Production Day",
     "start_time": "08:00", "end_time": "18:00", "days_of_week": [0,1,2,3,4],
     "process_notes": "API synthesis + solvent recovery. Low SO2, moderate CO."},
    {"industry_name": "Zenith Pharma Intermediates Ltd",
     "shift_name": "Weekend Reactor Cleaning",
     "start_time": "09:00", "end_time": "17:00", "days_of_week": [6],
     "process_notes": "Vessel cleaning + steam stripping. Slight VOC release."},

    # --- Shree Ram Sulphur & Acid Works --- (Continuous 24/7)
    {"industry_name": "Shree Ram Sulphur & Acid Works",
     "shift_name": "Continuous Production",
     "start_time": "00:00", "end_time": None, "days_of_week": None,
     "process_notes": "Sulphuric acid production runs 24/7. SO2 is continuous."},

    # --- Sterling Fine Chemicals --- (2 shifts)
    {"industry_name": "Sterling Fine Chemicals Ltd",
     "shift_name": "Morning Fluorination Run",
     "start_time": "06:00", "end_time": "18:00", "days_of_week": [0,1,2,3,4],
     "process_notes": "Fluorination batch. NOx + NO2 release."},
    {"industry_name": "Sterling Fine Chemicals Ltd",
     "shift_name": "Night Maintenance & Wash",
     "start_time": "20:00", "end_time": "04:00", "days_of_week": [0,1,2,3],
     "process_notes": "Equipment wash. Reduced emissions."},

    # --- Panoli Chlor-Alkali --- (Continuous)
    {"industry_name": "Panoli Chlor-Alkali & Derivatives",
     "shift_name": "Chlor-Alkali Continuous",
     "start_time": "00:00", "end_time": None, "days_of_week": None,
     "process_notes": "Electrolysis is continuous. NOx + Cl2 emission."},

    # --- Vanguard Pesticides --- (Day shift)
    {"industry_name": "Vanguard Pesticides & Formulations",
     "shift_name": "Formulation Day",
     "start_time": "08:00", "end_time": "18:00", "days_of_week": [0,1,2,3,4],
     "process_notes": "Pesticide blending and packaging. CO + solvent vapour."},

    # --- Shiva Petrochem --- (3 shifts, 6 days)
    {"industry_name": "Shiva Petrochem Refining Additives",
     "shift_name": "Day Blending",
     "start_time": "06:00", "end_time": "14:00", "days_of_week": [0,1,2,3,4,5],
     "process_notes": "Lube oil blending. NOx + SO2 from burners."},
    {"industry_name": "Shiva Petrochem Refining Additives",
     "shift_name": "Afternoon Processing",
     "start_time": "14:00", "end_time": "22:00", "days_of_week": [0,1,2,3,4,5],
     "process_notes": "Hydrocracker additives. SO2 + NOx."},

    # --- Dahej Petrochemical Complex --- (Continuous, highest emitter)
    {"industry_name": "Dahej Petrochemical Complex Unit-1",
     "shift_name": "Cracker Continuous",
     "start_time": "00:00", "end_time": None, "days_of_week": None,
     "process_notes": "Naphtha cracker furnaces run continuously. High NOx, SO2, CO."},

    # --- Western India Bulk Fertilizers --- (Continuous)
    {"industry_name": "Western India Bulk Fertilizers Corp",
     "shift_name": "Urea Synthesis Continuous",
     "start_time": "00:00", "end_time": None, "days_of_week": None,
     "process_notes": "Ammonia + CO2 reaction continuous. NOx + PM from granulation."},

    # --- Jhagadia Specialty Resins --- (Day only)
    {"industry_name": "Jhagadia Specialty Resins & Polymers",
     "shift_name": "Extrusion Day Shift",
     "start_time": "07:00", "end_time": "19:00", "days_of_week": [0,1,2,3,4],
     "process_notes": "Polymer extrusion. CO + PM from heated resins."},

    # --- United Carbon & Black Works --- (Night heavy, day light)
    {"industry_name": "United Carbon & Black Works",
     "shift_name": "Carbon Black Day Furnace",
     "start_time": "08:00", "end_time": "20:00", "days_of_week": None,
     "process_notes": "Carbon black furnace. Very high PM2.5 and CO."},
    {"industry_name": "United Carbon & Black Works",
     "shift_name": "Carbon Black Night Furnace",
     "start_time": "20:00", "end_time": "08:00", "days_of_week": None,
     "process_notes": "Continuous night furnace run. High PM, SO2, CO."},
]

SENSOR_NODES_DATA = [
    {"node_id": "HPEE-ANK-001", "village_name": "Ankleshwar GIDC Locality", "longitude": 73.0162, "latitude": 21.6335, "status": "online",  "battery_percent": 88.5, "signal_strength": -64, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-002", "village_name": "Sanoli",                   "longitude": 73.0035, "latitude": 21.6192, "status": "online",  "battery_percent": 92.0, "signal_strength": -68, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-003", "village_name": "Piraman",                  "longitude": 73.0285, "latitude": 21.6255, "status": "online",  "battery_percent": 79.4, "signal_strength": -58, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-004", "village_name": "Jitali",                   "longitude": 73.0410, "latitude": 21.6440, "status": "online",  "battery_percent": 84.1, "signal_strength": -72, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-005", "village_name": "Dadhal",                   "longitude": 72.9935, "latitude": 21.6570, "status": "online",  "battery_percent": 95.0, "signal_strength": -62, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-006", "village_name": "Andada",                   "longitude": 73.0115, "latitude": 21.6392, "status": "online",  "battery_percent": 76.0, "signal_strength": -65, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-007", "village_name": "Panoli GIDC Residential",  "longitude": 72.9655, "latitude": 21.5330, "status": "fault",   "battery_percent": 34.0, "signal_strength": -89, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-008", "village_name": "Bakrol",                   "longitude": 72.9825, "latitude": 21.5460, "status": "online",  "battery_percent": 91.5, "signal_strength": -70, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-009", "village_name": "Kharod",                   "longitude": 72.9505, "latitude": 21.5225, "status": "online",  "battery_percent": 82.3, "signal_strength": -66, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-010", "village_name": "Dahej Port Village",        "longitude": 72.5865, "latitude": 21.7135, "status": "online",  "battery_percent": 89.0, "signal_strength": -60, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-011", "village_name": "Rahiyad",                  "longitude": 72.6115, "latitude": 21.7315, "status": "online",  "battery_percent": 90.5, "signal_strength": -73, "sensor_type": "PMS5003_SO2_MET_V1"},
    {"node_id": "HPEE-ANK-012", "village_name": "Jhagadia Township",         "longitude": 73.1545, "latitude": 21.7155, "status": "online",  "battery_percent": 87.2, "signal_strength": -61, "sensor_type": "PMS5003_SO2_MET_V1"},
]
