"""add_emission_profile_and_declared_process_to_industrial_sites

Revision ID: 0002_add_emission_profile
Revises: 0001_initial_schema
Create Date: 2026-08-30 05:08:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0002_add_emission_profile'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns declared_process (Text) and emission_profile (JSONB)
    op.add_column('industrial_sites', sa.Column('declared_process', sa.Text(), nullable=True))
    op.add_column('industrial_sites', sa.Column('emission_profile', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Drop columns
    op.drop_column('industrial_sites', 'emission_profile')
    op.drop_column('industrial_sites', 'declared_process')
