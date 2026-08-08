"""add users.status, admin_audit_logs and provider_profiles.rejection_reason

Revision ID: d1a4f7c30b91
Revises: c7d4e8b21a35
Create Date: 2026-08-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd1a4f7c30b91'
down_revision: Union[str, None] = 'c7d4e8b21a35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default is required: existing rows have no value and the column is NOT NULL.
    op.add_column(
        'users',
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
    )
    op.add_column('users', sa.Column('status_changed_at', sa.DateTime(), nullable=True))

    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('target_type', sa.String(length=30), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_admin_audit_logs_id'), 'admin_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_admin_id'), 'admin_audit_logs', ['admin_id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_created_at'), 'admin_audit_logs', ['created_at'], unique=False)
    op.create_index('ix_audit_target', 'admin_audit_logs', ['target_type', 'target_id'], unique=False)

    op.add_column('provider_profiles', sa.Column('rejection_reason', sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column('provider_profiles', 'rejection_reason')
    op.drop_index('ix_audit_target', table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_created_at'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_admin_id'), table_name='admin_audit_logs')
    op.drop_index(op.f('ix_admin_audit_logs_id'), table_name='admin_audit_logs')
    op.drop_table('admin_audit_logs')
    op.drop_column('users', 'status_changed_at')
    op.drop_column('users', 'status')
