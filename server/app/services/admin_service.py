from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from typing import Optional
from datetime import datetime
from app.models.user import User
from app.services import audit_service

# Admins move users between these two only; 'deactivated' is self-service.
ADMIN_SETTABLE_STATUSES = {'active', 'suspended'}


def list_users(
    db: Session,
    q: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
) -> dict:
    query = db.query(User)

    if q:
        term = f'%{q}%'
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term)))
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)

    total = query.count()
    users = (
        query.order_by(User.created_at.desc(), User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {'items': users, 'total': total, 'page': page, 'page_size': page_size}


def set_user_status(db: Session, user_id: int, status: str, reason: Optional[str], admin: User) -> User:
    if status not in ADMIN_SETTABLE_STATUSES:
        raise HTTPException(status_code=400, detail='Status must be active or suspended')

    if user_id == admin.id:
        raise HTTPException(status_code=400, detail='You cannot change your own account status')

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    if user.role == 'admin':
        raise HTTPException(status_code=403, detail='Admin accounts cannot be suspended')

    user.status = status
    user.status_changed_at = datetime.utcnow()

    audit_service.log(
        db,
        admin_id=admin.id,
        action='user_reactivated' if status == 'active' else 'user_suspended',
        target_type='user',
        target_id=user.id,
        reason=reason,
        commit=False,
    )

    db.commit()
    db.refresh(user)
    return user
