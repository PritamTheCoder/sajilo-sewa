from sqlalchemy import Column, Integer, String, Text, Numeric, Date, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class JobListing(Base):
    __tablename__ = 'job_listings'

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey('service_categories.id'), nullable=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    area = Column(String(100))
    address = Column(String(300))
    scheduled_date = Column(Date, nullable=True)
    time_slot = Column(String(20), nullable=True)       # morning | afternoon | evening | flexible
    budget_min = Column(Numeric(10, 2), nullable=True)
    budget_max = Column(Numeric(10, 2), nullable=True)

    # open → awarded → closed | cancelled
    status = Column(String(20), default='open', nullable=False)
    awarded_provider_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    customer = relationship('User', foreign_keys=[customer_id])
    awarded_provider = relationship('User', foreign_keys=[awarded_provider_id])
    category = relationship('ServiceCategory')
    applications = relationship('JobApplication', back_populates='job_listing', cascade='all, delete-orphan')


class JobApplication(Base):
    __tablename__ = 'job_applications'

    id = Column(Integer, primary_key=True, index=True)
    job_listing_id = Column(Integer, ForeignKey('job_listings.id', ondelete='CASCADE'), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    message = Column(Text)
    proposed_rate = Column(Numeric(10, 2), nullable=True)   # provider's quote for this job
    status = Column(String(20), default='pending', nullable=False)  # pending | accepted | rejected

    created_at = Column(DateTime, default=datetime.utcnow)

    job_listing = relationship('JobListing', back_populates='applications')
    provider = relationship('User', foreign_keys=[provider_id])
