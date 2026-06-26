from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.service_category import ServiceCategory
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.dependencies.auth import require_role

router = APIRouter()


@router.get('', response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(ServiceCategory).filter(ServiceCategory.is_active == True).all()


@router.post('', response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role('admin')),
):
    from fastapi import HTTPException
    existing = db.query(ServiceCategory).filter(ServiceCategory.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail='A category with this slug already exists')

    category = ServiceCategory(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put('/{category_id}', response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role('admin')),
):
    from fastapi import HTTPException
    category = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail='Category not found')

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category
