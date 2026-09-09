#!/usr/bin/env bash
set -e

# HPEE Database Reset Script
# Drops and recreates the hpee database from scratch, runs migrations, and seeds data.

DB_USER="${POSTGRES_USER:-hpee_admin}"
DB_PASS="${POSTGRES_PASSWORD:-hpee_dev_password}"
DB_HOST="${POSTGRES_SERVER:-localhost}"
DB_PORT="${POSTGRES_PORT:-5433}"
DB_NAME="${POSTGRES_DB:-hpee}"

echo "=================================================="
echo "  HPEE Database Full Reset Utility"
echo "=================================================="
echo "Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Optional: Run docker-compose if not running
if command -v docker >/dev/null 2>&1; then
    if docker compose ps >/dev/null 2>&1; then
        echo "[1/4] Ensuring PostgreSQL container is healthy..."
        docker compose up -d postgres
    fi
fi

echo "[2/4] Resetting schema with Alembic downgrade/upgrade..."
alembic downgrade base || true
alembic upgrade head

echo "[3/4] Running deterministic seed dataset..."
python -m database.seed.seed_data

echo "[4/4] Running schema smoke test..."
pytest tests/

echo "=================================================="
echo "  Database Reset & Verification Complete!"
echo "=================================================="
