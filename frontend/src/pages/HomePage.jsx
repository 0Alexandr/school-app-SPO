import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { getRoleLabel } from '../utils/roles'
import { useEffect, useState } from 'react'
import api from '../api/client'

export default function HomePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState([
    { label: 'Учителя', value: 0 },
    { label: 'Ученики', value: 0 },
    { label: 'Классы', value: 0 },
    { label: 'Предметы', value: 0 },
  ])

  useEffect(() => {
    Promise.all([
      api.get('/teachers/'),
      api.get('/students/'),
      api.get('/students/classes/all'),
      api.get('/teachers/subjects/all'),
    ]).then(([teachers, students, classes, subjects]) => {
      setStats([
        { label: 'Учителя', value: teachers.data.length },
        { label: 'Ученики', value: students.data.length },
        { label: 'Классы', value: classes.data.length },
        { label: 'Предметы', value: subjects.data.length },
      ])
    }).catch(() => {
      setStats([])
    })
  }, [])

  const maxStat = Math.max(...stats.map(item => item.value), 1)

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        Добро пожаловать, {user?.login}!
      </h1>
      <p style={{ color: 'var(--text)', marginBottom: 4 }}>
        Единая система для учёта классов, предметов и успеваемости.
      </p>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
        Роль: <span className={`badge badge-${user?.role}`}>{getRoleLabel(user?.role)}</span>
      </p>

      {stats.length > 0 && (
        <section className="compact-stats">
          <h2>Краткая сводка</h2>
          <div className="compact-stat-list">
            {stats.map(item => (
              <div className="compact-stat" key={item.label}>
                <div className="compact-stat-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="compact-progress">
                  <div style={{ width: `${Math.max((item.value / maxStat) * 100, item.value ? 8 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="school-intro">
        <h2>Цифровая образовательная среда школы</h2>
        <div className="intro-section">
          <h3>Для чего нужна система</h3>
          <p>
            Платформа помогает организовать и контролировать учебный процесс в одном месте:
            вести классы, предметы, преподавателей, учеников, оценки и аналитику без лишней разрозненности.
          </p>
        </div>
        <div className="intro-section">
          <h3>Кому подходит</h3>
          <p>
            Система предназначена для завучей, учителей и учеников. Завуч управляет данными
            школы, учителя работают с оценками по своим предметам, а ученики получают доступ
            к учебной информации в понятном формате.
          </p>
        </div>
        <div className="intro-section">
          <h3>Когда появилась</h3>
          <p>
            Цифровая образовательная среда появилась в 2026 году, чтобы сделать управление
            школой более удобным, современным и эффективным для всех участников обучения.
          </p>
        </div>
        <div className="intro-actions">
          <Link to="/teachers">Перейти к учителям</Link>
          <Link to="/students">Перейти к ученикам</Link>
          <Link to="/grades">Открыть успеваемость</Link>
          <Link to="/analytics">Посмотреть аналитику</Link>
        </div>
      </section>
    </div>
  )
}
