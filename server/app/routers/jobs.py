from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.user import User
from app.schemas.job import JobListingCreate, JobListingUpdate, JobApplicationCreate
from app.dependencies.auth import get_current_user, require_role
from app.services import job_service

router = APIRouter()


@router.get('')
def list_jobs(
    city: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Public — browse all open job listings."""
    return job_service.get_open_listings(db, city, category_id)


@router.get('/my')
def my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return job_service.get_customer_listings(db, current_user.id)


@router.get('/applied')
def my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    """Provider sees all jobs they've applied to."""
    return job_service.get_provider_applications(db, current_user.id)


@router.get('/{listing_id}')
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    return job_service.get_listing_by_id(db, listing_id)


@router.post('', status_code=201)
def create_listing(
    data: JobListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return job_service.create_job_listing(db, current_user.id, data)


@router.put('/{listing_id}')
def update_listing(
    listing_id: int,
    data: JobListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return job_service.update_listing(db, listing_id, current_user.id, data)


@router.delete('/{listing_id}')
def close_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return job_service.close_listing(db, listing_id, current_user.id)


@router.post('/{listing_id}/apply', status_code=201)
def apply_to_job(
    listing_id: int,
    data: JobApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    return job_service.apply_to_listing(db, listing_id, current_user.id, data)


@router.post('/{listing_id}/award/{application_id}')
def award_job(
    listing_id: int,
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    """Customer awards the job to a specific applicant."""
    return job_service.award_application(db, listing_id, application_id, current_user.id)
