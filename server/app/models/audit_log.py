from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class AdminAuditLog(Base):
    __tablename__ = 'admin_audit_logs'
    __table_args__ = (Index('ix_audit_target', 'target_type', 'target_id'),)

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    # provider_approved | provider_rejected | identity_verified | identity_rejected |
    # user_suspended | user_reactivated | review_deleted | dispute_resolved
    action = Column(String(50), nullable=False)
    target_type = Column(String(30), nullable=False)
    target_id = Column(Integer, nullable=False)
    reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    admin = relationship('User', foreign_keys=[admin_id])

    @property
    def admin_name(self):
        return self.admin.name if self.admin else None
