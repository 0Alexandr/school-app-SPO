from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.models import Class, Student, User
from app.schemas.schemas import ClassCreate, ClassOut, StudentCreate, StudentOut, StudentUpdate
from app.services.auth_service import require_admin, require_viewer

router = APIRouter()


def get_student_or_404(student_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/", response_model=List[StudentOut])
def list_students(db: Session = Depends(get_db), _=Depends(require_viewer)):
    return db.query(Student).all()


@router.get("/classes/all", response_model=List[ClassOut])
def list_classes(db: Session = Depends(get_db), _=Depends(require_viewer)):
    return db.query(Class).order_by(Class.name).all()


@router.post("/classes/", response_model=ClassOut, status_code=201)
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


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), _=Depends(require_viewer)):
    return get_student_or_404(student_id, db)


@router.post("/", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if not db.query(Class).filter(Class.id == data.class_id).first():
        raise HTTPException(status_code=404, detail="Class not found")
    if data.user_id:
        if not db.query(User).filter(User.id == data.user_id).first():
            raise HTTPException(status_code=404, detail="User not found")
        if db.query(Student).filter(Student.user_id == data.user_id).first():
            raise HTTPException(status_code=409, detail="User is already linked to a student")
    student = Student(full_name=data.full_name, class_id=data.class_id, user_id=data.user_id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = get_student_or_404(student_id, db)
    if not db.query(Class).filter(Class.id == data.class_id).first():
        raise HTTPException(status_code=404, detail="Class not found")
    if data.user_id:
        if not db.query(User).filter(User.id == data.user_id).first():
            raise HTTPException(status_code=404, detail="User not found")
        existing_student = db.query(Student).filter(Student.user_id == data.user_id, Student.id != student.id).first()
        if existing_student:
            raise HTTPException(status_code=409, detail="User is already linked to a student")
    student.full_name = data.full_name
    student.class_id = data.class_id
    student.user_id = data.user_id
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = get_student_or_404(student_id, db)
    db.delete(student)
    db.commit()
