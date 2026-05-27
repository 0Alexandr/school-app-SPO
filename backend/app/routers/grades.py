from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.models import Grade, Student, Subject, Teacher
from app.schemas.schemas import GradeCreate, GradeUpdate, GradeOut
from app.services.auth_service import require_admin, require_viewer

router = APIRouter()


def teacher_subject_ids(db: Session, user_id: int) -> list[int]:
    teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
    return [subject.id for subject in teacher.subjects] if teacher else []


def ensure_grade_access(db: Session, current_user, subject_id: int):
    if current_user.role == "admin":
        return
    if current_user.role != "user":
        raise HTTPException(status_code=403, detail="Изменять оценки могут только учителя и завуч")
    if subject_id not in teacher_subject_ids(db, current_user.id):
        raise HTTPException(status_code=403, detail="Этот предмет не назначен учителю")


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
    current_user=Depends(require_viewer),
):
    q = db.query(Grade)
    if current_user.role == "user":
        subject_ids = teacher_subject_ids(db, current_user.id)
        if not subject_ids:
            return []
        q = q.filter(Grade.subject_id.in_(subject_ids))
    if student_id:
        q = q.filter(Grade.student_id == student_id)
    if subject_id:
        q = q.filter(Grade.subject_id == subject_id)
    if quarter:
        q = q.filter(Grade.quarter == quarter)
    return q.all()


@router.post("/", response_model=GradeOut, status_code=201)
def create_grade(data: GradeCreate, db: Session = Depends(get_db), current_user=Depends(require_viewer)):
    ensure_grade_access(db, current_user, data.subject_id)
    if not db.query(Student).filter(Student.id == data.student_id).first():
        raise HTTPException(status_code=404, detail="Ученик не найден")
    if not db.query(Subject).filter(Subject.id == data.subject_id).first():
        raise HTTPException(status_code=404, detail="Предмет не найден")
    if find_existing_grade(db, data.student_id, data.subject_id, data.quarter):
        raise HTTPException(
            status_code=409,
            detail="Оценка для этого ученика, предмета и четверти уже существует.",
        )
    grade = Grade(**data.model_dump())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.put("/{grade_id}", response_model=GradeOut)
def update_grade(grade_id: int, data: GradeUpdate, db: Session = Depends(get_db), current_user=Depends(require_viewer)):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    ensure_grade_access(db, current_user, grade.subject_id)
    next_quarter = data.quarter if data.quarter is not None else grade.quarter
    if find_existing_grade(db, grade.student_id, grade.subject_id, next_quarter, exclude_grade_id=grade.id):
        raise HTTPException(
            status_code=409,
            detail="Оценка для этого ученика, предмета и четверти уже существует.",
        )
    grade.value = data.value
    grade.quarter = next_quarter
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=204)
def delete_grade(grade_id: int, db: Session = Depends(get_db), current_user=Depends(require_viewer)):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    ensure_grade_access(db, current_user, grade.subject_id)
    db.delete(grade)
    db.commit()
