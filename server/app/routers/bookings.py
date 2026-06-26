from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingStatusUpdate, BookingCancelRequest, BookingResponse
from app.dependencies.auth import get_current_user, require_role
from app.services import booking_service

router = APIRouter()


@router.post('', response_model=BookingResponse, status_code=201)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return booking_service.create_booking(db, current_user.id, data)


@router.get('/my', response_model=List[BookingResponse])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    return booking_service.get_customer_bookings(db, current_user.id)


@router.get('/incoming', response_model=List[BookingResponse])
def incoming_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    return booking_service.get_provider_bookings(db, current_user.id)


@router.put('/{booking_id}/status', response_model=BookingResponse)
def update_status(
    booking_id: int,
    data: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('provider')),
):
    return booking_service.update_booking_status(db, booking_id, current_user.id, data.status)


@router.delete('/{booking_id}', response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    data: BookingCancelRequest = BookingCancelRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role('customer')),
):
    """Customers can cancel their own pending bookings."""
    return booking_service.customer_cancel_booking(db, booking_id, current_user.id, data.cancellation_reason)
