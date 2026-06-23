import cloudinary
import cloudinary.uploader
import os
from fastapi import HTTPException

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
)

ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png'}
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB


def upload_profile_photo(file_bytes: bytes, content_type: str, provider_id: int) -> str:
    """Validate file type and size, then upload to Cloudinary. Returns the secure URL."""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail='Only JPEG and PNG files are allowed.')
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail='File too large. Maximum size is 2 MB.')

    result = cloudinary.uploader.upload(
        file_bytes,
        folder='sajilo-sewa/profiles',
        public_id=f'provider_{provider_id}',
        overwrite=True,
        transformation=[{'width': 400, 'height': 400, 'crop': 'fill', 'quality': 'auto'}],
    )
    return result['secure_url']


def upload_user_avatar(file_bytes: bytes, content_type: str, user_id: int) -> str:
    """Upload a user profile picture for any role. Returns the secure URL."""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail='Only JPEG and PNG files are allowed.')
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail='File too large. Maximum size is 2 MB.')

    result = cloudinary.uploader.upload(
        file_bytes,
        folder='sajilo-sewa/avatars',
        public_id=f'user_{user_id}',
        overwrite=True,
        transformation=[{'width': 400, 'height': 400, 'crop': 'fill', 'quality': 'auto'}],
    )
    return result['secure_url']


def upload_identity_document(file_bytes: bytes, content_type: str, user_id: int, doc_type: str) -> str:
    """Upload an identity document image. doc_type is e.g. 'nid_front', 'nid_back', 'pan', 'citizenship'."""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail='Only JPEG and PNG files are allowed.')
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail='File too large. Maximum size is 2 MB.')

    result = cloudinary.uploader.upload(
        file_bytes,
        folder='sajilo-sewa/identity-docs',
        public_id=f'user_{user_id}_{doc_type}',
        overwrite=True,
        transformation=[{'quality': 'auto', 'fetch_format': 'auto'}],
    )
    return result['secure_url']
