import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => { localStorage.clear(); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (login, password) => {
    const { data } = await api.post('/auth/login', { login, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }

  const register = async (loginValue, passwordValue, profile = {}) => {
    await api.post('/auth/register', { login: loginValue, password: passwordValue, ...profile })
    await login(loginValue, passwordValue)
  }

  const updateProfile = async (profile) => {
    const { data } = await api.put('/auth/me', profile)
    setUser(data)
    return data
  }

  const updatePassword = async (passwords) => {
    const { data } = await api.put('/auth/me/password', passwords)
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me')
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
