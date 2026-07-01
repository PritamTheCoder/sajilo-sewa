from sqlalchemy.orm import Session
from sqlalchemy import any_
from fastapi import HTTPException
from typing import Optional
from app.models.provider_profile import ProviderProfile
from app.models.service_category import ServiceCategory
from app.models.user import User
from app.schemas.provider import ProviderApply, ProviderUpdate


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


def get_approved_providers(db: Session, city: Optional[str], category_id: Optional[int]) -> list:
    query = db.query(ProviderProfile).filter(ProviderProfile.is_approved == True)

    if city:
        query = query.filter(ProviderProfile.city.ilike(f'%{city}%'))

    if category_id:
        category = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
        if category:
            # Filter providers whose services array contains the category name (case-insensitive)
            query = query.filter(
                ProviderProfile.services.any(category.name)
            )

    return query.all()


def get_provider_by_id(db: Session, provider_id: int) -> ProviderProfile:
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
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
