from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class ProviderApply(BaseModel):
    """Submitted when a registered user applies to become a provider."""
    bio: Optional[str] = None
    services: List[str]
    city: str
    area: str
    hourly_rate: Decimal

    @field_validator('services')
    @classmethod
    def services_not_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError('At least one service must be listed')
        return v

    @field_validator('hourly_rate')
    @classmethod
    def rate_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError('Hourly rate must be greater than zero')
        return v


class ProviderUpdate(BaseModel):
    """All fields optional — provider can update any subset of their profile."""
    bio: Optional[str] = None
    services: Optional[List[str]] = None
    city: Optional[str] = None
    area: Optional[str] = None
    hourly_rate: Optional[Decimal] = None


class ProviderProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: Optional[str]
    services: Optional[List[str]]
    city: Optional[str]
    area: Optional[str]
    hourly_rate: Optional[Decimal]
    profile_photo: Optional[str]
    is_approved: bool
    average_rating: Optional[Decimal]
    review_count: int
    trust_score: int = 0
    witnesses_confirmed: int = 0
    application_status: str = 'draft'
    emergency_available: bool = False
    rejection_reason: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {'from_attributes': True}


class ProviderWithUserResponse(BaseModel):
    """Full provider card: profile data + basic user info (name, phone)."""
    id: int
    user_id: int
    bio: Optional[str]
    services: Optional[List[str]]
    city: Optional[str]
    area: Optional[str]
    hourly_rate: Optional[Decimal]
    profile_photo: Optional[str]
    is_approved: bool
    average_rating: Optional[Decimal]
    review_count: int
    trust_score: int = 0
    witnesses_confirmed: int = 0
    application_status: str = 'draft'
    emergency_available: bool = False

    # Nested user fields (name and phone — phone is revealed after booking is accepted)
    user_name: Optional[str] = None
    user_phone: Optional[str] = None

    model_config = {'from_attributes': True}
