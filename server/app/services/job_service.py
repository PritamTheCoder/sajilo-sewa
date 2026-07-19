from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from datetime import datetime, timedelta
from app.models.job_listing import JobListing, JobApplication
from app.models.provider_profile import ProviderProfile
from app.schemas.job import JobListingCreate, JobListingUpdate, JobApplicationCreate
from app.services import notification_service


def create_job_listing(db: Session, customer_id: int, data: JobListingCreate) -> dict:
    listing = JobListing(
        customer_id=customer_id,
        title=data.title,
        description=data.description,
        city=data.city,
        area=data.area,
        address=data.address,
        category_id=data.category_id,
        scheduled_date=data.scheduled_date,
        time_slot=data.time_slot,
        budget_min=data.budget_min,
        budget_max=data.budget_max,
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing)


def get_open_listings(db: Session, city: Optional[str] = None, category_id: Optional[int] = None) -> list:
    query = db.query(JobListing).filter(JobListing.status == 'open')
    if city:
        query = query.filter(JobListing.city.ilike(f'%{city}%'))
    if category_id:
        query = query.filter(JobListing.category_id == category_id)
    listings = query.order_by(JobListing.created_at.desc()).all()
    return [_serialize_listing(l) for l in listings]


def get_customer_listings(db: Session, customer_id: int) -> list:
    listings = db.query(JobListing).filter(
        JobListing.customer_id == customer_id
    ).order_by(JobListing.created_at.desc()).all()
    return [_serialize_listing(l) for l in listings]


def get_listing_by_id(db: Session, listing_id: int) -> dict:
    listing = db.query(JobListing).filter(JobListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail='Job listing not found')
    return _serialize_listing(listing, include_applications=True)


def update_listing(db: Session, listing_id: int, customer_id: int, data: JobListingUpdate) -> dict:
    listing = db.query(JobListing).filter(JobListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail='Job listing not found')
    if listing.customer_id != customer_id:
        raise HTTPException(status_code=403, detail='Not your listing')

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing)


def close_listing(db: Session, listing_id: int, customer_id: int) -> dict:
    listing = db.query(JobListing).filter(JobListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail='Job listing not found')
    if listing.customer_id != customer_id:
        raise HTTPException(status_code=403, detail='Not your listing')

    listing.status = 'closed'
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing)


def apply_to_listing(db: Session, listing_id: int, provider_user_id: int, data: JobApplicationCreate) -> dict:
    listing = db.query(JobListing).filter(JobListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail='Job listing not found')
    if listing.status != 'open':
        raise HTTPException(status_code=400, detail='This listing is no longer accepting applications')
    if listing.customer_id == provider_user_id:
        raise HTTPException(status_code=400, detail='You cannot apply to your own listing')

    existing = db.query(JobApplication).filter(
        JobApplication.job_listing_id == listing_id,
        JobApplication.provider_id == provider_user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail='You have already applied to this listing')

    application = JobApplication(
        job_listing_id=listing_id,
        provider_id=provider_user_id,
        message=data.message,
        proposed_rate=data.proposed_rate,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    provider_name = application.provider.name if application.provider else 'A provider'
    notification_service.create_notification(
        db,
        user_id=listing.customer_id,
        type='job_application',
        title='New application',
        body=f'{provider_name} applied to "{listing.title}".'
        + (f' Quoted Rs. {int(data.proposed_rate):,}.' if data.proposed_rate else ''),
        link='/dashboard/customer',
    )

    return _serialize_application(application)


def get_provider_applications(db: Session, provider_user_id: int) -> list:
    apps = db.query(JobApplication).filter(
        JobApplication.provider_id == provider_user_id
    ).order_by(JobApplication.created_at.desc()).all()
    return [_serialize_application(a) for a in apps]


def award_application(db: Session, listing_id: int, application_id: int, customer_id: int) -> dict:
    listing = db.query(JobListing).filter(JobListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail='Job listing not found')
    if listing.customer_id != customer_id:
        raise HTTPException(status_code=403, detail='Not your listing')

    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.job_listing_id == listing_id,
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail='Application not found')

    # Accept this one, reject all others
    all_apps = db.query(JobApplication).filter(JobApplication.job_listing_id == listing_id).all()
    for app in all_apps:
        app.status = 'rejected'

    application.status = 'accepted'
    listing.status = 'awarded'
    listing.awarded_provider_id = application.provider_id

    notification_service.create_notification(
        db,
        user_id=application.provider_id,
        type='job_awarded',
        title='You won a job',
        body=f'You were awarded "{listing.title}" in {listing.city}. Contact the customer to arrange it.',
        link='/jobs',
        commit=False,
    )

    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, include_applications=True)


# ── Serializers ───────────────────────────────────────────────────────────────

def _serialize_listing(listing: JobListing, include_applications: bool = False) -> dict:
    data = {
        'id': listing.id,
        'customer_id': listing.customer_id,
        'category_id': listing.category_id,
        'title': listing.title,
        'description': listing.description,
        'city': listing.city,
        'area': listing.area,
        'address': listing.address if listing.status in ('awarded', 'closed') else None,
        'scheduled_date': listing.scheduled_date.isoformat() if listing.scheduled_date else None,
        'time_slot': listing.time_slot,
        'budget_min': float(listing.budget_min) if listing.budget_min else None,
        'budget_max': float(listing.budget_max) if listing.budget_max else None,
        'status': listing.status,
        'awarded_provider_id': listing.awarded_provider_id,
        'created_at': listing.created_at.isoformat(),
        'expires_at': listing.expires_at.isoformat() if listing.expires_at else None,
        'application_count': len(listing.applications),
        'customer_name': listing.customer.name if listing.customer else None,
        'category_name': listing.category.name if listing.category else None,
    }
    if include_applications:
        data['applications'] = [_serialize_application(a) for a in listing.applications]
    return data


def _serialize_application(app: JobApplication) -> dict:
    provider_profile = None
    if app.provider:
        provider_profile = app.provider.provider_profile

    return {
        'id': app.id,
        'job_listing_id': app.job_listing_id,
        'provider_id': app.provider_id,
        'message': app.message,
        'proposed_rate': float(app.proposed_rate) if app.proposed_rate else None,
        'status': app.status,
        'created_at': app.created_at.isoformat(),
        'job_title': app.job_listing.title if app.job_listing else None,
        'job_city': app.job_listing.city if app.job_listing else None,
        'provider_name': app.provider.name if app.provider else None,
        'provider_city': provider_profile.city if provider_profile else None,
        'provider_average_rating': float(provider_profile.average_rating) if provider_profile and provider_profile.average_rating else None,
        'provider_review_count': provider_profile.review_count if provider_profile else 0,
        'provider_photo': provider_profile.profile_photo if provider_profile else None,
    }
