"""add_profile_photo_to_users

Revision ID: b3f2a1c9d847
Revises: 927ea3e21fe4
Create Date: 2026-06-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3f2a1c9d847'
down_revision: Union[str, None] = '927ea3e21fe4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('profile_photo', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'profile_photo')
