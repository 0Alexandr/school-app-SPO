from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Student, Class
from app.schemas.schemas import StudentCreate, StudentUpdate, StudentOut, ClassCreate, ClassOut
from app.services.auth_service import require_admin, require_user

router = APIRouter()


def get_student_or_404(student_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/", response_model=List[StudentOut])
def list_students(db: Session = Depends(get_db), _=Depends(require_user)):
    return db.query(Student).all()


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), _=Depends(require_user)):
    return get_student_or_404(student_id, db)


@router.post("/", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if not db.query(Class).filter(Class.id == data.class_id).first():
        raise HTTPException(status_code=404, detail="Class not found")
    student = Student(full_name=data.full_name, class_id=data.class_id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = get_student_or_404(student_id, db)
    if not db.query(Class).filter(Class.id == data.class_id).first():
        raise HTTPException(status_code=404, detail="Class not found")
    student.full_name = data.full_name
    student.class_id = data.class_id
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = get_student_or_404(student_id, db)
    db.delete(student)
    db.commit()


# ─── Classes sub-resource ────────────────────────────────────────────────────

@router.get("/classes/all", response_model=List[ClassOut])
def list_classes(db: Session = Depends(get_db), _=Depends(require_user)):
    return db.query(Class).all()


@router.post("/classes/", response_model=ClassOut, status_code=201)
def create_class(data: ClassCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    cls = Class(name=data.name)
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls
