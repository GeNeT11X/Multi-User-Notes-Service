from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, get_db
from app import models, schemas
from app.auth import get_current_user
from app.routers import auth_router, notes_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Notes API",
    description="Multi-user notes service with sharing and pinning",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(notes_router.router)


# ── GET /search ───────────────────────────────────────────────────────────────

@app.get("/search", response_model=List[schemas.NoteResponse], tags=["Search"])
def search_notes(
    q: str = Query(..., min_length=1, description="Search keyword"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Full-text search across title and content of all notes accessible to the user."""
    keyword = f"%{q}%"
    notes = (
        db.query(models.Note)
        .filter(
            or_(
                models.Note.owner_id == current_user.id,
                models.Note.shared_with.any(models.User.id == current_user.id),
            ),
            or_(
                models.Note.title.ilike(keyword),
                models.Note.content.ilike(keyword),
            ),
        )
        .order_by(models.Note.is_pinned.desc(), models.Note.updated_at.desc())
        .all()
    )
    return notes


# ── GET /about ────────────────────────────────────────────────────────────────

@app.get("/about", tags=["Meta"])
def about():
    return {
        "name": "YOUR_NAME_HERE",  # TODO: replace with your name
        "email": "chemicalliving2005@gmail.com",
        "my features": {
            "Note Pinning": (
                "Users can pin important notes to the top of their list via "
                "POST /notes/{id}/pin (toggles pin state). Pinned notes always "
                "appear first in GET /notes results, ordered before unpinned ones. "
                "This mirrors the core UX of Google Keep / Apple Notes and requires "
                "no extra payload — a single tap/click action."
            ),
            "Full-Text Search": (
                "GET /search?q=keyword searches both title and content of all notes "
                "accessible to the user (owned + shared) using a case-insensitive "
                "LIKE query. Results are pinned-first, then by recency."
            ),
            "Note Pagination": (
                "GET /notes supports ?page (1-based) and ?limit (max 100) query params "
                "so large note collections are fetched efficiently without loading "
                "everything into memory."
            ),
        },
    }
