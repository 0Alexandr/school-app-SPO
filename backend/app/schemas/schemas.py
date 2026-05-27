from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum
import re

LOGIN_PASSWORD_RE = r"[A-Za-z0-9@._-]+"
LOGIN_PASSWORD_MESSAGE = "Используйте 3-15 символов: английские буквы, цифры и @ . _ -"
FULL_NAME_RE = r"[A-Za-zА-Яа-яЁё\s.-]+"


def normalize_text(value: Optional[str], field_name: str, min_length: int, max_length: int) -> str:
    value = value.strip() if value else ""
    if len(value) < min_length:
        raise ValueError(f"{field_name}: минимум {min_length} символов")
    if len(value) > max_length:
        raise ValueError(f"{field_name}: максимум {max_length} символов")
    return value


def normalize_optional_text(
    value: Optional[str],
    field_name: str,
    min_length: int,
    max_length: int,
) -> Optional[str]:
    if value is None or value.strip() == "":
        return None
    return normalize_text(value, field_name, min_length, max_length)


# ─── Auth ───────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    guest = "guest"
    user = "user"
    admin = "admin"


class LoginRequest(BaseModel):
    login: str = Field(..., min_length=1, max_length=30)
    password: str = Field(..., min_length=1, max_length=30)


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
    login: str = Field(..., min_length=3, max_length=15)
    password: str = Field(..., min_length=3, max_length=15)
    email: Optional[str] = Field(None, max_length=120)
    full_name: Optional[str] = Field(None, max_length=80)
    role: UserRole = UserRole.guest

    @field_validator("login")
    @classmethod
    def validate_login(cls, value: str) -> str:
        value = value.strip()
        if not re.fullmatch(LOGIN_PASSWORD_RE, value):
            raise ValueError(LOGIN_PASSWORD_MESSAGE)
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.fullmatch(LOGIN_PASSWORD_RE, value):
            raise ValueError(LOGIN_PASSWORD_MESSAGE)
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
        value = normalize_optional_text(value, "ФИО", 5, 80)
        if value and not re.fullmatch(FULL_NAME_RE, value):
            raise ValueError("ФИО может содержать буквы, пробел, точку и дефис")
        return value


class UserProfileUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=120)
    full_name: Optional[str] = Field(None, max_length=80)

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
        value = normalize_text(value, "ФИО", 5, 80)
        if not re.fullmatch(FULL_NAME_RE, value):
            raise ValueError("ФИО может содержать буквы, пробел, точку и дефис")
        return value


class PasswordUpdate(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=30)
    new_password: str = Field(..., min_length=3, max_length=15)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.fullmatch(LOGIN_PASSWORD_RE, value):
            raise ValueError(LOGIN_PASSWORD_MESSAGE)
        return value


class UserRoleUpdate(BaseModel):
    role: UserRole


# ─── Subject ─────────────────────────────────────────────────────────────────

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=40)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return normalize_text(value, "Название предмета", 2, 40)


class SubjectCreate(SubjectBase):
    pass


class SubjectOut(SubjectBase):
    id: int

    class Config:
        from_attributes = True


# ─── Teacher ─────────────────────────────────────────────────────────────────

class TeacherBase(BaseModel):
    full_name: str = Field(..., min_length=5, max_length=80)
    room: Optional[str] = Field(None, max_length=12)
    user_id: Optional[int] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = normalize_text(value, "ФИО", 5, 80)
        if not re.fullmatch(FULL_NAME_RE, value):
            raise ValueError("ФИО может содержать буквы, пробел, точку и дефис")
        return value

    @field_validator("room")
    @classmethod
    def validate_room(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_text(value, "Кабинет", 1, 12)


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
    name: str = Field(..., min_length=1, max_length=10)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return normalize_text(value, "Название класса", 1, 10)


class ClassCreate(ClassBase):
    pass


class ClassOut(ClassBase):
    id: int

    class Config:
        from_attributes = True


# ─── Student ─────────────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    full_name: str = Field(..., min_length=5, max_length=80)
    class_id: int
    user_id: Optional[int] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = normalize_text(value, "ФИО", 5, 80)
        if not re.fullmatch(FULL_NAME_RE, value):
            raise ValueError("ФИО может содержать буквы, пробел, точку и дефис")
        return value


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
