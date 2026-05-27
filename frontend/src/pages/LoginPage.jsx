import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LIMITS, loginPasswordHint, loginPasswordPattern, trimToMax } from '../utils/validation'

const isValidLogin = (value) => loginPasswordPattern.test(value)
const isValidPassword = (value) => loginPasswordPattern.test(value)
const loginModeMaxLength = 30

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: doLogin, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register' && !isValidLogin(login.trim())) {
      setError(`Логин: ${loginPasswordHint}`)
      return
    }
    if (mode === 'register' && !isValidPassword(password)) {
      setError(`Пароль: ${loginPasswordHint}`)
      return
    }
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(login.trim(), password)
      } else {
        await doLogin(login.trim(), password)
      }
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail ?? (mode === 'register' ? 'Не удалось зарегистрироваться' : 'Неверный логин или пароль'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{ width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>Школьная система</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'register' ? 'Создайте аккаунт ученика' : 'Войдите в свой аккаунт'}
          </p>
        </div>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Логин</label>
              <input
                type="text"
                placeholder="Введите логин"
                value={login}
                onChange={e => setLogin(trimToMax(e.target.value, mode === 'register' ? LIMITS.login.max : loginModeMaxLength))}
                required
                minLength={mode === 'register' ? LIMITS.login.min : 1}
                maxLength={mode === 'register' ? LIMITS.login.max : loginModeMaxLength}
                pattern={mode === 'register' ? '[A-Za-z0-9@._-]{3,15}' : undefined}
                title={mode === 'register' ? loginPasswordHint : undefined}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={e => setPassword(trimToMax(e.target.value, mode === 'register' ? LIMITS.password.max : loginModeMaxLength))}
                  required
                  minLength={mode === 'register' ? LIMITS.password.min : undefined}
                  maxLength={mode === 'register' ? LIMITS.password.max : loginModeMaxLength}
                  pattern={mode === 'register' ? '[A-Za-z0-9@._-]{3,15}' : undefined}
                  title={mode === 'register' ? loginPasswordHint : undefined}
                />
                <button
                  type="button"
                  className="password-toggle password-toggle-text"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: 15, marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Подождите...' : (mode === 'register' ? 'Зарегистрироваться' : 'Войти')}
            </button>
          </form>
          <button
            type="button"
            className="btn-link"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Регистрация' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}
