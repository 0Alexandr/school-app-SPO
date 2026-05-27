from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.models import Class, Grade, Student, Subject, Teacher, User
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
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.role = data.role
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    student = db.query(Student).filter(Student.user_id == user.id).first()
    if student:
        db.query(Grade).filter(Grade.student_id == student.id).delete(synchronize_session=False)
        db.delete(student)

    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    if teacher:
        teacher.subjects.clear()
        db.delete(teacher)

    db.delete(user)
    db.commit()


@router.get("/subjects", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Subject).order_by(Subject.name).all()


@router.post("/subjects", response_model=SubjectOut, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Введите название предмета")
    if db.query(Subject).filter(Subject.name == name).first():
        raise HTTPException(status_code=400, detail="Такой предмет уже существует")
    subject = Subject(name=name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, data: SubjectCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    name = data.name.strip()
    if db.query(Subject).filter(Subject.name == name, Subject.id != subject.id).first():
        raise HTTPException(status_code=400, detail="Такой предмет уже существует")
    subject.name = name
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}", status_code=204)
def delete_subject(subject_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    db.query(Grade).filter(Grade.subject_id == subject.id).delete(synchronize_session=False)
    subject.teachers.clear()
    db.delete(subject)
    db.commit()


@router.get("/classes", response_model=List[ClassOut])
def list_classes(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Class).order_by(Class.name).all()


@router.post("/classes", response_model=ClassOut, status_code=201)
def create_class(data: ClassCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Введите название класса")
    if db.query(Class).filter(Class.name == name).first():
        raise HTTPException(status_code=400, detail="Такой класс уже существует")
    class_ = Class(name=name)
    db.add(class_)
    db.commit()
    db.refresh(class_)
    return class_


@router.put("/classes/{class_id}", response_model=ClassOut)
def update_class(class_id: int, data: ClassCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=404, detail="Класс не найден")
    name = data.name.strip()
    if db.query(Class).filter(Class.name == name, Class.id != class_.id).first():
        raise HTTPException(status_code=400, detail="Такой класс уже существует")
    class_.name = name
    db.commit()
    db.refresh(class_)
    return class_


@router.delete("/classes/{class_id}", status_code=204)
def delete_class(class_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=404, detail="Класс не найден")
    students = db.query(Student).filter(Student.class_id == class_.id).all()
    for student in students:
        db.query(Grade).filter(Grade.student_id == student.id).delete(synchronize_session=False)
        db.delete(student)
    db.delete(class_)
    db.commit()
