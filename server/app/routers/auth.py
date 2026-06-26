from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
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
