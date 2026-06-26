from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timedelta
import secrets


class ProviderWitness(Base):
    __tablename__ = 'provider_witnesses'

    id = Column(Integer, primary_key=True, index=True)
    provider_profile_id = Column(Integer, ForeignKey('provider_profiles.id', ondelete='CASCADE'), nullable=False)

    # witness_user_id is NULL until the witness registers on the platform
    witness_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    witness_name = Column(String(100), nullable=False)
    witness_email = Column(String(255), nullable=True)
    witness_phone = Column(String(20), nullable=False)
    witness_relationship = Column(String(100))      # "neighbor", "previous employer", etc.
    years_known = Column(Integer)

    vouch_status = Column(String(20), default='pending', nullable=False)
    vouch_statement = Column(Text)
    declined_reason = Column(Text)

    invited_at = Column(DateTime, default=datetime.utcnow)
    invitation_expires_at = Column(DateTime)
    vouched_at = Column(DateTime, nullable=True)

    # Unique token sent via SMS/email; witness uses this to reach the vouch page
    invitation_token = Column(String(64), unique=True, nullable=False)

    provider_profile = relationship('ProviderProfile', back_populates='witnesses')
    witness_user = relationship('User', foreign_keys=[witness_user_id])

    @property
    def relationship(self):
        return self.witness_relationship

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def expiry_date() -> datetime:
        return datetime.utcnow() + timedelta(days=7)
