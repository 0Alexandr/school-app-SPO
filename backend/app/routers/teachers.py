from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Teacher, Subject, User
from app.schemas.schemas import SubjectOut, TeacherCreate, TeacherUpdate, TeacherOut
from app.services.auth_service import require_admin, require_viewer

router = APIRouter()


def get_teacher_or_404(teacher_id: int, db: Session) -> Teacher:
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@router.get("/", response_model=List[TeacherOut])
def list_teachers(db: Session = Depends(get_db), _=Depends(require_viewer)):
    return db.query(Teacher).all()


@router.get("/subjects/all", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), current_user=Depends(require_viewer)):
    if current_user.role == "user":
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if teacher:
            return sorted(teacher.subjects, key=lambda subject: subject.name)
        return []
    return db.query(Subject).order_by(Subject.name).all()


@router.get("/{teacher_id}", response_model=TeacherOut)
def get_teacher(teacher_id: int, db: Session = Depends(get_db), _=Depends(require_viewer)):
    return get_teacher_or_404(teacher_id, db)


@router.post("/", response_model=TeacherOut, status_code=201)
def create_teacher(data: TeacherCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if data.user_id and not db.query(User).filter(User.id == data.user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    if data.user_id and db.query(Teacher).filter(Teacher.user_id == data.user_id).first():
        raise HTTPException(status_code=409, detail="User is already linked to a teacher")
    subjects = db.query(Subject).filter(Subject.id.in_(data.subject_ids)).all()
    teacher = Teacher(full_name=data.full_name, room=data.room, user_id=data.user_id, subjects=subjects)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.put("/{teacher_id}", response_model=TeacherOut)
def update_teacher(teacher_id: int, data: TeacherUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    teacher = get_teacher_or_404(teacher_id, db)
    if data.user_id and not db.query(User).filter(User.id == data.user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    if data.user_id and db.query(Teacher).filter(Teacher.user_id == data.user_id, Teacher.id != teacher.id).first():
        raise HTTPException(status_code=409, detail="User is already linked to a teacher")
    teacher.full_name = data.full_name
    teacher.room = data.room
    teacher.user_id = data.user_id
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
