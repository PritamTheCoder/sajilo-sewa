"""add reviews.edited_at and provider reply columns

Revision ID: d2b5e8a41c02
Revises: d4d7a0c63e24
Create Date: 2026-08-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2b5e8a41c02'
down_revision: Union[str, None] = 'd4d7a0c63e24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('reviews', sa.Column('edited_at', sa.DateTime(), nullable=True))
    op.add_column('reviews', sa.Column('provider_reply', sa.Text(), nullable=True))
    op.add_column('reviews', sa.Column('provider_reply_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('reviews', 'provider_reply_at')
    op.drop_column('reviews', 'provider_reply')
    op.drop_column('reviews', 'edited_at')
