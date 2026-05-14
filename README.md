# 🏫 Школьная система

Полнофункциональное веб-приложение для управления школой.

## Стек технологий

| Слой | Технологии |
|------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Python 3.12 + FastAPI |
| ORM | SQLAlchemy 2.0 |
| Валидация | Pydantic v2 |
| Аутентификация | JWT (python-jose) |
| Хэширование | bcrypt (passlib) |
| База данных | PostgreSQL 16 |

## Роли пользователей

| Роль | Возможности |
|------|------------|
| `guest` | Только страница входа |
| `user` | Просмотр учителей, учеников, оценок, аналитики |
| `admin` | Полный CRUD по всем сущностям |

## Тестовые учётные записи

После запуска seed:
- `admin` / `admin123` — администратор
- `teacher1` / `pass123` — пользователь

## Запуск

Приложение будет доступно:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 1. База данных
```bash
# Создайте БД PostgreSQL
createdb school_db
```

### 2. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

$env:DATABASE_URL = "postgresql://ВАШ_ПОЛЬЗОВАТЕЛЬ:ВАШ_ПАРОЛЬ@localhost:5432/ВАША_БД"
$env:SECRET_KEY = "любой-секретный-ключ"

python seed.py          # Заполнить тестовыми данными
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## API маршруты

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/login` | Авторизация |
| POST | `/auth/refresh` | Обновление токена |
| GET | `/auth/me` | Текущий пользователь |
| GET/POST | `/teachers/` | Список / создание учителей |
| GET/PUT/DELETE | `/teachers/{id}` | Операции с учителем |
| GET/POST | `/students/` | Список / создание учеников |
| GET/PUT/DELETE | `/students/{id}` | Операции с учеником |
| GET/POST | `/grades/` | Список / создание оценок |
| PUT/DELETE | `/grades/{id}` | Изменение / удаление оценки |
| GET | `/analytics/` | Аналитика успеваемости |

## Аналитика

- Средняя, минимальная и максимальная оценка
- Список неуспевающих учеников (средний балл < 3)
- Лучший и слабейший класс
- Учитель с наименьшим средним баллом

## Структура проекта

```
school-app/
├── backend/
│   ├── app/
│   │   ├── db/          # Подключение к БД
│   │   ├── models/      # SQLAlchemy модели
│   │   ├── schemas/     # Pydantic схемы
│   │   ├── routers/     # API маршруты
│   │   ├── services/    # Бизнес-логика (auth)
│   │   └── main.py
│   ├── seed.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/         # Axios клиент
    │   ├── context/     # AuthContext
    │   ├── components/  # Navbar, ProtectedRoute
    │   └── pages/       # Все страницы
    └── package.json
```
