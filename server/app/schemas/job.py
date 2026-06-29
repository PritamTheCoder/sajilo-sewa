from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime


class JobListingCreate(BaseModel):
    title: str
    description: str
    city: str
    area: Optional[str] = None
    address: Optional[str] = None
    category_id: Optional[int] = None
    scheduled_date: Optional[date] = None
    time_slot: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 5:
            raise ValueError('Title must be at least 5 characters')
        return v.strip()

    @field_validator('description')
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError('Description must be at least 10 characters')
        return v.strip()

    @field_validator('scheduled_date')
    @classmethod
    def date_not_past(cls, v):
        if v and v < date.today():
            raise ValueError('Scheduled date cannot be in the past')
        return v


class JobListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    category_id: Optional[int] = None
    scheduled_date: Optional[date] = None
    time_slot: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    status: Optional[str] = None


class JobApplicationCreate(BaseModel):
    message: Optional[str] = None
    proposed_rate: Optional[Decimal] = None


class ApplicationSummary(BaseModel):
    id: int
    provider_id: int
    message: Optional[str]
    proposed_rate: Optional[Decimal]
    status: str
    created_at: datetime
    provider_name: Optional[str] = None
    provider_city: Optional[str] = None
    provider_average_rating: Optional[Decimal] = None
    provider_review_count: Optional[int] = None
    provider_photo: Optional[str] = None

    model_config = {'from_attributes': False}


class JobListingResponse(BaseModel):
    id: int
    customer_id: int
    category_id: Optional[int]
    title: str
    description: str
    city: str
    area: Optional[str]
    address: Optional[str]
    scheduled_date: Optional[date]
    time_slot: Optional[str]
    budget_min: Optional[Decimal]
    budget_max: Optional[Decimal]
    status: str
    awarded_provider_id: Optional[int]
    created_at: datetime
    expires_at: Optional[datetime]
    application_count: int = 0
    customer_name: Optional[str] = None
    category_name: Optional[str] = None

    model_config = {'from_attributes': False}


class JobApplicationResponse(BaseModel):
    id: int
    job_listing_id: int
    provider_id: int
    message: Optional[str]
    proposed_rate: Optional[Decimal]
    status: str
    created_at: datetime
    job_title: Optional[str] = None
    job_city: Optional[str] = None

    model_config = {'from_attributes': False}
