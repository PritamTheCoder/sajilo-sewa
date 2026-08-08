"""add disputes table

Revision ID: d3c6f9b52d13
Revises: d2b5e8a41c02
Create Date: 2026-08-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3c6f9b52d13'
down_revision: Union[str, None] = 'd2b5e8a41c02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'disputes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('reported_by', sa.Integer(), nullable=False),
        sa.Column('reporter_role', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='open', nullable=False),
        sa.Column('resolution', sa.Text(), nullable=True),
        sa.Column('resolved_by', sa.Integer(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
        sa.ForeignKeyConstraint(['reported_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_disputes_id'), 'disputes', ['id'], unique=False)
    op.create_index(op.f('ix_disputes_booking_id'), 'disputes', ['booking_id'], unique=False)
    op.create_index(op.f('ix_disputes_reported_by'), 'disputes', ['reported_by'], unique=False)
    op.create_index(op.f('ix_disputes_created_at'), 'disputes', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_disputes_created_at'), table_name='disputes')
    op.drop_index(op.f('ix_disputes_reported_by'), table_name='disputes')
    op.drop_index(op.f('ix_disputes_booking_id'), table_name='disputes')
    op.drop_index(op.f('ix_disputes_id'), table_name='disputes')
    op.drop_table('disputes')
