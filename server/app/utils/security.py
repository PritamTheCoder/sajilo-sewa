import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire_days = int(os.getenv('ACCESS_TOKEN_EXPIRE_DAYS', 7))
    payload['exp'] = datetime.utcnow() + timedelta(days=expire_days)
    return jwt.encode(payload, os.getenv('JWT_SECRET'), algorithm=os.getenv('JWT_ALGORITHM', 'HS256'))


def decode_token(token: str) -> dict:
    return jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=[os.getenv('JWT_ALGORITHM', 'HS256')])
