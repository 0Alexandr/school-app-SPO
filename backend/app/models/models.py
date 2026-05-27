from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint, Table, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

# Many-to-many: Teacher <-> Subject
teacher_subject = Table(
    "teacher_subject",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("teachers.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
)


class UserRole(str, enum.Enum):
    guest = "guest"
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.guest, nullable=False)


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    room = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)

    subjects = relationship("Subject", secondary=teacher_subject, back_populates="teachers")
    user = relationship("User")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    teachers = relationship("Teacher", secondary=teacher_subject, back_populates="subjects")
    grades = relationship("Grade", back_populates="subject")


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g. "9А", "10Б"

    students = relationship("Student", back_populates="class_")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)

    class_ = relationship("Class", back_populates="students")
    grades = relationship("Grade", back_populates="student", cascade="all, delete-orphan")
    user = relationship("User")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    quarter = Column(Integer, nullable=False)  # 1-4
    value = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "quarter", name="unique_student_subject_quarter"),
        CheckConstraint("value >= 2 AND value <= 5", name="grade_value_check"),
        CheckConstraint("quarter >= 1 AND quarter <= 4", name="quarter_check"),
    )

    student = relationship("Student", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")
