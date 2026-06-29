from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IdentitySubmit(BaseModel):
    primary_id_type: str                    # 'nid' | 'pan' | 'citizenship'
    nid_number: Optional[str] = None
    pan_number: Optional[str] = None
    citizenship_number: Optional[str] = None
    citizenship_district: Optional[str] = None


class IdentityAdminReview(BaseModel):
    verification_status: str               # 'verified' | 'rejected'
    nid_verified: Optional[bool] = None
    pan_verified: Optional[bool] = None
    citizenship_verified: Optional[bool] = None
    rejection_reason: Optional[str] = None


class IdentityResponse(BaseModel):
    id: int
    user_id: int
    primary_id_type: Optional[str]
    nid_number: Optional[str]
    nid_verified: bool
    nid_document_front_url: Optional[str]
    nid_document_back_url: Optional[str]
    pan_number: Optional[str]
    pan_verified: bool
    pan_document_url: Optional[str]
    citizenship_number: Optional[str]
    citizenship_district: Optional[str]
    citizenship_verified: bool
    citizenship_document_url: Optional[str]
    verification_status: str
    rejection_reason: Optional[str]
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    created_at: datetime

    model_config = {'from_attributes': True}
