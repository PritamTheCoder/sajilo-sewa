"""add provider browse index on (is_approved, average_rating)

Revision ID: d4d7a0c63e24
Revises: d1a4f7c30b91
Create Date: 2026-08-08

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd4d7a0c63e24'
down_revision: Union[str, None] = 'd1a4f7c30b91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'ix_provider_approved_rating',
        'provider_profiles',
        ['is_approved', 'average_rating'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_provider_approved_rating', table_name='provider_profiles')
