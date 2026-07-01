from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.provider_witness import ProviderWitness
from app.models.provider_profile import ProviderProfile
from app.schemas.witness import WitnessInvite, WitnessVouch, WitnessDecline


def invite_witness(db: Session, provider_user_id: int, data: WitnessInvite) -> ProviderWitness:
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == provider_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail='Provider profile not found. Apply first.')

    existing_count = db.query(ProviderWitness).filter(
        ProviderWitness.provider_profile_id == profile.id,
        ProviderWitness.vouch_status.in_(['pending', 'vouched']),
    ).count()
    if existing_count >= 5:
        raise HTTPException(status_code=400, detail='Maximum 5 witnesses allowed.')

    # Prevent duplicate phone invites for the same provider
    duplicate = db.query(ProviderWitness).filter(
        ProviderWitness.provider_profile_id == profile.id,
        ProviderWitness.witness_phone == data.witness_phone,
        ProviderWitness.vouch_status != 'declined',
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail='A witness with this phone number has already been invited.')

    witness = ProviderWitness(
        provider_profile_id=profile.id,
        witness_name=data.witness_name,
        witness_phone=data.witness_phone,
        witness_email=data.witness_email,
        witness_relationship=data.relationship,
        years_known=data.years_known,
        invitation_token=ProviderWitness.generate_token(),
        invitation_expires_at=ProviderWitness.expiry_date(),
    )
    db.add(witness)
    db.commit()
    db.refresh(witness)
    return witness


def get_provider_witnesses(db: Session, provider_user_id: int) -> list:
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == provider_user_id).first()
    if not profile:
        return []
    return db.query(ProviderWitness).filter(ProviderWitness.provider_profile_id == profile.id).all()


def get_witness_by_token(db: Session, token: str) -> ProviderWitness:
    witness = db.query(ProviderWitness).filter(ProviderWitness.invitation_token == token).first()
    if not witness:
        raise HTTPException(status_code=404, detail='Invalid or expired invitation link.')
    if witness.invitation_expires_at and witness.invitation_expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail='This invitation link has expired.')
    if witness.vouch_status == 'vouched':
        raise HTTPException(status_code=409, detail='You have already vouched for this provider.')
    return witness


def vouch(db: Session, token: str, user_id: int, data: WitnessVouch) -> ProviderWitness:
    witness = get_witness_by_token(db, token)
    witness.vouch_status = 'vouched'
    witness.witness_user_id = user_id
    witness.vouched_at = datetime.utcnow()
    witness.vouch_statement = data.vouch_statement

    db.commit()
    _update_witness_count(db, witness.provider_profile_id)
    db.refresh(witness)
    return witness


def decline(db: Session, token: str, data: WitnessDecline) -> ProviderWitness:
    witness = get_witness_by_token(db, token)
    witness.vouch_status = 'declined'
    witness.declined_reason = data.declined_reason
    db.commit()
    db.refresh(witness)
    return witness


def link_witness_to_user(db: Session, token: str, user_id: int):
    """Called after a witness registers — links their new account to the pending invitation."""
    witness = db.query(ProviderWitness).filter(ProviderWitness.invitation_token == token).first()
    if witness and witness.vouch_status == 'pending' and not witness.witness_user_id:
        witness.witness_user_id = user_id
        db.commit()


def _update_witness_count(db: Session, provider_profile_id: int):
    """Recount confirmed vouches and update provider profile + trust score."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_profile_id).first()
    if not profile:
        return

    count = db.query(ProviderWitness).filter(
        ProviderWitness.provider_profile_id == provider_profile_id,
        ProviderWitness.vouch_status == 'vouched',
    ).count()

    profile.witnesses_confirmed = count

    # Recompute trust score inline (avoids circular import with identity_service)
    from app.models.user_identity import UserIdentity
    identity = db.query(UserIdentity).filter(UserIdentity.user_id == profile.user_id).first()

    score = 0
    if identity:
        if identity.nid_verified:
            score += 35
        if identity.pan_verified:
            score += 20
        if identity.citizenship_verified:
            score += 20

    if count >= 5:
        score += 50
    elif count >= 3:
        score += 30
    elif count >= 1:
        score += 10

    rating = float(profile.average_rating or 0)
    reviews = profile.review_count or 0
    if rating >= 4.5 and reviews >= 10:
        score += 15
    elif rating >= 4.0 and reviews >= 5:
        score += 10

    profile.trust_score = min(score, 100)
    db.commit()
