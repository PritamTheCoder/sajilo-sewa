from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.booking import Booking
from app.models.provider_profile import ProviderProfile
from app.schemas.booking import BookingCreate, BookingStatus


# Valid status transitions by provider
VALID_PROVIDER_TRANSITIONS = {
    BookingStatus.pending: {BookingStatus.accepted, BookingStatus.cancelled},
    BookingStatus.accepted: {BookingStatus.completed, BookingStatus.cancelled},
    BookingStatus.completed: set(),
    BookingStatus.cancelled: set(),
}

# Customer can only cancel their own pending bookings
CUSTOMER_CANCELLABLE = {BookingStatus.pending}


def create_booking(db: Session, customer_id: int, data: BookingCreate) -> Booking:
    provider = db.query(ProviderProfile).filter(
        ProviderProfile.user_id == data.provider_id
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail='Provider not found')
    if not provider.is_approved:
        raise HTTPException(status_code=400, detail='Provider is not yet approved')

    # Prevent double-booking: provider cannot have two pending/accepted bookings for same date+slot
    conflict = db.query(Booking).filter(
        Booking.provider_id == data.provider_id,
        Booking.scheduled_date == data.scheduled_date,
        Booking.time_slot == data.time_slot,
        Booking.status.in_(['pending', 'accepted']),
    ).first()
    if conflict:
        raise HTTPException(
            status_code=409,
            detail='This provider already has a booking for that date and time slot. Please choose another slot.',
        )

    booking = Booking(
        customer_id=customer_id,
        provider_id=data.provider_id,
        category_id=data.category_id,
        scheduled_date=data.scheduled_date,
        time_slot=data.time_slot,
        address=data.address,
        notes=data.notes,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def get_customer_bookings(db: Session, customer_id: int) -> list:
    return db.query(Booking).filter(Booking.customer_id == customer_id).order_by(Booking.created_at.desc()).all()


def get_provider_bookings(db: Session, provider_user_id: int) -> list:
    return db.query(Booking).filter(Booking.provider_id == provider_user_id).order_by(Booking.created_at.desc()).all()


def update_booking_status(db: Session, booking_id: int, provider_user_id: int, new_status: BookingStatus) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    if booking.provider_id != provider_user_id:
        raise HTTPException(status_code=403, detail='You do not own this booking')

    current = BookingStatus(booking.status)
    if new_status not in VALID_PROVIDER_TRANSITIONS[current]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{current}' to '{new_status}'",
        )

    booking.status = new_status
    db.commit()
    db.refresh(booking)
    return booking


def customer_cancel_booking(db: Session, booking_id: int, customer_id: int, reason: str = None) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    if booking.customer_id != customer_id:
        raise HTTPException(status_code=403, detail='This is not your booking')

    current = BookingStatus(booking.status)
    if current not in CUSTOMER_CANCELLABLE:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a booking that is already '{current}'. Only pending bookings can be cancelled.",
        )

    booking.status = BookingStatus.cancelled
    if reason:
        booking.cancellation_reason = reason
    db.commit()
    db.refresh(booking)
    return booking
