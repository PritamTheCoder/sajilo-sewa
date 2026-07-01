from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.user_identity import UserIdentity
from app.models.provider_profile import ProviderProfile
from app.schemas.identity import IdentitySubmit, IdentityAdminReview


def get_or_create_identity(db: Session, user_id: int) -> UserIdentity:
    identity = db.query(UserIdentity).filter(UserIdentity.user_id == user_id).first()
    if not identity:
        identity = UserIdentity(user_id=user_id)
        db.add(identity)
        db.commit()
        db.refresh(identity)
    return identity


def submit_identity(db: Session, user_id: int, data: IdentitySubmit) -> UserIdentity:
    if data.primary_id_type not in ('nid', 'pan', 'citizenship'):
        raise HTTPException(status_code=400, detail='primary_id_type must be nid, pan, or citizenship')

    identity = get_or_create_identity(db, user_id)

    if data.nid_number:
        identity.nid_number = data.nid_number
    if data.pan_number:
        identity.pan_number = data.pan_number
    if data.citizenship_number:
        identity.citizenship_number = data.citizenship_number
    if data.citizenship_district:
        identity.citizenship_district = data.citizenship_district

    identity.primary_id_type = data.primary_id_type
    identity.verification_status = 'pending'
    identity.submitted_at = datetime.utcnow()

    db.commit()
    db.refresh(identity)
    return identity


def update_identity_document(db: Session, user_id: int, doc_field: str, url: str) -> UserIdentity:
    identity = get_or_create_identity(db, user_id)
    valid_fields = {
        'nid_document_front_url', 'nid_document_back_url',
        'pan_document_url', 'citizenship_document_url',
    }
    if doc_field not in valid_fields:
        raise HTTPException(status_code=400, detail='Invalid document field')
    setattr(identity, doc_field, url)
    db.commit()
    db.refresh(identity)
    return identity


def admin_review_identity(db: Session, user_id: int, data: IdentityAdminReview, reviewer_id: int) -> UserIdentity:
    identity = db.query(UserIdentity).filter(UserIdentity.user_id == user_id).first()
    if not identity:
        raise HTTPException(status_code=404, detail='Identity record not found')

    identity.verification_status = data.verification_status
    identity.reviewed_by = reviewer_id
    identity.reviewed_at = datetime.utcnow()

    if data.nid_verified is not None:
        identity.nid_verified = data.nid_verified
    if data.pan_verified is not None:
        identity.pan_verified = data.pan_verified
    if data.citizenship_verified is not None:
        identity.citizenship_verified = data.citizenship_verified
    if data.rejection_reason:
        identity.rejection_reason = data.rejection_reason

    db.commit()
    db.refresh(identity)

    _recompute_trust_score(db, user_id)
    return identity


def get_identity(db: Session, user_id: int) -> UserIdentity:
    return db.query(UserIdentity).filter(UserIdentity.user_id == user_id).first()


def get_all_pending_identities(db: Session) -> list:
    return db.query(UserIdentity).filter(UserIdentity.verification_status == 'pending').all()


def _recompute_trust_score(db: Session, user_id: int):
    """Recalculates and saves the trust score for the provider associated with this user."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user_id).first()
    if not profile:
        return

    score = 0
    identity = db.query(UserIdentity).filter(UserIdentity.user_id == user_id).first()
    if identity:
        if identity.nid_verified:
            score += 35
        if identity.pan_verified:
            score += 20
        if identity.citizenship_verified:
            score += 20

    confirmed = profile.witnesses_confirmed or 0
    if confirmed >= 5:
        score += 50
    elif confirmed >= 3:
        score += 30
    elif confirmed >= 1:
        score += 10

    rating = float(profile.average_rating or 0)
    reviews = profile.review_count or 0
    if rating >= 4.5 and reviews >= 10:
        score += 15
    elif rating >= 4.0 and reviews >= 5:
        score += 10

    profile.trust_score = min(score, 100)
    db.commit()
