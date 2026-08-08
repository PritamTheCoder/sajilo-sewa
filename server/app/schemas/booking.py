from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional
from enum import Enum


class TimeSlot(str, Enum):
    morning = 'morning'
    afternoon = 'afternoon'
    evening = 'evening'


class BookingStatus(str, Enum):
    pending = 'pending'
    accepted = 'accepted'
    completed = 'completed'
    cancelled = 'cancelled'


class BookingCreate(BaseModel):
    provider_id: int
    category_id: int
    scheduled_date: date
    time_slot: TimeSlot
    address: str
    notes: Optional[str] = None

    @field_validator('address')
    @classmethod
    def address_min_length(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError('Address must be at least 10 characters')
        return v

    @field_validator('scheduled_date')
    @classmethod
    def date_must_be_today_or_future(cls, v: date) -> date:
        if v < date.today():
            raise ValueError('Scheduled date must be today or in the future')
        return v


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class BookingCancelRequest(BaseModel):
    cancellation_reason: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    customer_id: int
    provider_id: int
    category_id: int
    scheduled_date: date
    time_slot: TimeSlot
    address: str
    status: BookingStatus
    booking_type: Optional[str] = 'scheduled'
    notes: Optional[str]
    cancellation_reason: Optional[str]
    cancelled_by: Optional[str] = None
    created_at: Optional[datetime] = None

    # Denormalised for display, populated by booking_service._enrich().
    provider_name: Optional[str] = None
    customer_name: Optional[str] = None
    category_name: Optional[str] = None

    # Drives the "Leave a review" button.
    has_review: bool = False
    # Drives the "Report a problem" button.
    has_dispute: bool = False

    model_config = {'from_attributes': True}
