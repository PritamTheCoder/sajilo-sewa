from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.provider_profile import ProviderProfile
from app.models.user import User
from app.models.user_identity import UserIdentity
from app.models.provider_witness import ProviderWitness
from app.schemas.provider import ProviderProfileResponse
from app.schemas.identity import IdentityAdminReview, IdentityResponse
from app.dependencies.auth import require_role
from app.services import identity_service, provider_service, notification_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ApprovalUpdate(BaseModel):
    is_approved: bool
    rejection_reason: Optional[str] = None


class ProviderAdminView(BaseModel):
    """Enriched provider view for admin — includes identity and witness summary."""
    id: int
    user_id: int
    bio: Optional[str]
    services: Optional[List[str]]
    city: Optional[str]
    area: Optional[str]
    hourly_rate: Optional[float]
    profile_photo: Optional[str]
    is_approved: bool
    average_rating: Optional[float]
    review_count: int
    trust_score: int
    witnesses_confirmed: int
    application_status: str
    created_at: str
    user_name: Optional[str]
    user_email: Optional[str]
    user_phone: Optional[str]
    identity_status: Optional[str]
    identity_type: Optional[str]
    witnesses_summary: List[dict]

    model_config = {'from_attributes': False}


@router.get('/analytics')
def admin_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    """Aggregated metrics for the admin analytics dashboard."""
    return provider_service.get_admin_analytics(db)


@router.get('/providers')
def list_applications(
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    """List all provider profiles with identity and witness data for admin review."""
    profiles = db.query(ProviderProfile).order_by(ProviderProfile.created_at.desc()).all()
    result = []
    for p in profiles:
        identity = db.query(UserIdentity).filter(UserIdentity.user_id == p.user_id).first()
        witnesses = db.query(ProviderWitness).filter(ProviderWitness.provider_profile_id == p.id).all()

        result.append({
            'id': p.id,
            'user_id': p.user_id,
            'bio': p.bio,
            'services': p.services,
            'city': p.city,
            'area': p.area,
            'hourly_rate': float(p.hourly_rate) if p.hourly_rate else None,
            'profile_photo': p.profile_photo,
            'is_approved': p.is_approved,
            'average_rating': float(p.average_rating) if p.average_rating else None,
            'review_count': p.review_count,
            'trust_score': p.trust_score,
            'witnesses_confirmed': p.witnesses_confirmed,
            'application_status': p.application_status,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'user_name': p.user.name if p.user else None,
            'user_email': p.user.email if p.user else None,
            'user_phone': p.user.phone if p.user else None,
            'identity_status': identity.verification_status if identity else 'not_submitted',
            'identity_type': identity.primary_id_type if identity else None,
            'identity_nid_front': identity.nid_document_front_url if identity else None,
            'identity_nid_back': identity.nid_document_back_url if identity else None,
            'identity_pan': identity.pan_document_url if identity else None,
            'identity_citizenship': identity.citizenship_document_url if identity else None,
            'witnesses_summary': [
                {
                    'id': w.id,
                    'name': w.witness_name,
                    'phone': w.witness_phone,
                    'relationship': w.witness_relationship,
                    'years_known': w.years_known,
                    'vouch_status': w.vouch_status,
                    'vouched_at': w.vouched_at.isoformat() if w.vouched_at else None,
                    'has_account': w.witness_user_id is not None,
                }
                for w in witnesses
            ],
        })
    return result


@router.put('/providers/{provider_id}', response_model=ProviderProfileResponse)
def approve_or_reject(
    provider_id: int,
    data: ApprovalUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail='Provider profile not found')

    profile.is_approved = data.is_approved
    profile.application_status = 'approved' if data.is_approved else 'rejected'

    if data.is_approved:
        notification_service.create_notification(
            db,
            user_id=profile.user_id,
            type='provider_approved',
            title='Your application was approved',
            body='You can now receive bookings and apply to job listings.',
            link='/dashboard/provider',
            commit=False,
        )
    else:
        notification_service.create_notification(
            db,
            user_id=profile.user_id,
            type='provider_rejected',
            title='Your application was not approved',
            body='Please review your profile details and get in touch if you think this is a mistake.',
            link='/dashboard/provider',
            commit=False,
        )

    db.commit()
    db.refresh(profile)
    return profile


@router.get('/identities/pending', response_model=List[IdentityResponse])
def list_pending_identities(
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    return identity_service.get_all_pending_identities(db)


@router.put('/identities/{user_id}', response_model=IdentityResponse)
def review_identity(
    user_id: int,
    data: IdentityAdminReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('admin')),
):
    return identity_service.admin_review_identity(db, user_id, data, current_user.id)
