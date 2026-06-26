from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse
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
