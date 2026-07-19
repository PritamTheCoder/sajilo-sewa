from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.dependencies.auth import get_current_user
from app.services import notification_service

router = APIRouter()


@router.get('', response_model=List[NotificationResponse])
def my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.get_user_notifications(db, current_user.id)


@router.get('/unread-count', response_model=UnreadCountResponse)
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Polled by the bell every 30s; never returns row data."""
    return {'count': notification_service.get_unread_count(db, current_user.id)}


@router.put('/{notification_id}/read', response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return notification_service.mark_read(db, notification_id, current_user.id)


@router.put('/read-all', response_model=UnreadCountResponse)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification_service.mark_all_read(db, current_user.id)
    return {'count': 0}
