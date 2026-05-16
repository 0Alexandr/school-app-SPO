import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Главная', roles: ['user', 'admin'] },
  { to: '/teachers', label: 'Учителя', roles: ['user', 'admin'] },
  { to: '/students', label: 'Ученики', roles: ['user', 'admin'] },
  { to: '/grades', label: 'Успеваемость', roles: ['user', 'admin'] },
  { to: '/analytics', label: 'Аналитика', roles: ['user', 'admin'] },
  { to: '/admin', label: 'Admin', roles: ['admin'] },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      background: '#1a56db',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      minHeight: '56px',
      boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      gap: 18,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontWeight: 700, fontSize: 18 }}>Школа</span>
      <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
        {links.map(link => {
          if (!user || !link.roles.includes(user.role)) return null
          const active = location.pathname === link.to
          return (
            <Link key={link.to} to={link.to} style={{
              color: active ? '#fff' : 'rgba(255,255,255,.75)',
              background: active ? 'rgba(255,255,255,.15)' : 'transparent',
              padding: '6px 14px',
              borderRadius: 6,
              fontWeight: active ? 600 : 400,
              fontSize: 14,
              textDecoration: 'none',
            }}>
              {link.label}
            </Link>
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
        }}>
          Выйти
        </button>
      </div>
    </nav>
  )
}
