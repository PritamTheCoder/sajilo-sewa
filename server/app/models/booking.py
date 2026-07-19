from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey('service_categories.id'), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    time_slot = Column(String(20), nullable=False)   # morning | afternoon | evening
    address = Column(String(300), nullable=False)
    notes = Column(Text)
    status = Column(String(20), default='pending', nullable=False)  # pending|accepted|completed|cancelled
    booking_type = Column(String(20), default='scheduled')         # scheduled | emergency
    cancellation_reason = Column(String(300), nullable=True)
    # 'customer' | 'provider' — the UI needs to name who cancelled.
    cancelled_by = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Booking references users twice (customer_id and provider_id) so each relationship
    # must declare foreign_keys= explicitly to avoid SQLAlchemy AmbiguousForeignKeysError.
    customer = relationship('User', foreign_keys=[customer_id], back_populates='bookings_as_customer')
    provider = relationship('User', foreign_keys=[provider_id], back_populates='bookings_as_provider')
    category = relationship('ServiceCategory', back_populates='bookings')
    review = relationship('Review', back_populates='booking', uselist=False)
