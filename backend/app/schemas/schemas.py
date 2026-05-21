from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum
import re


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
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    login: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=5)
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.guest

    @field_validator("login")
    @classmethod
    def validate_login(cls, value: str) -> str:
        value = value.strip()
        if not re.fullmatch(r"[A-Za-zА-Яа-я0-9_.-]+", value):
            raise ValueError("Логин может содержать буквы, цифры, точку, дефис и подчёркивание")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Za-zА-Яа-я]", value):
            raise ValueError("Пароль должен содержать хотя бы одну букву")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value.strip() == "":
            return None
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Введите корректную почту")
        return value

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value else None


class UserProfileUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value.strip() == "":
            return None
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Введите корректную почту")
        return value

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value.strip() == "":
            raise ValueError("Введите ФИО")
        if len(value.strip()) < 5:
            raise ValueError("ФИО должно быть не короче 5 символов")
        return value.strip()


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=5)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Za-zА-Яа-я]", value):
            raise ValueError("Пароль должен содержать хотя бы одну букву")
        return value


class UserRoleUpdate(BaseModel):
    role: UserRole


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
    user_id: Optional[int] = None


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
    user_id: Optional[int] = None


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
    grade_distribution: List[dict] = []
    failing_students: List[StudentOut] = []
    best_class: Optional[str] = None
    worst_class: Optional[str] = None
    worst_teacher: Optional[str] = None
