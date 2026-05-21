from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import admin, auth, teachers, students, grades, analytics
from app.db.database import engine, Base
from sqlalchemy import inspect
import os

Base.metadata.create_all(bind=engine)


def ensure_teacher_user_link_column():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "teachers" not in table_names:
        return
    columns = {column["name"] for column in inspector.get_columns("teachers")}
    if "user_id" not in columns:
        with engine.begin() as connection:
            connection.exec_driver_sql("ALTER TABLE teachers ADD COLUMN user_id INTEGER")
    if "students" in table_names:
        student_columns = {column["name"] for column in inspector.get_columns("students")}
        if "user_id" not in student_columns:
            with engine.begin() as connection:
                connection.exec_driver_sql("ALTER TABLE students ADD COLUMN user_id INTEGER")
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    with engine.begin() as connection:
        if "email" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN email VARCHAR")
        if "full_name" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN full_name VARCHAR")
    with engine.begin() as connection:
        connection.exec_driver_sql(
            """
            UPDATE teachers
            SET user_id = (SELECT id FROM users WHERE login = 'teacher1')
            WHERE user_id IS NULL
              AND full_name = 'Иванов Иван Иванович'
              AND EXISTS (SELECT 1 FROM users WHERE login = 'teacher1')
            """
        )


ensure_teacher_user_link_column()

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")

app = FastAPI(title="School API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(grades.router, prefix="/grades", tags=["grades"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/")
def root():
    return {"message": "School API is running"}
