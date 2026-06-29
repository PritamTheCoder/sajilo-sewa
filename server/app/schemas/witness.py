from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class WitnessInvite(BaseModel):
    witness_name: str
    witness_phone: str
    witness_email: Optional[str] = None
    relationship: Optional[str] = None
    years_known: Optional[int] = None


class WitnessVouch(BaseModel):
    vouch_statement: Optional[str] = None


class WitnessDecline(BaseModel):
    declined_reason: Optional[str] = None


class WitnessResponse(BaseModel):
    id: int
    provider_profile_id: int
    witness_user_id: Optional[int]
    witness_name: str
    witness_phone: str
    witness_email: Optional[str]
    relationship: Optional[str]
    years_known: Optional[int]
    vouch_status: str
    vouch_statement: Optional[str]
    declined_reason: Optional[str]
    invited_at: datetime
    invitation_expires_at: Optional[datetime]
    vouched_at: Optional[datetime]
    invitation_token: str

    model_config = {'from_attributes': True}


class WitnessPublicResponse(BaseModel):
    """Returned when a witness visits their vouch link — hides the token."""
    id: int
    provider_profile_id: int
    witness_name: str
    witness_phone: str
    vouch_status: str
    invited_at: datetime
    invitation_expires_at: Optional[datetime]
    provider_name: Optional[str] = None
    provider_city: Optional[str] = None
    provider_services: Optional[list] = None

    model_config = {'from_attributes': True}
