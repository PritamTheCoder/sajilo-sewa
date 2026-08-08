from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

REASONS = ('no_show', 'quality', 'payment', 'conduct', 'other')
RESOLVABLE = ('under_review', 'resolved', 'dismissed')


class DisputeCreate(BaseModel):
    booking_id: int
    reason: str
    description: str

    @field_validator('reason')
    @classmethod
    def reason_must_be_valid(cls, v: str) -> str:
        if v not in REASONS:
            raise ValueError(f"Reason must be one of: {', '.join(REASONS)}")
        return v

    @field_validator('description')
    @classmethod
    def description_min_length(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError('Please describe the problem in at least 10 characters')
        return v.strip()


class DisputeResolve(BaseModel):
    status: str
    resolution: Optional[str] = None

    @field_validator('status')
    @classmethod
    def status_must_be_valid(cls, v: str) -> str:
        if v not in RESOLVABLE:
            raise ValueError(f"Status must be one of: {', '.join(RESOLVABLE)}")
        return v


class DisputeResponse(BaseModel):
    id: int
    booking_id: int
    reported_by: int
    reporter_name: Optional[str] = None
    reporter_role: str
    reason: str
    description: str
    status: str
    resolution: Optional[str] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {'from_attributes': True}
