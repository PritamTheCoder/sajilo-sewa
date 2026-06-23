"""add_identity_witness_and_new_profile_fields

Revision ID: a1ca625058f4
Revises: e061d4ba0092
Create Date: 2026-05-18 00:06:08.779307

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1ca625058f4'
down_revision: Union[str, Sequence[str], None] = 'e061d4ba0092'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('user_identities',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('nid_number', sa.String(length=20), nullable=True),
    sa.Column('nid_verified', sa.Boolean(), nullable=True),
    sa.Column('nid_document_front_url', sa.String(length=500), nullable=True),
    sa.Column('nid_document_back_url', sa.String(length=500), nullable=True),
    sa.Column('pan_number', sa.String(length=20), nullable=True),
    sa.Column('pan_verified', sa.Boolean(), nullable=True),
    sa.Column('pan_document_url', sa.String(length=500), nullable=True),
    sa.Column('citizenship_number', sa.String(length=50), nullable=True),
    sa.Column('citizenship_district', sa.String(length=100), nullable=True),
    sa.Column('citizenship_verified', sa.Boolean(), nullable=True),
    sa.Column('citizenship_document_url', sa.String(length=500), nullable=True),
    sa.Column('primary_id_type', sa.String(length=20), nullable=True),
    sa.Column('verification_status', sa.String(length=20), nullable=False),
    sa.Column('rejection_reason', sa.Text(), nullable=True),
    sa.Column('reviewed_by', sa.Integer(), nullable=True),
    sa.Column('reviewed_at', sa.DateTime(), nullable=True),
    sa.Column('submitted_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_identities_id'), 'user_identities', ['id'], unique=False)
    op.create_table('provider_witnesses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('provider_profile_id', sa.Integer(), nullable=False),
    sa.Column('witness_user_id', sa.Integer(), nullable=True),
    sa.Column('witness_name', sa.String(length=100), nullable=False),
    sa.Column('witness_email', sa.String(length=255), nullable=True),
    sa.Column('witness_phone', sa.String(length=20), nullable=False),
    sa.Column('witness_relationship', sa.String(length=100), nullable=True),
    sa.Column('years_known', sa.Integer(), nullable=True),
    sa.Column('vouch_status', sa.String(length=20), nullable=False),
    sa.Column('vouch_statement', sa.Text(), nullable=True),
    sa.Column('declined_reason', sa.Text(), nullable=True),
    sa.Column('invited_at', sa.DateTime(), nullable=True),
    sa.Column('invitation_expires_at', sa.DateTime(), nullable=True),
    sa.Column('vouched_at', sa.DateTime(), nullable=True),
    sa.Column('invitation_token', sa.String(length=64), nullable=False),
    sa.ForeignKeyConstraint(['provider_profile_id'], ['provider_profiles.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['witness_user_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('invitation_token')
    )
    op.create_index(op.f('ix_provider_witnesses_id'), 'provider_witnesses', ['id'], unique=False)
    op.add_column('bookings', sa.Column('booking_type', sa.String(length=20), nullable=True))
    op.add_column('bookings', sa.Column('cancellation_reason', sa.String(length=300), nullable=True))
    op.add_column('provider_profiles', sa.Column('trust_score', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('provider_profiles', sa.Column('witnesses_confirmed', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('provider_profiles', sa.Column('application_status', sa.String(length=30), nullable=False, server_default='awaiting_witnesses'))
    op.add_column('provider_profiles', sa.Column('emergency_available', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('provider_profiles', 'emergency_available')
    op.drop_column('provider_profiles', 'application_status')
    op.drop_column('provider_profiles', 'witnesses_confirmed')
    op.drop_column('provider_profiles', 'trust_score')
    op.drop_column('bookings', 'cancellation_reason')
    op.drop_column('bookings', 'booking_type')
    op.drop_index(op.f('ix_provider_witnesses_id'), table_name='provider_witnesses')
    op.drop_table('provider_witnesses')
    op.drop_index(op.f('ix_user_identities_id'), table_name='user_identities')
    op.drop_table('user_identities')
