import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRoleLabel } from '../utils/roles'
import { LIMITS, loginPasswordHint, loginPasswordPattern, trimToMax, validateLength } from '../utils/validation'

const isValidEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isValidPassword = (value) => loginPasswordPattern.test(value)

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
  const [visiblePasswords, setVisiblePasswords] = useState({
    current_password: false,
    new_password: false,
    repeat_password: false,
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const saveProfile = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    const fullNameError = validateLength(profile.full_name, 'ФИО', LIMITS.fullName)
    if (fullNameError) {
      setError(fullNameError)
      return
    }
    if (profile.email.trim().length > LIMITS.email.max) {
      setError(`Почта: максимум ${LIMITS.email.max} символов`)
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
      setError(`Новый пароль: ${loginPasswordHint}`)
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

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords(current => ({ ...current, [field]: !current[field] }))
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
                onChange={event => setProfile(current => ({ ...current, full_name: trimToMax(event.target.value, LIMITS.fullName.max) }))}
                placeholder="Иванов Иван Иванович"
                required
                minLength={LIMITS.fullName.min}
                maxLength={LIMITS.fullName.max}
              />
            </div>
            <div className="form-group">
              <label>Почта</label>
              <input
                type="email"
                value={profile.email}
                onChange={event => setProfile(current => ({ ...current, email: trimToMax(event.target.value, LIMITS.email.max) }))}
                placeholder="name@school.ru"
                maxLength={LIMITS.email.max}
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
              <div className="password-input">
                <input
                  type={visiblePasswords.current_password ? 'text' : 'password'}
                  value={passwords.current_password}
                  onChange={event => setPasswords(current => ({ ...current, current_password: trimToMax(event.target.value, LIMITS.password.max) }))}
                  required
                  maxLength={LIMITS.password.max}
                />
                <button
                  type="button"
                  className="password-toggle password-toggle-text"
                  onClick={() => togglePasswordVisibility('current_password')}
                  aria-label={visiblePasswords.current_password ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {visiblePasswords.current_password ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Новый пароль</label>
              <div className="password-input">
                <input
                  type={visiblePasswords.new_password ? 'text' : 'password'}
                  value={passwords.new_password}
                  onChange={event => setPasswords(current => ({ ...current, new_password: trimToMax(event.target.value, LIMITS.password.max) }))}
                  required
                  minLength={LIMITS.password.min}
                  maxLength={LIMITS.password.max}
                  pattern="[A-Za-z0-9@._-]{3,15}"
                  title={loginPasswordHint}
                />
                <button
                  type="button"
                  className="password-toggle password-toggle-text"
                  onClick={() => togglePasswordVisibility('new_password')}
                  aria-label={visiblePasswords.new_password ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {visiblePasswords.new_password ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Повторите пароль</label>
              <div className="password-input">
                <input
                  type={visiblePasswords.repeat_password ? 'text' : 'password'}
                  value={passwords.repeat_password}
                  onChange={event => setPasswords(current => ({ ...current, repeat_password: trimToMax(event.target.value, LIMITS.password.max) }))}
                  required
                  minLength={LIMITS.password.min}
                  maxLength={LIMITS.password.max}
                />
                <button
                  type="button"
                  className="password-toggle password-toggle-text"
                  onClick={() => togglePasswordVisibility('repeat_password')}
                  aria-label={visiblePasswords.repeat_password ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {visiblePasswords.repeat_password ? 'Скрыть' : 'Показать'}
                </button>
              </div>
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
