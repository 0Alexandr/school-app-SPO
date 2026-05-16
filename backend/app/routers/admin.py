from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.models import Class, Subject, User
from app.schemas.schemas import ClassCreate, ClassOut, SubjectCreate, SubjectOut, UserOut, UserRoleUpdate
from app.services.auth_service import require_admin

router = APIRouter()


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).order_by(User.id).all()


@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    db.commit()
    db.refresh(user)
    return user


@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Subject).order_by(Subject.name).all()


@router.post("/subjects", response_model=SubjectOut, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Subject name is required")
    if db.query(Subject).filter(Subject.name == name).first():
        raise HTTPException(status_code=400, detail="Subject already exists")
    subject = Subject(name=name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/classes", response_model=List[ClassOut])
def list_classes(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Class).order_by(Class.name).all()


@router.post("/classes", response_model=ClassOut, status_code=201)
def create_class(data: ClassCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Class name is required")
    if db.query(Class).filter(Class.name == name).first():
        raise HTTPException(status_code=400, detail="Class already exists")
    class_ = Class(name=name)
    db.add(class_)
    db.commit()
    db.refresh(class_)
    return class_
