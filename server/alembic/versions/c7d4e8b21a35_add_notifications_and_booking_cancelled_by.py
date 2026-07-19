"""add notifications table and bookings.cancelled_by

Revision ID: c7d4e8b21a35
Revises: b3f2a1c9d847
Create Date: 2026-07-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c7d4e8b21a35'
down_revision: Union[str, None] = 'b3f2a1c9d847'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=30), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('link', sa.String(length=200), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    # Serves the unread-count poll.
    op.create_index(
        'ix_notifications_user_unread',
        'notifications',
        ['user_id', 'is_read'],
        unique=False,
    )

    op.add_column('bookings', sa.Column('cancelled_by', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('bookings', 'cancelled_by')
    op.drop_index('ix_notifications_user_unread', table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
