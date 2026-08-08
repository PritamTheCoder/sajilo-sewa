from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.review import Review
from app.models.booking import Booking
from app.models.provider_profile import ProviderProfile
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewReply
from app.services import notification_service, audit_service

EDIT_WINDOW_DAYS = 7


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

    customer_name = booking.customer.name if booking.customer else 'A customer'
    notification_service.create_notification(
        db,
        user_id=booking.provider_id,
        type='review_received',
        title=f'New {data.rating}-star review',
        body=f'{customer_name} reviewed your work.'
        + (f' “{data.comment[:120]}”' if data.comment else ''),
        link='/dashboard/provider',
    )

    return review


def get_provider_reviews(db: Session, provider_id: int) -> list:
    return (
        db.query(Review)
        .options(joinedload(Review.customer))
        .filter(Review.provider_id == provider_id)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .all()
    )


def update_review(db: Session, review_id: int, customer_id: int, data: ReviewUpdate) -> Review:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail='Review not found')
    if review.customer_id != customer_id:
        raise HTTPException(status_code=403, detail='This is not your review')
    if review.provider_reply:
        raise HTTPException(status_code=400, detail='This review cannot be edited after the provider has replied')

    created = review.created_at or datetime.utcnow()
    if datetime.utcnow() - created > timedelta(days=EDIT_WINDOW_DAYS):
        raise HTTPException(
            status_code=400,
            detail=f'Reviews can only be edited within {EDIT_WINDOW_DAYS} days of posting',
        )

    if data.rating is not None:
        review.rating = data.rating
    if data.comment is not None:
        review.comment = data.comment
    review.edited_at = datetime.utcnow()

    db.commit()
    _update_provider_rating(db, review.provider_id)
    db.refresh(review)
    return review


def delete_review(db: Session, review_id: int, current_user: User) -> None:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail='Review not found')

    is_admin = current_user.role == 'admin'
    if review.customer_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail='This is not your review')

    provider_id = review.provider_id
    customer_id = review.customer_id

    if is_admin and review.customer_id != current_user.id:
        audit_service.log(
            db,
            admin_id=current_user.id,
            action='review_deleted',
            target_type='review',
            target_id=review.id,
            commit=False,
        )
        notification_service.create_notification(
            db,
            user_id=customer_id,
            type='review_received',
            title='Your review was removed',
            body='An administrator removed one of your reviews.',
            link='/dashboard/customer',
            commit=False,
        )

    db.delete(review)
    db.commit()
    _update_provider_rating(db, provider_id)


def reply_to_review(db: Session, review_id: int, provider_user_id: int, data: ReviewReply) -> Review:
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail='Review not found')
    # provider_id on a review is a users.id, so this is a direct ownership check.
    if review.provider_id != provider_user_id:
        raise HTTPException(status_code=403, detail='This review is not on your profile')

    review.provider_reply = data.reply
    review.provider_reply_at = datetime.utcnow()

    notification_service.create_notification(
        db,
        user_id=review.customer_id,
        type='review_reply',
        title='A provider replied to your review',
        body=data.reply[:160],
        link=f'/providers/{review.provider_id}',
        commit=False,
    )

    db.commit()
    db.refresh(review)
    return review


def _update_provider_rating(db: Session, provider_user_id: int) -> None:
    """Recalculate and persist average_rating + review_count from the current review set."""
    count, avg = (
        db.query(func.count(Review.id), func.avg(Review.rating))
        .filter(Review.provider_id == provider_user_id)
        .one()
    )

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == provider_user_id).first()
    if profile:
        # Round to 1 decimal (e.g. 4.3) — avoids ugly floats like 4.333333 in the UI
        profile.average_rating = round(float(avg), 1) if count else None
        profile.review_count = count
        db.commit()
