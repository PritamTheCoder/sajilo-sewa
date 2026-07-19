from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    # booking_created | booking_accepted | booking_completed | booking_cancelled |
    # review_received | identity_verified | identity_rejected | provider_approved |
    # job_application | job_awarded
    type = Column(String(30), nullable=False)
    title = Column(String(150), nullable=False)
    body = Column(Text)
    # In-app route to open when the row is tapped, e.g. '/dashboard/customer'.
    link = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', foreign_keys=[user_id])
