from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.booking import Booking
from app.models.provider_profile import ProviderProfile
from app.schemas.booking import BookingCreate, BookingStatus
from app.services import notification_service


# Valid status transitions by provider
VALID_PROVIDER_TRANSITIONS = {
    BookingStatus.pending: {BookingStatus.accepted, BookingStatus.cancelled},
    BookingStatus.accepted: {BookingStatus.completed, BookingStatus.cancelled},
    BookingStatus.completed: set(),
    BookingStatus.cancelled: set(),
}

# Customer can only cancel their own pending bookings
CUSTOMER_CANCELLABLE = {BookingStatus.pending}

SLOT_LABELS = {
    'morning': 'morning (8 AM – 12 PM)',
    'afternoon': 'afternoon (12 PM – 5 PM)',
    'evening': 'evening (5 PM – 8 PM)',
}


def _enrich(booking: Booking) -> Booking:
    """Attach display fields the response exposes but the table doesn't hold.

    Set as plain attributes so Pydantic's from_attributes picks them up without
    the schema needing to know about SQLAlchemy relationships.
    """
    booking.provider_name = booking.provider.name if booking.provider else None
    booking.customer_name = booking.customer.name if booking.customer else None
    booking.category_name = booking.category.name if booking.category else None
    booking.has_review = booking.review is not None
    return booking


def _base_query(db: Session):
    # Eager-load everything _enrich touches, or N bookings fire 4N queries.
    return db.query(Booking).options(
        joinedload(Booking.provider),
        joinedload(Booking.customer),
        joinedload(Booking.category),
        joinedload(Booking.review),
    )


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

    notification_service.create_notification(
        db,
        user_id=booking.provider_id,
        type='booking_created',
        title='New booking request',
        body=(
            f'{booking.customer.name} requested {booking.category.name} '
            f'on {booking.scheduled_date:%d %b} in the '
            f'{SLOT_LABELS.get(booking.time_slot, booking.time_slot)}.'
        ),
        link='/dashboard/provider',
    )

    return _enrich(booking)


def get_customer_bookings(db: Session, customer_id: int) -> list:
    bookings = (
        _base_query(db)
        .filter(Booking.customer_id == customer_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_enrich(b) for b in bookings]


def get_provider_bookings(db: Session, provider_user_id: int) -> list:
    bookings = (
        _base_query(db)
        .filter(Booking.provider_id == provider_user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_enrich(b) for b in bookings]


def update_booking_status(db: Session, booking_id: int, provider_user_id: int, new_status: BookingStatus) -> Booking:
    booking = _base_query(db).filter(Booking.id == booking_id).first()
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
    if new_status == BookingStatus.cancelled:
        booking.cancelled_by = 'provider'

    provider_name = booking.provider.name if booking.provider else 'Your provider'
    service = booking.category.name if booking.category else 'your service'
    when = f'{booking.scheduled_date:%d %b}'

    messages = {
        BookingStatus.accepted: (
            'booking_accepted',
            'Booking accepted',
            f'{provider_name} accepted your {service} booking for {when}.',
        ),
        BookingStatus.completed: (
            'booking_completed',
            'Booking completed',
            f'Your {service} booking with {provider_name} is marked complete. Leave a review?',
        ),
        BookingStatus.cancelled: (
            'booking_cancelled',
            'Booking cancelled',
            f'{provider_name} cancelled your {service} booking for {when}.',
        ),
    }

    if new_status in messages:
        n_type, title, body = messages[new_status]
        notification_service.create_notification(
            db,
            user_id=booking.customer_id,
            type=n_type,
            title=title,
            body=body,
            link='/dashboard/customer',
            commit=False,
        )

    db.commit()
    db.refresh(booking)
    return _enrich(booking)


def customer_cancel_booking(db: Session, booking_id: int, customer_id: int, reason: str = None) -> Booking:
    booking = _base_query(db).filter(Booking.id == booking_id).first()
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
    booking.cancelled_by = 'customer'
    if reason:
        booking.cancellation_reason = reason

    customer_name = booking.customer.name if booking.customer else 'The customer'
    service = booking.category.name if booking.category else 'a service'
    body = f'{customer_name} cancelled their {service} booking for {booking.scheduled_date:%d %b}.'
    if reason:
        body += f' Reason: {reason}'

    notification_service.create_notification(
        db,
        user_id=booking.provider_id,
        type='booking_cancelled',
        title='Booking cancelled',
        body=body,
        link='/dashboard/provider',
        commit=False,
    )

    db.commit()
    db.refresh(booking)
    return _enrich(booking)
