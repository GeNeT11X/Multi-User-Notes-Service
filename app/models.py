from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Table, Boolean, Text
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


def _uuid():
    return str(uuid.uuid4())


# Many-to-many: notes shared with users
note_shares = Table(
    "note_shares",
    Base.metadata,
    Column("note_id", String(36), ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)

    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    shared_notes = relationship("Note", secondary=note_shares, back_populates="shared_with")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    # Custom feature: pin notes to the top
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now)

    owner = relationship("User", back_populates="notes")
    shared_with = relationship("User", secondary=note_shares, back_populates="shared_notes")
