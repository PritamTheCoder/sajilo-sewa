from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.schemas.dispute import DisputeCreate, DisputeResolve, DisputeResponse
from app.schemas.common import Page
from app.dependencies.auth import get_current_user, require_role
from app.services import dispute_service

router = APIRouter()


@router.post('', response_model=DisputeResponse, status_code=201)
def create_dispute(
    data: DisputeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dispute_service.create_dispute(db, current_user, data)


@router.get('/my', response_model=List[DisputeResponse])
def get_my_disputes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dispute_service.get_my_disputes(db, current_user.id)


@router.get('', response_model=Page[DisputeResponse])
def list_disputes(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    return dispute_service.list_disputes(db, status, page, page_size)


@router.put('/{dispute_id}', response_model=DisputeResponse)
def resolve_dispute(
    dispute_id: int,
    data: DisputeResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('admin')),
):
    return dispute_service.resolve_dispute(db, dispute_id, data, current_user)
