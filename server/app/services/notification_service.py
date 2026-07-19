from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.notification import Notification

# Cap what the bell fetches; older rows stay in the table.
MAX_NOTIFICATIONS = 50


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    body: str = None,
    link: str = None,
    commit: bool = True,
) -> Notification:
    """Write a notification for a single user.

    Pass commit=False when the caller is inside a transaction it will commit
    itself, so a notification is never persisted for an event that rolls back.
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        link=link,
    )
    db.add(notification)
    if commit:
        db.commit()
        db.refresh(notification)
    return notification


def get_user_notifications(db: Session, user_id: int) -> list:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(MAX_NOTIFICATIONS)
        .all()
    )


def get_unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )


def mark_read(db: Session, notification_id: int, user_id: int) -> Notification:
    # Scoped by user_id so a guessed primary key can't reach another user's row.
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail='Notification not found')

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: int) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({Notification.is_read: True}, synchronize_session=False)
    )
    db.commit()
    return updated
