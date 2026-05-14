import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: '🏠 Главная', roles: ['user', 'admin'] },
  { to: '/teachers', label: '👨‍🏫 Учителя', roles: ['user', 'admin'] },
  { to: '/students', label: '🎓 Ученики', roles: ['user', 'admin'] },
  { to: '/grades', label: '📊 Успеваемость', roles: ['user', 'admin'] },
  { to: '/analytics', label: '📈 Аналитика', roles: ['user', 'admin'] },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav style={{
      background: '#1a56db',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      height: '56px',
      boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <span style={{ fontWeight: 700, fontSize: 18, marginRight: 32 }}>🏫 Школа</span>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {links.map(l => {
          if (!user || !l.roles.includes(user.role)) return null
          const active = location.pathname === l.to
          return (
            <Link key={l.to} to={l.to} style={{
              color: active ? '#fff' : 'rgba(255,255,255,.75)',
              background: active ? 'rgba(255,255,255,.15)' : 'transparent',
              padding: '6px 14px',
              borderRadius: 6,
              fontWeight: active ? 600 : 400,
              fontSize: 14,
              textDecoration: 'none',
            }}>{l.label}</Link>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user && (
          <span style={{ fontSize: 13, opacity: .85 }}>
            <span className={`badge badge-${user.role}`}>{user.role}</span>{' '}
            {user.login}
          </span>
        )}
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,.2)',
          color: '#fff',
          border: 'none',
          padding: '6px 14px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
        }}>Выйти</button>
      </div>
    </nav>
  )
}
