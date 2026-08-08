from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Dispute(Base):
    __tablename__ = 'disputes'

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey('bookings.id'), nullable=False, index=True)
    reported_by = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    reporter_role = Column(String(20), nullable=False)  # customer | provider
    # no_show | quality | payment | conduct | other
    reason = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    # open | under_review | resolved | dismissed
    status = Column(String(20), nullable=False, server_default='open', default='open')
    resolution = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Two FKs to users, so each relationship must name the one it follows.
    reporter = relationship('User', foreign_keys=[reported_by])
    resolver = relationship('User', foreign_keys=[resolved_by])
    booking = relationship('Booking', back_populates='disputes')

    @property
    def reporter_name(self):
        return self.reporter.name if self.reporter else None
