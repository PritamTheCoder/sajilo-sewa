from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, ARRAY, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class ProviderProfile(Base):
    __tablename__ = 'provider_profiles'

    # Compound index: provider listing filters always filter by city + is_approved together.
    __table_args__ = (Index('ix_provider_city_approved', 'city', 'is_approved'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    bio = Column(Text)
    services = Column(ARRAY(String))        # e.g. ['plumbing', 'electrical']
    city = Column(String(100))
    area = Column(String(100))
    hourly_rate = Column(Numeric(10, 2))
    profile_photo = Column(String(500))     # Cloudinary URL
    is_approved = Column(Boolean, default=False, nullable=False)
    average_rating = Column(Numeric(3, 1), default=0.0)
    review_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Trust & verification system
    trust_score = Column(Integer, default=0)
    witnesses_confirmed = Column(Integer, default=0)
    application_status = Column(String(30), default='draft', nullable=False)
    emergency_available = Column(Boolean, default=False)
    rejection_reason = Column(String(300), nullable=True)

    user = relationship('User', back_populates='provider_profile')
    witnesses = relationship('ProviderWitness', back_populates='provider_profile', cascade='all, delete-orphan')

    @property
    def user_name(self):
        return self.user.name if self.user else None

    @property
    def user_phone(self):
        return self.user.phone if self.user else None
