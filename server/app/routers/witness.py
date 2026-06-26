from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.provider_witness import ProviderWitness
from app.schemas.witness import WitnessInvite, WitnessVouch, WitnessDecline, WitnessResponse, WitnessPublicResponse
from app.dependencies.auth import get_current_user, require_role
from app.services import witness_service

router = APIRouter()


@router.post('/invite', response_model=WitnessResponse, status_code=201)
def invite_witness(
    data: WitnessInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    return witness_service.invite_witness(db, current_user.id, data)


@router.get('/my', response_model=List[WitnessResponse])
def my_witnesses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    return witness_service.get_provider_witnesses(db, current_user.id)


@router.get('/vouch/{token}', response_model=WitnessPublicResponse)
def get_vouch_request(token: str, db: Session = Depends(get_db)):
    """Public endpoint — returns the vouch request details for the given invitation token."""
    witness = witness_service.get_witness_by_token(db, token)
    profile = witness.provider_profile
    return WitnessPublicResponse(
        id=witness.id,
        provider_profile_id=witness.provider_profile_id,
        witness_name=witness.witness_name,
        witness_phone=witness.witness_phone,
        vouch_status=witness.vouch_status,
        invited_at=witness.invited_at,
        invitation_expires_at=witness.invitation_expires_at,
        provider_name=profile.user_name if profile else None,
        provider_city=profile.city if profile else None,
        provider_services=profile.services if profile else [],
    )


@router.post('/vouch/{token}', response_model=WitnessResponse)
def submit_vouch(
    token: str,
    data: WitnessVouch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated endpoint — the witness (now a registered user) confirms their vouch."""
    return witness_service.vouch(db, token, current_user.id, data)


@router.post('/decline/{token}', response_model=WitnessResponse)
def submit_decline(token: str, data: WitnessDecline, db: Session = Depends(get_db)):
    """Public endpoint — witness can decline without an account."""
    return witness_service.decline(db, token, data)


@router.post('/link/{token}')
def link_after_register(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Called after a witness registers — links their new user account to the pending invitation."""
    witness_service.link_witness_to_user(db, token, current_user.id)
    return {'message': 'Linked successfully'}
