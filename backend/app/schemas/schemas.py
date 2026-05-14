from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


# ─── Auth ───────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    guest = "guest"
    user = "user"
    admin = "admin"


class LoginRequest(BaseModel):
    login: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: int
    login: str
    role: UserRole

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    login: str
    password: str
    role: UserRole = UserRole.user


# ─── Subject ─────────────────────────────────────────────────────────────────

class SubjectBase(BaseModel):
    name: str


class SubjectCreate(SubjectBase):
    pass


class SubjectOut(SubjectBase):
    id: int

    class Config:
        from_attributes = True


# ─── Teacher ─────────────────────────────────────────────────────────────────

class TeacherBase(BaseModel):
    full_name: str
    room: Optional[str] = None


class TeacherCreate(TeacherBase):
    subject_ids: List[int] = []


class TeacherUpdate(TeacherBase):
    subject_ids: Optional[List[int]] = None


class TeacherOut(TeacherBase):
    id: int
    subjects: List[SubjectOut] = []

    class Config:
        from_attributes = True


# ─── Class ───────────────────────────────────────────────────────────────────

class ClassBase(BaseModel):
    name: str


class ClassCreate(ClassBase):
    pass


class ClassOut(ClassBase):
    id: int

    class Config:
        from_attributes = True


# ─── Student ─────────────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    full_name: str
    class_id: int


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    pass


class StudentOut(StudentBase):
    id: int
    class_: Optional[ClassOut] = None

    class Config:
        from_attributes = True


# ─── Grade ───────────────────────────────────────────────────────────────────

class GradeBase(BaseModel):
    student_id: int
    subject_id: int
    quarter: int = Field(..., ge=1, le=4)
    value: int = Field(..., ge=2, le=5)


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    value: int = Field(..., ge=2, le=5)
    quarter: Optional[int] = Field(None, ge=1, le=4)


class GradeOut(GradeBase):
    id: int
    subject: Optional[SubjectOut] = None

    class Config:
        from_attributes = True


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    average_grade: Optional[float] = None
    min_grade: Optional[int] = None
    max_grade: Optional[int] = None
    failing_students: List[StudentOut] = []
    best_class: Optional[str] = None
    worst_class: Optional[str] = None
    worst_teacher: Optional[str] = None
