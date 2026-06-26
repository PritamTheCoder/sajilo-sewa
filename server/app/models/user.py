from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default='customer')  # customer | provider | admin
    phone = Column(String(20))
    city = Column(String(100))
    profile_photo = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One-to-one: a user may have one provider profile
    provider_profile = relationship('ProviderProfile', back_populates='user', uselist=False)

    # One-to-one: identity verification record
    identity = relationship('UserIdentity', foreign_keys='UserIdentity.user_id', back_populates='user', uselist=False)

    # One-to-many: same users table is referenced twice in bookings, so we must
    # use foreign_keys= to tell SQLAlchemy which FK to follow for each relationship.
    bookings_as_customer = relationship(
        'Booking',
        foreign_keys='Booking.customer_id',
        back_populates='customer',
    )
    bookings_as_provider = relationship(
        'Booking',
        foreign_keys='Booking.provider_id',
        back_populates='provider',
    )
