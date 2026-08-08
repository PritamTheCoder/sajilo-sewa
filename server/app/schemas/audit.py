from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    admin_id: int
    admin_name: Optional[str] = None
    action: str
    target_type: str
    target_id: int
    reason: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {'from_attributes': True}


class UserStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None
