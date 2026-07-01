from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.review import Review
from app.models.booking import Booking
from app.models.provider_profile import ProviderProfile
from app.schemas.review import ReviewCreate


def create_review(db: Session, customer_id: int, data: ReviewCreate) -> Review:
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    if booking.customer_id != customer_id:
        raise HTTPException(status_code=403, detail='You did not make this booking')
    if booking.status != 'completed':
        raise HTTPException(status_code=400, detail='Can only review a completed booking')

    existing = db.query(Review).filter(Review.booking_id == data.booking_id).first()
    if existing:
        raise HTTPException(status_code=400, detail='Review already submitted for this booking')

    review = Review(
        booking_id=data.booking_id,
        customer_id=customer_id,
        provider_id=booking.provider_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Recalculate denormalized average_rating and review_count on provider_profiles.
    _update_provider_rating(db, booking.provider_id)
    return review


def get_provider_reviews(db: Session, provider_id: int) -> list:
    return db.query(Review).filter(Review.provider_id == provider_id).all()


def _update_provider_rating(db: Session, provider_user_id: int) -> None:
    """Recalculate and persist average_rating + review_count after a new review is added."""
    reviews = db.query(Review).filter(Review.provider_id == provider_user_id).all()
    if not reviews:
        return

    avg = sum(r.rating for r in reviews) / len(reviews)
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == provider_user_id).first()
    if profile:
        # Round to 1 decimal (e.g. 4.3) — avoids ugly floats like 4.333333 in the UI
        profile.average_rating = round(avg, 1)
        profile.review_count = len(reviews)
        db.commit()
