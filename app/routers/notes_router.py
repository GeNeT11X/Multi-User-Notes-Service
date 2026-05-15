from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/notes", tags=["Notes"])


def _accessible(db: Session, user: models.User):
    """Base query: notes owned by or shared with the user."""
    return db.query(models.Note).filter(
        or_(
            models.Note.owner_id == user.id,
            models.Note.shared_with.any(models.User.id == user.id),
        )
    )


def _get_owned_or_404(db: Session, note_id: str, user: models.User) -> models.Note:
    note = (
        db.query(models.Note)
        .filter(models.Note.id == note_id, models.Note.owner_id == user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


# ── GET /notes ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[schemas.NoteResponse])
def get_notes(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all notes owned by or shared with the authenticated user.
    Pinned notes always appear first. Supports pagination via ?page and ?limit."""
    offset = (page - 1) * limit
    notes = (
        _accessible(db, current_user)
        .order_by(models.Note.is_pinned.desc(), models.Note.updated_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return notes


# ── GET /notes/search — must come BEFORE /{note_id} ──────────────────────────

@router.get("/search", response_model=List[schemas.NoteResponse])
def search_notes(
    q: str = Query(..., min_length=1, description="Search keyword"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Full-text search across title and content of all accessible notes."""
    keyword = f"%{q}%"
    notes = (
        _accessible(db, current_user)
        .filter(
            or_(
                models.Note.title.ilike(keyword),
                models.Note.content.ilike(keyword),
            )
        )
        .order_by(models.Note.is_pinned.desc(), models.Note.updated_at.desc())
        .all()
    )
    return notes


# ── GET /notes/{id} ───────────────────────────────────────────────────────────

@router.get("/{note_id}", response_model=schemas.NoteResponse)
def get_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = _accessible(db, current_user).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


# ── POST /notes ───────────────────────────────────────────────────────────────

@router.post("", response_model=schemas.NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    body: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = models.Note(title=body.title, content=body.content, owner_id=current_user.id)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


# ── PUT /notes/{id} ───────────────────────────────────────────────────────────

@router.put("/{note_id}", response_model=schemas.NoteResponse)
def update_note(
    note_id: str,
    body: schemas.NoteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = _get_owned_or_404(db, note_id, current_user)

    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content
    if body.is_pinned is not None:
        note.is_pinned = body.is_pinned

    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return note


# ── DELETE /notes/{id} ────────────────────────────────────────────────────────

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = _get_owned_or_404(db, note_id, current_user)
    db.delete(note)
    db.commit()


# ── POST /notes/{id}/share ────────────────────────────────────────────────────

@router.post("/{note_id}/share")
def share_note(
    note_id: str,
    body: schemas.ShareNote,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = _get_owned_or_404(db, note_id, current_user)

    target = db.query(models.User).filter(models.User.email == body.share_with_email).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot share a note with yourself",
        )

    if any(u.id == target.id for u in note.shared_with):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Note already shared with this user",
        )

    note.shared_with.append(target)
    db.commit()
    return {"message": "Note shared successfully"}


# ── POST /notes/{id}/pin — custom feature ─────────────────────────────────────

@router.post("/{note_id}/pin")
def pin_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Toggle the pinned state of a note. Pinned notes appear at the top of GET /notes."""
    note = _get_owned_or_404(db, note_id, current_user)
    note.is_pinned = not note.is_pinned
    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    action = "pinned" if note.is_pinned else "unpinned"
    return {"message": f"Note {action} successfully", "is_pinned": note.is_pinned}
