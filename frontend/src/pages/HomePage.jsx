import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const cards = [
  { to: '/teachers', icon: '👨‍🏫', title: 'Учителя', desc: 'Список преподавателей и их предметы' },
  { to: '/students', icon: '🎓', title: 'Ученики', desc: 'Список учеников по классам' },
  { to: '/grades', icon: '📊', title: 'Успеваемость', desc: 'Оценки учеников по предметам' },
  { to: '/analytics', icon: '📈', title: 'Аналитика', desc: 'Статистика и отчёты' },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        Добро пожаловать, {user?.login}!
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Роль: <span className={`badge badge-${user?.role}`}>{user?.role}</span>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map(c => (
          <Link key={c.to} to={c.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
