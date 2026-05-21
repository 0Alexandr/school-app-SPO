from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import Grade, Student, Class, Teacher, Subject, teacher_subject
from app.schemas.schemas import AnalyticsSummary, StudentOut
from app.services.auth_service import require_viewer

router = APIRouter()


@router.get("/", response_model=AnalyticsSummary)
def get_analytics(db: Session = Depends(get_db), _=Depends(require_viewer)):
    stats = db.query(func.avg(Grade.value), func.count(Grade.id)).first()

    average_grade = round(float(stats[0]), 2) if stats[0] else None
    total_grades = stats[1] or 0
    grade_counts = dict(db.query(Grade.value, func.count(Grade.id)).group_by(Grade.value).all())
    grade_distribution = [
        {
            "grade": value,
            "count": grade_counts.get(value, 0),
            "percent": round((grade_counts.get(value, 0) / total_grades) * 100, 1) if total_grades else 0,
        }
        for value in range(2, 6)
    ]

    # Failing students (avg grade < 3)
    failing_subq = (
        db.query(Grade.student_id, func.avg(Grade.value).label("avg"))
        .group_by(Grade.student_id)
        .having(func.avg(Grade.value) < 3)
        .subquery()
    )
    failing_students = (
        db.query(Student)
        .join(failing_subq, Student.id == failing_subq.c.student_id)
        .all()
    )

    # Best and worst class
    class_avg_subq = (
        db.query(
            Student.class_id,
            func.avg(Grade.value).label("avg"),
        )
        .join(Grade, Grade.student_id == Student.id)
        .group_by(Student.class_id)
        .subquery()
    )

    best_class_row = (
        db.query(Class.name, class_avg_subq.c.avg)
        .join(class_avg_subq, Class.id == class_avg_subq.c.class_id)
        .order_by(class_avg_subq.c.avg.desc())
        .first()
    )
    worst_class_row = (
        db.query(Class.name, class_avg_subq.c.avg)
        .join(class_avg_subq, Class.id == class_avg_subq.c.class_id)
        .order_by(class_avg_subq.c.avg.asc())
        .first()
    )

    # Teacher with lowest avg grade (through teacher -> subjects -> grades)
    teacher_avg_subq = (
        db.query(
            Teacher.id,
            Teacher.full_name,
            func.avg(Grade.value).label("avg"),
        )
        .join(teacher_subject, Teacher.id == teacher_subject.c.teacher_id)
        .join(Subject, Subject.id == teacher_subject.c.subject_id)
        .join(Grade, Grade.subject_id == Subject.id)
        .group_by(Teacher.id, Teacher.full_name)
        .order_by(func.avg(Grade.value).asc())
        .first()
    )

    return AnalyticsSummary(
        average_grade=average_grade,
        grade_distribution=grade_distribution,
        failing_students=failing_students,
        best_class=best_class_row[0] if best_class_row else None,
        worst_class=worst_class_row[0] if worst_class_row else None,
        worst_teacher=teacher_avg_subq[1] if teacher_avg_subq else None,
    )
