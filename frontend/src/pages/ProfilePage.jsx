import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRoleLabel } from '../utils/roles'

const isValidEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isValidPassword = (value) => value.length >= 5 && /[A-Za-zА-Яа-я]/.test(value)

export default function ProfilePage() {
  const { user, updateProfile, updatePassword } = useAuth()
  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
  })
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    repeat_password: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const saveProfile = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (profile.full_name.trim().length < 5) {
      setError('ФИО должно быть не короче 5 символов')
      return
    }
    if (!isValidEmail(profile.email.trim())) {
      setError('Введите корректную почту')
      return
    }
    setSavingProfile(true)
    try {
      await updateProfile({
        full_name: profile.full_name.trim(),
        email: profile.email.trim() || null,
      })
      setMessage('Профиль сохранён')
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Не удалось сохранить профиль')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!isValidPassword(passwords.new_password)) {
      setError('Новый пароль должен быть от 5 символов и содержать хотя бы одну букву')
      return
    }
    if (passwords.new_password !== passwords.repeat_password) {
      setError('Пароли не совпадают')
      return
    }
    setSavingPassword(true)
    try {
      await updatePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      })
      setPasswords({ current_password: '', new_password: '', repeat_password: '' })
      setMessage('Пароль изменён')
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Не удалось изменить пароль')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Профиль</div>
          <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Данные аккаунта и безопасность</div>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="profile-grid">
        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Данные пользователя</h2>
          <div className="profile-meta">
            <div>
              <span>ID пользователя</span>
              <strong>{user?.id}</strong>
            </div>
            <div>
              <span>Логин</span>
              <strong>{user?.login}</strong>
            </div>
            <div>
              <span>Роль</span>
              <strong><span className={`badge badge-${user?.role}`}>{getRoleLabel(user?.role)}</span></strong>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>ФИО</label>
              <input
                value={profile.full_name}
                onChange={event => setProfile(current => ({ ...current, full_name: event.target.value }))}
                placeholder="Иванов Иван Иванович"
                required
                minLength={5}
              />
            </div>
            <div className="form-group">
              <label>Почта</label>
              <input
                type="email"
                value={profile.email}
                onChange={event => setProfile(current => ({ ...current, email: event.target.value }))}
                placeholder="name@school.ru"
              />
            </div>
            <button className="btn-primary" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Сохранение...' : 'Сохранить профиль'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Смена пароля</h2>
          <form onSubmit={savePassword}>
            <div className="form-group">
              <label>Текущий пароль</label>
              <input
                type="password"
                value={passwords.current_password}
                onChange={event => setPasswords(current => ({ ...current, current_password: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Новый пароль</label>
              <input
                type="password"
                value={passwords.new_password}
                onChange={event => setPasswords(current => ({ ...current, new_password: event.target.value }))}
                required
                minLength={5}
              />
            </div>
            <div className="form-group">
              <label>Повторите пароль</label>
              <input
                type="password"
                value={passwords.repeat_password}
                onChange={event => setPasswords(current => ({ ...current, repeat_password: event.target.value }))}
                required
                minLength={5}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
