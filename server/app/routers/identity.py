from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.identity import IdentitySubmit, IdentityAdminReview, IdentityResponse
from app.dependencies.auth import get_current_user, require_role
from app.utils.cloudinary_upload import upload_identity_document
from app.services import identity_service

router = APIRouter()


@router.get('/me', response_model=IdentityResponse)
def get_my_identity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    identity = identity_service.get_or_create_identity(db, current_user.id)
    return identity


@router.post('/submit', response_model=IdentityResponse)
def submit_identity(
    data: IdentitySubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return identity_service.submit_identity(db, current_user.id, data)


@router.post('/upload/{doc_type}', response_model=IdentityResponse)
def upload_document(
    doc_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload identity document image. doc_type: nid_front | nid_back | pan | citizenship"""
    doc_field_map = {
        'nid_front': 'nid_document_front_url',
        'nid_back': 'nid_document_back_url',
        'pan': 'pan_document_url',
        'citizenship': 'citizenship_document_url',
    }
    if doc_type not in doc_field_map:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f'Invalid doc_type. Use: {list(doc_field_map.keys())}')

    file_bytes = file.file.read()
    url = upload_identity_document(file_bytes, file.content_type, current_user.id, doc_type)
    return identity_service.update_identity_document(db, current_user.id, doc_field_map[doc_type], url)


@router.get('/pending', response_model=List[IdentityResponse])
def list_pending_identities(
    db: Session = Depends(get_db),
    _: User = Depends(require_role('admin')),
):
    return identity_service.get_all_pending_identities(db)


@router.put('/review/{user_id}', response_model=IdentityResponse)
def review_identity(
    user_id: int,
    data: IdentityAdminReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('admin')),
):
    return identity_service.admin_review_identity(db, user_id, data, current_user.id)
