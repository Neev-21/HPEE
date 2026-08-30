# HPEE — Hyperlocal Pollution Evidence Engine
**Database Infrastructure, Data Models & Migration Suite**

Team: **Fifty Shades of Cache**  
Database: **PostgreSQL 17 + PostGIS 3.5**  
ORM: **SQLAlchemy 2.0**  
Migrations: **Alembic**  

---

## 1. Overview

HPEE is a contract-first environmental intelligence system that fuses low-cost distributed IoT sensor telemetry (PM2.5, SO2, wind vectors), industrial shift schedules, and meteorological data to detect pollution spikes, attribute probable industrial emission sources in the Gujarat industrial corridor (Ankleshwar, Panoli, Dahej, Jhagadia), and generate legally defensible GSPCB Form-A complaints.

---

## 2. Repository Layout

```
hpee/
├── backend/
│   └── app/
│       ├── core/               # Configuration settings (Pydantic)
│       ├── db/                 # Base declarative model & session maker
│       ├── models/             # SQLAlchemy 2.0 models (all 19 tables)
│       │   ├── user.py
│       │   ├── geography.py
│       │   ├── sensor.py
│       │   ├── pollution_event.py
│       │   ├── industry.py
│       │   ├── ops.py
│       │   ├── complaint.py
│       │   └── evidence.py
│       ├── schemas/            # Pydantic schemas for API validation
│       └── main.py             # FastAPI entrypoint (Future)
├── database/
│   ├── seed/                   # Deterministic seed data generator
│   │   ├── gujarat_corridor_data.py
│   │   ├── telemetry_generator.py
│   │   └── seed_data.py
│   └── scripts/                # Setup & reset utility scripts
│       ├── init_postgis.sql
│       └── reset_db.sh
├── alembic/                    # Alembic migration environment
│   ├── env.py                  # PostGIS & GeoAlchemy2 migration config
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial_schema.py
├── tests/                      # Automated pytest validation suite
│   ├── test_schema_constraints.py
│   └── test_seed_integrity.py
├── docs/                       # Contracts & Architecture documentation
│   ├── DATABASE_CONTRACT.md
│   ├── API_CONTRACT.md
│   └── SYSTEM_ARCHITECTURE.md
├── docker-compose.yml          # PostgreSQL 17 + PostGIS container
├── pyproject.toml              # Dependencies and pytest configuration
├── requirements.txt            # Python dependencies
├── .env.example                # Sample environment variables
└── README.md
```

---

## 3. Quickstart & Local Setup

### 3.1. Prerequisites
- **Python 3.12+**
- **Docker & Docker Compose** (or local PostgreSQL 16/17 with PostGIS enabled)

### 3.2. Setup Virtual Environment & Install Dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3.3. Start PostgreSQL + PostGIS with Docker
```bash
docker compose up -d
```
*Note: PostGIS container initializes mapped to port `5433` with database `hpee`, user `hpee_admin`, password `hpee_dev_password`.*

### 3.4. Run Alembic Database Migrations
```bash
alembic upgrade head
```

### 3.5. Seed Deterministic Development Data
Populates 12 villages, 25 industrial plants, 12 sensor nodes, 7 days of realistic time-series telemetry, 3 pollution episodes, source attributions, and pre-filled GSPCB complaints:
```bash
python -m database.seed.seed_data
```

### 3.6. Run Automated Smoke Tests
```bash
pytest -v tests/
```

---

## 4. Database Connection Parameters

| Parameter | Development Value |
|---|---|
| **Host** | `localhost` |
| **Port** | `5433` |
| **Database** | `hpee` |
| **User** | `hpee_admin` |
| **Password** | `hpee_dev_password` |
| **Connection URL** | `postgresql+psycopg://hpee_admin:hpee_dev_password@localhost:5433/hpee` |

---

## 5. Key Architecture & Schema Rules

1. **Raw vs Derived Separation**: Raw telemetry in `sensor_readings` is append-only and never mutated. ML outputs, Gaussian plume calculations, and source attributions reside strictly in derived tables (`pollution_events`, `event_classifications`, `source_attributions`, `evidence_records`, `evidence_snapshots`).
2. **PostGIS Geography**: Locations use `Geography(Point, 4326)` with GIST spatial indexing. Points are stored in `(longitude, latitude)` format.
3. **UTC TIMESTAMPTZ**: All timestamps are `TIMESTAMPTZ` in UTC. `sensor_readings` distinctly separates `recorded_at` (hardware timestamp) and `received_at` (server ingestion timestamp).
4. **Automated Validation**: Check constraints enforce valid physical bounds:
   - PM2.5 $\ge 0.0$ $\mu\text{g/m}^3$
   - SO2 $\ge 0.0$ $\mu\text{g/m}^3$
   - Relative Humidity $\in [0, 100]\%$
   - Wind Direction $\in [0, 360)^\circ$
   - Model Confidence $\in [0.0, 1.0]$
   - Battery Percent $\in [0, 100]\%$

---

## 6. Full Reset Utility
To completely reset the database, re-run all migrations, load seed data, and execute tests in one command:
```bash
./database/scripts/reset_db.sh
```

---

## 4. Setup & Installation

### Option 1: Docker (Recommended)
1. Run `docker-compose up -d`. This spins up:
   - **PostgreSQL + PostGIS** mapped to port `5433`.
   - **Mosquitto MQTT Broker** mapped to port `1884` (for local hardware testing).
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

### Generating Fake Data (Simulator)

You can run the full engine pipeline simulation (Baseline -> Event Detection -> Source Attribution -> Evidence Fusion):
```bash
python scripts/compute_baseline.py
python simulator/run.py
```

### Hardware Testing (Serial-to-MQTT Bridge)

For testing hardware without Wi-Fi (e.g., standard Arduino boards):
1. Flash `hardware_tests/serial_node/serial_node.ino` to your board.
2. Ensure the Mosquitto broker is running via `docker-compose up -d mosquitto`.
3. Run the python bridge (make sure `pyserial` and `paho-mqtt` are installed from `requirements.txt`):
```bash
python hardware_tests/mqtt_bridge.py --port COM3
```

---

## 5. Development Guidelines

- **Code Style**: Follow the [PEP 8](https://pep8.org/) style guide.
- **Documentation**: Use docstrings and comments to explain complex logic.
- **Testing**: Write unit tests for all functions and classes.
- **Performance**: Optimize queries and algorithms for efficiency.
- **Security**: Validate all inputs and use secure coding practices.

---

## 6. Future Directions

- **Real-time Processing**: Stream data directly into ML models for real-time pollution monitoring.
- **Edge Computing**: Deploy ML models on edge devices for local processing.
- **Integration with IoT Platforms**: Connect with platforms like AWS IoT, Google Cloud IoT, and Azure IoT.
- **User Interface**: Develop a web or mobile interface for real-time monitoring and complaint filing.

---

## 7. Credits

- **Team**: Fifty Shades of Cache
- **Database**: PostgreSQL 17 + PostGIS 3.5
- **ORM**: SQLAlchem
- **Migrations**: Alembic

---

## 8. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 9. Contact

For support or feedback, please contact us at: support@hpee.org
