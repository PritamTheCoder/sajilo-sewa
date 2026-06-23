"""add_job_listings_and_applications

Revision ID: 927ea3e21fe4
Revises: a1ca625058f4
Create Date: 2026-05-18 00:12:17.815485

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '927ea3e21fe4'
down_revision: Union[str, Sequence[str], None] = 'a1ca625058f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('job_listings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('customer_id', sa.Integer(), nullable=False),
    sa.Column('category_id', sa.Integer(), nullable=True),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('city', sa.String(length=100), nullable=False),
    sa.Column('area', sa.String(length=100), nullable=True),
    sa.Column('address', sa.String(length=300), nullable=True),
    sa.Column('scheduled_date', sa.Date(), nullable=True),
    sa.Column('time_slot', sa.String(length=20), nullable=True),
    sa.Column('budget_min', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('budget_max', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('awarded_provider_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('expires_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['awarded_provider_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['category_id'], ['service_categories.id'], ),
    sa.ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_listings_customer_id'), 'job_listings', ['customer_id'], unique=False)
    op.create_index(op.f('ix_job_listings_id'), 'job_listings', ['id'], unique=False)
    op.create_table('job_applications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('job_listing_id', sa.Integer(), nullable=False),
    sa.Column('provider_id', sa.Integer(), nullable=False),
    sa.Column('message', sa.Text(), nullable=True),
    sa.Column('proposed_rate', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['job_listing_id'], ['job_listings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_applications_id'), 'job_applications', ['id'], unique=False)
    op.create_index(op.f('ix_job_applications_job_listing_id'), 'job_applications', ['job_listing_id'], unique=False)
    op.create_index(op.f('ix_job_applications_provider_id'), 'job_applications', ['provider_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_job_applications_provider_id'), table_name='job_applications')
    op.drop_index(op.f('ix_job_applications_job_listing_id'), table_name='job_applications')
    op.drop_index(op.f('ix_job_applications_id'), table_name='job_applications')
    op.drop_table('job_applications')
    op.drop_index(op.f('ix_job_listings_id'), table_name='job_listings')
    op.drop_index(op.f('ix_job_listings_customer_id'), table_name='job_listings')
    op.drop_table('job_listings')
