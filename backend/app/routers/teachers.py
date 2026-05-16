from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Teacher, Subject
from app.schemas.schemas import SubjectOut, TeacherCreate, TeacherUpdate, TeacherOut
from app.services.auth_service import require_admin, require_user

router = APIRouter()


def get_teacher_or_404(teacher_id: int, db: Session) -> Teacher:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@router.get("/", response_model=List[TeacherOut])
def list_teachers(db: Session = Depends(get_db), _=Depends(require_user)):
    return db.query(Teacher).all()


@router.get("/subjects/all", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), _=Depends(require_user)):
    return db.query(Subject).order_by(Subject.name).all()


@router.get("/{teacher_id}", response_model=TeacherOut)
def get_teacher(teacher_id: int, db: Session = Depends(get_db), _=Depends(require_user)):
    return get_teacher_or_404(teacher_id, db)


@router.post("/", response_model=TeacherOut, status_code=201)
def create_teacher(data: TeacherCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    subjects = db.query(Subject).filter(Subject.id.in_(data.subject_ids)).all()
    teacher = Teacher(full_name=data.full_name, room=data.room, subjects=subjects)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.put("/{teacher_id}", response_model=TeacherOut)
def update_teacher(teacher_id: int, data: TeacherUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    teacher = get_teacher_or_404(teacher_id, db)
    teacher.full_name = data.full_name
    teacher.room = data.room
    if data.subject_ids is not None:
        teacher.subjects = db.query(Subject).filter(Subject.id.in_(data.subject_ids)).all()
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", status_code=204)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    teacher = get_teacher_or_404(teacher_id, db)
    db.delete(teacher)
    db.commit()
