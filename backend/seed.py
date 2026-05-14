"""Run once to populate the DB with initial data."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.models.models import User, Teacher, Subject, Student, Class, Grade
from app.services.auth_service import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def seed():
    if db.query(User).first():
        print("Already seeded, skipping.")
        return

    # Users
    admin = User(login="admin", hashed_password=hash_password("admin123"), role="admin")
    user = User(login="teacher1", hashed_password=hash_password("pass123"), role="user")
    db.add_all([admin, user])

    # Subjects
    math = Subject(name="Математика")
    phys = Subject(name="Физика")
    hist = Subject(name="История")
    rus = Subject(name="Русский язык")
    db.add_all([math, phys, hist, rus])

    # Classes
    cls_9a = Class(name="9А")
    cls_9b = Class(name="9Б")
    cls_10a = Class(name="10А")
    db.add_all([cls_9a, cls_9b, cls_10a])

    db.flush()

    # Teachers
    t1 = Teacher(full_name="Иванов Иван Иванович", room="101", subjects=[math, phys])
    t2 = Teacher(full_name="Петрова Мария Сергеевна", room="205", subjects=[hist, rus])
    t3 = Teacher(full_name="Сидоров Алексей Николаевич", room="312", subjects=[math])
    db.add_all([t1, t2, t3])

    # Students
    students_data = [
        ("Алексеев Дмитрий Павлович", cls_9a.id),
        ("Борисова Екатерина Игоревна", cls_9a.id),
        ("Васильев Сергей Андреевич", cls_9b.id),
        ("Гаврилова Ольга Михайловна", cls_9b.id),
        ("Денисов Кирилл Александрович", cls_10a.id),
        ("Ежова Анастасия Викторовна", cls_10a.id),
    ]
    students = [Student(full_name=name, class_id=cid) for name, cid in students_data]
    db.add_all(students)
    db.flush()

    # Grades
    grades_data = [
        (students[0].id, math.id, 1, 5), (students[0].id, math.id, 2, 4),
        (students[0].id, phys.id, 1, 3), (students[0].id, hist.id, 1, 4),
        (students[1].id, math.id, 1, 4), (students[1].id, rus.id, 1, 5),
        (students[2].id, math.id, 1, 2), (students[2].id, phys.id, 1, 2),
        (students[3].id, hist.id, 1, 5), (students[3].id, rus.id, 1, 5),
        (students[4].id, math.id, 1, 4), (students[4].id, phys.id, 1, 4),
        (students[5].id, hist.id, 1, 3), (students[5].id, rus.id, 1, 3),
    ]
    db.add_all([Grade(student_id=s, subject_id=sub, quarter=q, value=v) for s, sub, q, v in grades_data])

    db.commit()
    print("✅ Seed complete!")
    print("   admin / admin123  (role: admin)")
    print("   teacher1 / pass123  (role: user)")


if __name__ == "__main__":
    seed()
    db.close()
