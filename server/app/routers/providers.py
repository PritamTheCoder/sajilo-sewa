from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from decimal import Decimal
from app.database import get_db
from app.models.user import User
from app.schemas.provider import ProviderApply, ProviderUpdate, ProviderProfileResponse
from app.schemas.common import Page
from app.dependencies.auth import get_current_user, require_role
from app.utils.cloudinary_upload import upload_profile_photo
from app.services import provider_service

router = APIRouter()


@router.get('', response_model=Page[ProviderProfileResponse])
def list_providers(
    city: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    min_price: Optional[Decimal] = Query(None, ge=0),
    max_price: Optional[Decimal] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    sort: str = Query('recommended'),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=48),
    db: Session = Depends(get_db),
):
    return provider_service.get_approved_providers(
        db, city, category_id, min_price, max_price, min_rating, sort, page, page_size
    )


@router.get('/me', response_model=ProviderProfileResponse)
def get_my_provider_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi import HTTPException
    from app.models.provider_profile import ProviderProfile
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return profile


@router.get('/{provider_id}', response_model=ProviderProfileResponse)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    return provider_service.get_provider_by_id(db, provider_id)


@router.post('/apply', response_model=ProviderProfileResponse, status_code=201)
def apply(
    data: ProviderApply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return provider_service.apply_as_provider(db, current_user.id, data)


@router.put('/profile', response_model=ProviderProfileResponse)
def update_profile(
    data: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    return provider_service.update_provider_profile(db, current_user.id, data)


@router.post('/photo', response_model=ProviderProfileResponse)
def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    file_bytes = file.file.read()
    photo_url = upload_profile_photo(file_bytes, file.content_type, current_user.id)
    return provider_service.update_provider_photo(db, current_user.id, photo_url)
