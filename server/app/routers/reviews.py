from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate, ReviewReply
from app.dependencies.auth import get_current_user, require_role
from app.services import review_service

router = APIRouter()


@router.post('', response_model=ReviewResponse, status_code=201)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return review_service.create_review(db, current_user.id, data)


@router.get('/provider/{provider_id}', response_model=List[ReviewResponse])
def get_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    return review_service.get_provider_reviews(db, provider_id)


@router.put('/{review_id}', response_model=ReviewResponse)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return review_service.update_review(db, review_id, current_user.id, data)


@router.delete('/{review_id}', status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review_service.delete_review(db, review_id, current_user)


@router.post('/{review_id}/reply', response_model=ReviewResponse)
def reply_to_review(
    review_id: int,
    data: ReviewReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    return review_service.reply_to_review(db, review_id, current_user.id, data)
