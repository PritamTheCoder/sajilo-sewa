from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from typing import Optional
from decimal import Decimal
from app.models.provider_profile import ProviderProfile
from app.models.service_category import ServiceCategory
from app.models.user import User
from app.schemas.provider import ProviderApply, ProviderUpdate
from app.services import notification_service, audit_service


def apply_as_provider(db: Session, user_id: int, data: ProviderApply) -> ProviderProfile:
    existing = db.query(ProviderProfile).filter(ProviderProfile.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail='Provider profile already exists for this user')

    profile = ProviderProfile(
        user_id=user_id,
        bio=data.bio,
        services=data.services,
        city=data.city,
        area=data.area,
        hourly_rate=data.hourly_rate,
        application_status='awaiting_witnesses',
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# Every branch ends on id so paging can't repeat or skip a row on ties.
SORT_ORDERS = {
    'recommended': lambda: [
        ProviderProfile.trust_score.desc(),
        ProviderProfile.average_rating.desc().nullslast(),
        ProviderProfile.review_count.desc(),
        ProviderProfile.id.desc(),
    ],
    'rating': lambda: [
        ProviderProfile.average_rating.desc().nullslast(),
        ProviderProfile.review_count.desc(),
        ProviderProfile.id.desc(),
    ],
    'price_asc': lambda: [ProviderProfile.hourly_rate.asc().nullslast(), ProviderProfile.id.desc()],
    'price_desc': lambda: [ProviderProfile.hourly_rate.desc().nullslast(), ProviderProfile.id.desc()],
    'newest': lambda: [ProviderProfile.created_at.desc(), ProviderProfile.id.desc()],
}


def get_approved_providers(
    db: Session,
    city: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    min_rating: Optional[float] = None,
    sort: str = 'recommended',
    page: int = 1,
    page_size: int = 12,
) -> dict:
    query = (
        db.query(ProviderProfile)
        .join(User, ProviderProfile.user_id == User.id)
        .filter(ProviderProfile.is_approved == True, User.status == 'active')
    )

    if city:
        query = query.filter(ProviderProfile.city.ilike(f'%{city}%'))

    if category_id:
        category = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
        if category:
            # Filter providers whose services array contains the category name (case-insensitive)
            query = query.filter(
                ProviderProfile.services.any(category.name)
            )

    # An unpriced profile is an unknown price, not a match at any price.
    if min_price is not None:
        query = query.filter(ProviderProfile.hourly_rate.isnot(None), ProviderProfile.hourly_rate >= min_price)
    if max_price is not None:
        query = query.filter(ProviderProfile.hourly_rate.isnot(None), ProviderProfile.hourly_rate <= max_price)
    if min_rating is not None:
        query = query.filter(ProviderProfile.average_rating >= min_rating)

    # Count before the joinedload, which would otherwise inflate the row count.
    total = query.count()

    order_by = SORT_ORDERS.get(sort, SORT_ORDERS['recommended'])()
    items = (
        query.options(joinedload(ProviderProfile.user))
        .order_by(*order_by)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {'items': items, 'total': total, 'page': page, 'page_size': page_size}


def get_provider_by_id(db: Session, provider_id: int) -> ProviderProfile:
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail='Provider not found')
    if not profile.user or profile.user.status != 'active':
        raise HTTPException(status_code=404, detail='Provider not found')
    return profile


def update_provider_profile(db: Session, user_id: int, data: ProviderUpdate) -> ProviderProfile:
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail='Provider profile not found')

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


def require_approved_provider(db: Session, user_id: int) -> ProviderProfile:
    """Gate actions only an admin-approved provider may take.

    require_role('provider') only proves the user registered as one — it says
    nothing about whether an admin ever approved them, or has since revoked it.
    """
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=403,
            detail='Complete your provider application before you can do this.',
        )
    if not profile.is_approved:
        if profile.application_status == 'rejected':
            raise HTTPException(
                status_code=403,
                detail=profile.rejection_reason
                or 'Your provider application was not approved, so you cannot take this action.',
            )
        raise HTTPException(
            status_code=403,
            detail='Your provider account is still awaiting admin approval.',
        )
    return profile


def set_approval(
    db: Session,
    provider_id: int,
    is_approved: bool,
    rejection_reason: Optional[str],
    admin_id: int,
) -> ProviderProfile:
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail='Provider profile not found')

    profile.is_approved = is_approved
    profile.application_status = 'approved' if is_approved else 'rejected'
    profile.rejection_reason = None if is_approved else rejection_reason

    if is_approved:
        notification_service.create_notification(
            db,
            user_id=profile.user_id,
            type='provider_approved',
            title='Your application was approved',
            body='You can now receive bookings and apply to job listings.',
            link='/dashboard/provider',
            commit=False,
        )
    else:
        notification_service.create_notification(
            db,
            user_id=profile.user_id,
            type='provider_rejected',
            title='Your application was not approved',
            body=rejection_reason or 'Please review your profile details and get in touch if you think this is a mistake.',
            link='/dashboard/provider',
            commit=False,
        )

    audit_service.log(
        db,
        admin_id=admin_id,
        action='provider_approved' if is_approved else 'provider_rejected',
        target_type='provider_profile',
        target_id=profile.id,
        reason=rejection_reason,
        commit=False,
    )

    db.commit()
    db.refresh(profile)
    return profile


def update_provider_photo(db: Session, user_id: int, photo_url: str) -> ProviderProfile:
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail='Provider profile not found')

    profile.profile_photo = photo_url
    db.commit()
    db.refresh(profile)
    return profile


def get_platform_stats(db: Session) -> dict:
    from app.models.booking import Booking
    from app.models.review import Review
    from sqlalchemy import func

    approved_count = db.query(ProviderProfile).filter(ProviderProfile.is_approved == True).count()
    bookings_count = db.query(Booking).filter(Booking.status == 'completed').count()
    categories_count = db.query(ServiceCategory).filter(ServiceCategory.is_active == True).count()

    avg_rating_row = db.query(func.avg(ProviderProfile.average_rating)).filter(
        ProviderProfile.is_approved == True,
        ProviderProfile.review_count > 0,
    ).scalar()
    avg_rating = round(float(avg_rating_row or 0), 1)

    return {
        'verified_providers': approved_count,
        'bookings_completed': bookings_count,
        'average_rating': avg_rating,
        'active_categories': categories_count,
    }


def get_admin_analytics(db: Session) -> dict:
    """Aggregated metrics for the admin analytics dashboard (Postgres)."""
    from app.models.booking import Booking
    from app.models.review import Review
    from app.models.user import User
    from sqlalchemy import func
    from datetime import datetime

    # Headline totals
    totals = {
        'users': db.query(User).count(),
        'providers': db.query(ProviderProfile).count(),
        'customers': db.query(User).filter(User.role == 'customer').count(),
        'bookings': db.query(Booking).count(),
        'completed': db.query(Booking).filter(Booking.status == 'completed').count(),
        'reviews': db.query(Review).count(),
    }

    # Bookings over the last 6 months — fill gaps so every month renders
    now = datetime.utcnow()
    months, y, m = [], now.year, now.month
    for _ in range(6):
        months.append(f'{y:04d}-{m:02d}')
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    months.reverse()

    month_rows = (
        db.query(func.to_char(Booking.created_at, 'YYYY-MM').label('month'), func.count(Booking.id))
        .group_by('month')
        .all()
    )
    month_counts = {row[0]: row[1] for row in month_rows}
    bookings_over_time = [{'month': mth, 'count': month_counts.get(mth, 0)} for mth in months]

    # Providers by approval state
    approved = db.query(ProviderProfile).filter(ProviderProfile.is_approved == True).count()
    providers_by_status = [
        {'status': 'Approved', 'count': approved},
        {'status': 'Pending', 'count': totals['providers'] - approved},
    ]

    # Bookings by lifecycle status
    status_rows = db.query(Booking.status, func.count(Booking.id)).group_by(Booking.status).all()
    bookings_by_status = [{'status': s, 'count': c} for s, c in status_rows]

    # Top 5 categories by booking volume
    cat_rows = (
        db.query(ServiceCategory.name, func.count(Booking.id).label('cnt'))
        .join(Booking, Booking.category_id == ServiceCategory.id)
        .group_by(ServiceCategory.name)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )
    top_categories = [{'name': n, 'count': c} for n, c in cat_rows]

    return {
        'totals': totals,
        'bookings_over_time': bookings_over_time,
        'providers_by_status': providers_by_status,
        'bookings_by_status': bookings_by_status,
        'top_categories': top_categories,
    }
