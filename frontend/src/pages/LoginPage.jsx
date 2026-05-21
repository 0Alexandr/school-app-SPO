import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const isValidLogin = (value) => /^[A-Za-zА-Яа-я0-9_.-]{3,32}$/.test(value)
const isValidPassword = (value) => value.length >= 5 && /[A-Za-zА-Яа-я]/.test(value)

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: doLogin, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isValidLogin(login.trim())) {
      setError('Логин должен быть от 3 до 32 символов: буквы, цифры, точка, дефис или подчёркивание')
      return
    }
    if (mode === 'register' && !isValidPassword(password)) {
      setError('Пароль должен быть от 5 символов и содержать хотя бы одну букву')
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
          <div style={{ fontSize: 48 }}>🏫</div>
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
                onChange={e => setLogin(e.target.value)}
                required
                minLength={3}
                maxLength={32}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 5 : undefined}
              />
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
