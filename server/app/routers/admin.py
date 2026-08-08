from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.provider_profile import ProviderProfile
from app.models.user import User
from app.models.user_identity import UserIdentity
from app.models.provider_witness import ProviderWitness
from app.schemas.provider import ProviderProfileResponse
from app.schemas.identity import IdentityAdminReview, IdentityResponse
from app.schemas.user import UserResponse
from app.schemas.audit import AuditLogResponse, UserStatusUpdate
from app.schemas.common import Page
from app.dependencies.auth import require_role
from app.services import identity_service, provider_service, admin_service, audit_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ApprovalUpdate(BaseModel):
    is_approved: bool
    rejection_reason: Optional[str] = None


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
    profiles = (
        db.query(ProviderProfile)
        .options(joinedload(ProviderProfile.user), joinedload(ProviderProfile.witnesses))
        .order_by(ProviderProfile.created_at.desc())
        .all()
    )
    identities = {
        i.user_id: i
        for i in db.query(UserIdentity).filter(UserIdentity.user_id.in_([p.user_id for p in profiles])).all()
    } if profiles else {}

    result = []
    for p in profiles:
        identity = identities.get(p.user_id)
        witnesses = p.witnesses

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
            'rejection_reason': p.rejection_reason,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'user_name': p.user.name if p.user else None,
            'user_status': p.user.status if p.user else None,
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
    current_user: User = Depends(require_role('admin')),
):
    return provider_service.set_approval(
        db, provider_id, data.is_approved, data.rejection_reason, current_user.id
    )


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


@router.get('/users', response_model=Page[UserResponse])
def list_users(
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    return admin_service.list_users(db, q, role, status, page, page_size)


@router.put('/users/{user_id}/status', response_model=UserResponse)
def set_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('admin')),
):
    return admin_service.set_user_status(db, user_id, data.status, data.reason, current_user)


@router.get('/audit', response_model=Page[AuditLogResponse])
def list_audit_log(
    action: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    return audit_service.get_logs(db, action, target_type, page, page_size)
