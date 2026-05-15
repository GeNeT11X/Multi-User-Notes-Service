from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"message": "Email already registered"},
        )

    user = models.User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    return {"message": "User registered successfully"}


@router.post("/login")
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()

    if not user or not verify_password(body.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"message": "Invalid email or password"},
        )

    return {"access_token": create_access_token(user.id)}
