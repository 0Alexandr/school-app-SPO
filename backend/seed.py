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
    admin = User(
        login="admin",
        email="zavuch@school.local",
        full_name="Смирнова Елена Викторовна",
        hashed_password=hash_password("admin123"),
        role="admin",
    )
    teacher1 = User(
        login="teacher1",
        email="ivanov@school.local",
        full_name="Иванов Иван Иванович",
        hashed_password=hash_password("pass123"),
        role="user",
    )
    teacher2 = User(
        login="teacher2",
        email="petrova@school.local",
        full_name="Петрова Мария Сергеевна",
        hashed_password=hash_password("pass123"),
        role="user",
    )
    teacher3 = User(
        login="teacher3",
        email="sidorov@school.local",
        full_name="Сидоров Алексей Николаевич",
        hashed_password=hash_password("pass123"),
        role="user",
    )
    student1 = User(
        login="student1",
        email="alekseev@school.local",
        full_name="Алексеев Дмитрий Павлович",
        hashed_password=hash_password("pass123"),
        role="guest",
    )
    student2 = User(
        login="student2",
        email="borisova@school.local",
        full_name="Борисова Екатерина Игоревна",
        hashed_password=hash_password("pass123"),
        role="guest",
    )
    student3 = User(
        login="student3",
        email="vasilev@school.local",
        full_name="Васильев Сергей Андреевич",
        hashed_password=hash_password("pass123"),
        role="guest",
    )
    student4 = User(
        login="student4",
        email="gavrilova@school.local",
        full_name="Гаврилова Ольга Михайловна",
        hashed_password=hash_password("pass123"),
        role="guest",
    )
    student5 = User(
        login="student5",
        email="denisov@school.local",
        full_name="Денисов Кирилл Александрович",
        hashed_password=hash_password("pass123"),
        role="guest",
    )
    student6 = User(
        login="student6",
        email="ezhova@school.local",
        full_name="Ежова Анастасия Викторовна",
        hashed_password=hash_password("pass123"),
        role="guest",
    )
    db.add_all([
        admin,
        teacher1,
        teacher2,
        teacher3,
        student1,
        student2,
        student3,
        student4,
        student5,
        student6,
    ])

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
    t1 = Teacher(full_name="Иванов Иван Иванович", room="101", user=teacher1, subjects=[math, phys])
    t2 = Teacher(full_name="Петрова Мария Сергеевна", room="205", user=teacher2, subjects=[hist, rus])
    t3 = Teacher(full_name="Сидоров Алексей Николаевич", room="312", user=teacher3, subjects=[math])
    db.add_all([t1, t2, t3])

    # Students
    students_data = [
        ("Алексеев Дмитрий Павлович", cls_9a.id, student1),
        ("Борисова Екатерина Игоревна", cls_9a.id, student2),
        ("Васильев Сергей Андреевич", cls_9b.id, student3),
        ("Гаврилова Ольга Михайловна", cls_9b.id, student4),
        ("Денисов Кирилл Александрович", cls_10a.id, student5),
        ("Ежова Анастасия Викторовна", cls_10a.id, student6),
    ]
    students = [Student(full_name=name, class_id=cid, user=user) for name, cid, user in students_data]
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
    print("   teacher2 / pass123  (role: user)")
    print("   teacher3 / pass123  (role: user)")
    print("   student1..student6 / pass123  (role: guest)")


if __name__ == "__main__":
    seed()
    db.close()
