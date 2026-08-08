from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse, PasswordChange
from app.dependencies.auth import get_current_user
from app.services import auth_service
from app.utils.cloudinary_upload import upload_user_avatar

router = APIRouter()


@router.post('/register', response_model=TokenResponse, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(db, data)


@router.post('/login', response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return auth_service.login_user(db, data.email, data.password)


@router.get('/me', response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post('/me/password', status_code=204)
def change_my_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auth_service.change_password(db, current_user, data.current_password, data.new_password)


@router.post('/me/deactivate', status_code=204)
def deactivate_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auth_service.deactivate_account(db, current_user)


@router.post('/me/photo', response_model=UserResponse)
def upload_my_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_bytes = file.file.read()
    photo_url = upload_user_avatar(file_bytes, file.content_type, current_user.id)
    current_user.profile_photo = photo_url
    db.commit()
    db.refresh(current_user)
    return current_user
