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
| `guest` / Ученик | Просмотр информации без редактирования |
| `user` / Учитель | Просмотр своих предметов на странице успеваемости, добавление и изменение оценок только по своим предметам |
| `admin` / Завуч | Полный доступ ко всем страницам, данным и управлению ролями |

## Тестовые учётные записи

После запуска `seed.py` на пустой базе создаются реальные тестовые пользователи:

| Роль | Логин | Пароль | ФИО | Почта |
|------|-------|--------|-----|-------|
| Завуч | `admin` | `admin123` | Смирнова Елена Викторовна | `zavuch@school.local` |
| Учитель | `teacher1` | `pass123` | Иванов Иван Иванович | `ivanov@school.local` |
| Учитель | `teacher2` | `pass123` | Петрова Мария Сергеевна | `petrova@school.local` |
| Учитель | `teacher3` | `pass123` | Сидоров Алексей Николаевич | `sidorov@school.local` |
| Ученик | `student1` | `pass123` | Алексеев Дмитрий Павлович | `alekseev@school.local` |
| Ученик | `student2` | `pass123` | Борисова Екатерина Игоревна | `borisova@school.local` |
| Ученик | `student3` | `pass123` | Васильев Сергей Андреевич | `vasilev@school.local` |
| Ученик | `student4` | `pass123` | Гаврилова Ольга Михайловна | `gavrilova@school.local` |
| Ученик | `student5` | `pass123` | Денисов Кирилл Александрович | `denisov@school.local` |
| Ученик | `student6` | `pass123` | Ежова Анастасия Викторовна | `ezhova@school.local` |

Привязка предметов учителей:
- `teacher1` — Математика, Физика
- `teacher2` — История, Русский язык
- `teacher3` — Математика

Если в таблице пользователей уже есть данные, `seed.py` не перезаписывает базу и выводит `Already seeded, skipping.`

Завуч может оформлять зарегистрированных пользователей как учителей или учеников:
- в профиле пользователь видит свой `ID пользователя`;
- на странице `Учителя` завуч выбирает свободный аккаунт с ролью `user` и задаёт кабинет/предметы;
- на странице `Ученики` завуч выбирает свободный аккаунт с ролью `guest` и задаёт класс.

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

Файл `backend/.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
SECRET_KEY=change_me_to_a_long_random_secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173
```

### 2. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

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
| POST | `/auth/register` | Регистрация ученика |
| POST | `/auth/refresh` | Обновление токена |
| GET | `/auth/me` | Текущий пользователь |
| PUT | `/auth/me` | Обновление ФИО и почты профиля |
| PUT | `/auth/me/password` | Смена пароля |
| GET/POST | `/teachers/` | Список / создание учителей |
| GET/PUT/DELETE | `/teachers/{id}` | Операции с учителем |
| GET/POST | `/students/` | Список / создание учеников |
| GET/PUT/DELETE | `/students/{id}` | Операции с учеником |
| GET/POST | `/grades/` | Список / создание оценок |
| PUT/DELETE | `/grades/{id}` | Изменение / удаление оценки |
| GET | `/analytics/` | Аналитика успеваемости |

## Аналитика

- Процентное соотношение оценок 2, 3, 4 и 5
- Средняя оценка
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
    │   ├── components/  # Navbar, Footer, ProtectedRoute
    │   └── pages/       # Все страницы
    └── package.json
```
