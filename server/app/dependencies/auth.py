from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token
from jose import JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/auth/login')


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Decode JWT, validate it, and return the authenticated User object."""
    try:
        payload = decode_token(token)
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid token')
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid or expired token')

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    # Rejecting here retires already-issued tokens without a revocation list.
    if user.status != 'active':
        raise HTTPException(status_code=401, detail='Account is not active')
    return user


def require_role(*roles: str):
    """Dependency factory: raises 403 if the current user's role is not in `roles`."""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail='Insufficient permissions')
        return current_user
    return checker
