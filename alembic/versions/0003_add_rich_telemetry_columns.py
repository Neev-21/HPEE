"""Add richer telemetry fields for PM10, NOx, NO2, CO, CO2

Revision ID: 0003_add_rich_telemetry_columns
Revises: 0002_add_emission_profile
Create Date: 2026-08-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003_add_rich_telemetry_columns"
down_revision: Union[str, None] = "0002_add_emission_profile"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sensor_readings", sa.Column("pm10", sa.Float(), nullable=True))
    op.add_column("sensor_readings", sa.Column("nox", sa.Float(), nullable=True))
    op.add_column("sensor_readings", sa.Column("no2", sa.Float(), nullable=True))
    op.add_column("sensor_readings", sa.Column("co", sa.Float(), nullable=True))
    op.add_column("sensor_readings", sa.Column("co2", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("sensor_readings", "co2")
    op.drop_column("sensor_readings", "co")
    op.drop_column("sensor_readings", "no2")
    op.drop_column("sensor_readings", "nox")
    op.drop_column("sensor_readings", "pm10")
