from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, teachers, students, grades, analytics
from app.db.database import engine, Base
import os

Base.metadata.create_all(bind=engine)

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
app.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(grades.router, prefix="/grades", tags=["grades"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/")
def root():
    return {"message": "School API is running"}
