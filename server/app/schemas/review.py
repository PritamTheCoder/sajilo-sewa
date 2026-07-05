from pydantic import BaseModel, field_validator, computed_field
from typing import Optional
from datetime import datetime
from app.utils.nlp_processor import analyze_sentiment


class ReviewCreate(BaseModel):
    booking_id: int
    rating: int
    comment: Optional[str] = None

    @field_validator('rating')
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError('Rating must be between 1 and 5')
        return v


class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    provider_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    @computed_field
    @property
    def sentiment(self) -> Optional[dict]:
        if not self.comment:
            return None
        result = analyze_sentiment(self.comment)
        return {'label': result.label, 'weight': round(result.weight, 2)}

    model_config = {'from_attributes': True}
