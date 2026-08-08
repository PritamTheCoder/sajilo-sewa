from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from typing import Optional
from datetime import datetime
from app.models.dispute import Dispute
from app.models.booking import Booking
from app.models.user import User
from app.schemas.dispute import DisputeCreate, DisputeResolve
from app.services import notification_service, audit_service

# Only a finished booking has an outcome worth disputing.
REPORTABLE_STATUSES = ('completed', 'cancelled')


def create_dispute(db: Session, user: User, data: DisputeCreate) -> Dispute:
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')

    if user.id == booking.customer_id:
        reporter_role = 'customer'
    elif user.id == booking.provider_id:
        reporter_role = 'provider'
    else:
        raise HTTPException(status_code=403, detail='You were not part of this booking')

    if booking.status not in REPORTABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail='You can only report a problem once the booking is completed or cancelled',
        )

    # The other party may still file their own, so this is scoped to one reporter.
    existing = db.query(Dispute).filter(
        Dispute.booking_id == booking.id,
        Dispute.reported_by == user.id,
        Dispute.status.in_(['open', 'under_review']),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail='You already have an open report on this booking')

    dispute = Dispute(
        booking_id=booking.id,
        reported_by=user.id,
        reporter_role=reporter_role,
        reason=data.reason,
        description=data.description,
    )
    db.add(dispute)

    for admin in db.query(User).filter(User.role == 'admin', User.status == 'active').all():
        notification_service.create_notification(
            db,
            user_id=admin.id,
            type='dispute_opened',
            title='New booking dispute',
            body=f'{user.name} reported a problem with booking #{booking.id}.',
            link='/admin',
            commit=False,
        )

    db.commit()
    db.refresh(dispute)
    return dispute


def get_my_disputes(db: Session, user_id: int) -> list:
    return (
        db.query(Dispute)
        .options(joinedload(Dispute.reporter))
        .filter(Dispute.reported_by == user_id)
        .order_by(Dispute.created_at.desc(), Dispute.id.desc())
        .all()
    )


def list_disputes(db: Session, status: Optional[str] = None, page: int = 1, page_size: int = 25) -> dict:
    query = db.query(Dispute).options(joinedload(Dispute.reporter))
    if status:
        query = query.filter(Dispute.status == status)

    total = query.count()
    items = (
        query.order_by(Dispute.created_at.desc(), Dispute.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {'items': items, 'total': total, 'page': page, 'page_size': page_size}


def resolve_dispute(db: Session, dispute_id: int, data: DisputeResolve, admin: User) -> Dispute:
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail='Dispute not found')

    dispute.status = data.status
    dispute.resolution = data.resolution

    if data.status in ('resolved', 'dismissed'):
        dispute.resolved_by = admin.id
        dispute.resolved_at = datetime.utcnow()

        booking = db.query(Booking).filter(Booking.id == dispute.booking_id).first()
        recipients = {dispute.reported_by}
        if booking:
            recipients.update({booking.customer_id, booking.provider_id})

        for user_id in recipients:
            notification_service.create_notification(
                db,
                user_id=user_id,
                type='dispute_resolved',
                title='A booking dispute was closed',
                body=data.resolution or f'Your report on booking #{dispute.booking_id} was reviewed.',
                link='/dashboard/customer',
                commit=False,
            )

        audit_service.log(
            db,
            admin_id=admin.id,
            action='dispute_resolved',
            target_type='dispute',
            target_id=dispute.id,
            reason=data.resolution,
            commit=False,
        )

    db.commit()
    db.refresh(dispute)
    return dispute
