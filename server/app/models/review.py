from sqlalchemy import Column, Integer, SmallInteger, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Review(Base):
    __tablename__ = 'reviews'

    # DB-level constraint: rating must be 1–5. Pydantic also validates this on the way in.
    __table_args__ = (CheckConstraint('rating BETWEEN 1 AND 5', name='rating_range'),)

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey('bookings.id'), unique=True, nullable=False)  # one review per booking
    customer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    provider_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    rating = Column(SmallInteger, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship('Booking', back_populates='review')
