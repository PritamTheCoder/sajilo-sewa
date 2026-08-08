from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.user import User
from app.schemas.user import UserRegister
from app.utils.security import hash_password, verify_password, create_access_token

INACTIVE_MESSAGES = {
    'deactivated': 'This account has been deactivated.',
    'suspended': 'This account has been suspended. Contact support if you believe this is a mistake.',
}


def register_user(db: Session, data: UserRegister) -> dict:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        phone=data.phone,
        city=data.city,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({'sub': str(user.id), 'role': user.role})
    return {'access_token': token, 'token_type': 'bearer'}


def login_user(db: Session, email: str, password: str) -> dict:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid email or password')

    if user.status != 'active':
        raise HTTPException(status_code=403, detail=INACTIVE_MESSAGES.get(user.status, 'This account is not active.'))

    token = create_access_token({'sub': str(user.id), 'role': user.role})
    return {'access_token': token, 'token_type': 'bearer'}


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail='Current password is incorrect')
    if verify_password(new_password, user.password_hash):
        raise HTTPException(status_code=400, detail='New password must be different from the current one')

    user.password_hash = hash_password(new_password)
    db.commit()


def deactivate_account(db: Session, user: User) -> None:
    user.status = 'deactivated'
    user.status_changed_at = datetime.utcnow()
    db.commit()
