from sqlalchemy.orm import Session
from app.models.audit_log import AdminAuditLog


def log(
    db: Session,
    admin_id: int,
    action: str,
    target_type: str,
    target_id: int,
    reason: str = None,
    commit: bool = True,
) -> AdminAuditLog:
    """Record a moderation action.

    Pass commit=False when the caller commits its own transaction, so an audit
    row is never persisted for an action that rolls back.
    """
    entry = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
    )
    db.add(entry)
    if commit:
        db.commit()
        db.refresh(entry)
    return entry


def get_logs(db: Session, action: str = None, target_type: str = None, page: int = 1, page_size: int = 25) -> dict:
    query = db.query(AdminAuditLog)
    if action:
        query = query.filter(AdminAuditLog.action == action)
    if target_type:
        query = query.filter(AdminAuditLog.target_type == target_type)

    total = query.count()
    rows = (
        query.order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {'items': rows, 'total': total, 'page': page, 'page_size': page_size}
