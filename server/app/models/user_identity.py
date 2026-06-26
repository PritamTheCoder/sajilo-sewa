from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class UserIdentity(Base):
    __tablename__ = 'user_identities'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)

    # National Identity Card
    nid_number = Column(String(20))               
    nid_verified = Column(Boolean, default=False)
    nid_document_front_url = Column(String(500))
    nid_document_back_url = Column(String(500))

    # PAN Card
    pan_number = Column(String(20))
    pan_verified = Column(Boolean, default=False)
    pan_document_url = Column(String(500))

    # Citizenship Certificate
    citizenship_number = Column(String(50))
    citizenship_district = Column(String(100))
    citizenship_verified = Column(Boolean, default=False)
    citizenship_document_url = Column(String(500))

    primary_id_type = Column(String(20))          # 'nid' | 'pan' | 'citizenship'
    verification_status = Column(String(20), default='unverified', nullable=False)
    rejection_reason = Column(Text)
    reviewed_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', foreign_keys=[user_id], back_populates='identity')
