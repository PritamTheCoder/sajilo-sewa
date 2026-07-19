from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    body: Optional[str]
    link: Optional[str]
    is_read: bool
    created_at: datetime

    model_config = {'from_attributes': True}


class UnreadCountResponse(BaseModel):
    count: int
