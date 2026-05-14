from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import Grade, Student, Subject
from app.schemas.schemas import GradeCreate, GradeUpdate, GradeOut
from app.services.auth_service import require_admin, require_user

router = APIRouter()


def find_existing_grade(
    db: Session,
    student_id: int,
    subject_id: int,
    quarter: int,
    exclude_grade_id: Optional[int] = None,
) -> Optional[Grade]:
    q = db.query(Grade).filter(
        Grade.student_id == student_id,
        Grade.subject_id == subject_id,
        Grade.quarter == quarter,
    )
    if exclude_grade_id is not None:
        q = q.filter(Grade.id != exclude_grade_id)
    return q.first()


@router.get("/", response_model=List[GradeOut])
def list_grades(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    quarter: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(require_user),
):
    q = db.query(Grade)
    if student_id:
        q = q.filter(Grade.student_id == student_id)
    if subject_id:
        q = q.filter(Grade.subject_id == subject_id)
    if quarter:
        q = q.filter(Grade.quarter == quarter)
    return q.all()


@router.post("/", response_model=GradeOut, status_code=201)
def create_grade(data: GradeCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if not db.query(Student).filter(Student.id == data.student_id).first():
        raise HTTPException(status_code=404, detail="Student not found")
    if not db.query(Subject).filter(Subject.id == data.subject_id).first():
        raise HTTPException(status_code=404, detail="Subject not found")
    if find_existing_grade(db, data.student_id, data.subject_id, data.quarter):
        raise HTTPException(
            status_code=409,
            detail="Grade for this student, subject and quarter already exists",
        )
    grade = Grade(**data.model_dump())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.put("/{grade_id}", response_model=GradeOut)
def update_grade(grade_id: int, data: GradeUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    next_quarter = data.quarter if data.quarter is not None else grade.quarter
    if find_existing_grade(db, grade.student_id, grade.subject_id, next_quarter, exclude_grade_id=grade.id):
        raise HTTPException(
            status_code=409,
            detail="Grade for this student, subject and quarter already exists",
        )
    grade.value = data.value
    grade.quarter = next_quarter
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=204)
def delete_grade(grade_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    db.delete(grade)
    db.commit()
