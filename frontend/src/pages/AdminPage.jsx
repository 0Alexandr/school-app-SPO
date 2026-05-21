import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getRoleLabel } from '../utils/roles'

const roles = ['guest', 'user', 'admin']

export default function AdminPage() {
  const { user, refreshUser } = useAuth()
  const [users, setUsers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [subjectName, setSubjectName] = useState('')
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersResponse, subjectsResponse, classesResponse] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/subjects'),
        api.get('/admin/classes'),
      ])
      setUsers(usersResponse.data)
      setSubjects(subjectsResponse.data)
      setClasses(classesResponse.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Не удалось загрузить данные админки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showSuccess = (text) => {
    setMessage(text)
    setError('')
  }

  const showError = (e, fallback) => {
    setError(e.response?.data?.detail ?? fallback)
    setMessage('')
  }

  const createSubject = async (event) => {
    event.preventDefault()
    try {
      await api.post('/admin/subjects', { name: subjectName })
      setSubjectName('')
      showSuccess('Предмет добавлен')
      loadData()
    } catch (e) {
      showError(e, 'Не удалось добавить предмет')
    }
  }

  const createClass = async (event) => {
    event.preventDefault()
    try {
      await api.post('/admin/classes', { name: className })
      setClassName('')
      showSuccess('Класс добавлен')
      loadData()
    } catch (e) {
      showError(e, 'Не удалось добавить класс')
    }
  }

  const updateRole = async (targetUser, role) => {
    try {
      const { data } = await api.put(`/admin/users/${targetUser.id}/role`, { role })
      setUsers(current => current.map(item => item.id === data.id ? data : item))
      showSuccess(`Роль пользователя ${data.login} изменена на ${getRoleLabel(data.role)}`)
      if (targetUser.id === user?.id) {
        await refreshUser()
      }
    } catch (e) {
      showError(e, 'Не удалось изменить роль')
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1120, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Завуч</div>
          <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Предметы, классы и роли пользователей</div>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Загрузка...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
            <section className="card">
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Предметы</h2>
              <form onSubmit={createSubject} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                  value={subjectName}
                  onChange={event => setSubjectName(event.target.value)}
                  placeholder="Название предмета"
                  required
                />
                <button className="btn-primary" type="submit">Добавить</button>
              </form>
              {subjects.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>Предметов пока нет</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {subjects.map(subject => (
                    <span className="badge badge-user" key={subject.id}>{subject.name}</span>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Классы</h2>
              <form onSubmit={createClass} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                  value={className}
                  onChange={event => setClassName(event.target.value)}
                  placeholder="Название класса"
                  required
                />
                <button className="btn-primary" type="submit">Добавить</button>
              </form>
              {classes.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>Классов пока нет</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {classes.map(classItem => (
                    <span className="badge badge-4" key={classItem.id}>{classItem.name}</span>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 18 }}>Пользователи</h2>
            </div>
            {users.length === 0 ? (
              <div className="empty-state">Пользователей пока нет</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Логин</th>
                    <th>Текущая роль</th>
                    <th>Изменить роль</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        {item.login}
                        {item.id === user?.id && <span style={{ color: 'var(--text-muted)' }}> (вы)</span>}
                      </td>
                      <td><span className={`badge badge-${item.role}`}>{getRoleLabel(item.role)}</span></td>
                      <td style={{ maxWidth: 220 }}>
                        <select value={item.role} onChange={event => updateRole(item, event.target.value)}>
                          {roles.map(role => (
                            <option key={role} value={role}>{getRoleLabel(role)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
