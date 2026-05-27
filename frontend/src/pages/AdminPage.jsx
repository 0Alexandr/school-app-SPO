import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getRoleLabel } from '../utils/roles'
import { LIMITS, trimToMax, validateLength } from '../utils/validation'

const roles = ['guest', 'user', 'admin']

export default function AdminPage() {
  const { user, refreshUser, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [subjectName, setSubjectName] = useState('')
  const [className, setClassName] = useState('')
  const [editingSubject, setEditingSubject] = useState(null)
  const [editingClass, setEditingClass] = useState(null)
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
    const validationError = validateLength(subjectName, 'Название предмета', LIMITS.subject)
    if (validationError) {
      setError(validationError)
      setMessage('')
      return
    }
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
    const validationError = validateLength(className, 'Название класса', LIMITS.className)
    if (validationError) {
      setError(validationError)
      setMessage('')
      return
    }
    try {
      await api.post('/admin/classes', { name: className })
      setClassName('')
      showSuccess('Класс добавлен')
      loadData()
    } catch (e) {
      showError(e, 'Не удалось добавить класс')
    }
  }

  const updateSubject = async () => {
    const validationError = validateLength(editingSubject?.name ?? '', 'Название предмета', LIMITS.subject)
    if (validationError) {
      setError(validationError)
      setMessage('')
      return
    }
    try {
      const { data } = await api.put(`/admin/subjects/${editingSubject.id}`, { name: editingSubject.name })
      setSubjects(current => current.map(item => item.id === data.id ? data : item))
      setEditingSubject(null)
      showSuccess('Предмет изменён')
    } catch (e) {
      showError(e, 'Не удалось изменить предмет')
    }
  }

  const deleteSubject = async (subject) => {
    if (!confirm(`Удалить предмет "${subject.name}"? Все оценки по этому предмету тоже будут удалены.`)) return
    try {
      await api.delete(`/admin/subjects/${subject.id}`)
      setSubjects(current => current.filter(item => item.id !== subject.id))
      showSuccess('Предмет удалён')
    } catch (e) {
      showError(e, 'Не удалось удалить предмет')
    }
  }

  const updateClass = async () => {
    const validationError = validateLength(editingClass?.name ?? '', 'Название класса', LIMITS.className)
    if (validationError) {
      setError(validationError)
      setMessage('')
      return
    }
    try {
      const { data } = await api.put(`/admin/classes/${editingClass.id}`, { name: editingClass.name })
      setClasses(current => current.map(item => item.id === data.id ? data : item))
      setEditingClass(null)
      showSuccess('Класс изменён')
    } catch (e) {
      showError(e, 'Не удалось изменить класс')
    }
  }

  const deleteClass = async (classItem) => {
    if (!confirm(`Удалить класс "${classItem.name}"? Ученики класса и их оценки тоже будут удалены.`)) return
    try {
      await api.delete(`/admin/classes/${classItem.id}`)
      setClasses(current => current.filter(item => item.id !== classItem.id))
      showSuccess('Класс удалён')
    } catch (e) {
      showError(e, 'Не удалось удалить класс')
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

  const deleteUser = async (targetUser) => {
    const suffix = targetUser.id === user?.id ? ' После удаления текущая сессия завершится.' : ''
    if (!confirm(`Удалить пользователя ${targetUser.login}?${suffix}`)) return
    try {
      await api.delete(`/admin/users/${targetUser.id}`)
      showSuccess(`Пользователь ${targetUser.login} удалён`)
      if (targetUser.id === user?.id) {
        logout()
        return
      }
      setUsers(current => current.filter(item => item.id !== targetUser.id))
    } catch (e) {
      showError(e, 'Не удалось удалить пользователя')
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
                  onChange={event => setSubjectName(trimToMax(event.target.value, LIMITS.subject.max))}
                  placeholder="Название предмета"
                  required
                  minLength={LIMITS.subject.min}
                  maxLength={LIMITS.subject.max}
                />
                <button className="btn-primary" type="submit">Добавить</button>
              </form>
              {subjects.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>Предметов пока нет</div>
              ) : (
                <div className="management-list">
                  {subjects.map(subject => (
                    <div className="management-item" key={subject.id}>
                      {editingSubject?.id === subject.id ? (
                        <input
                          value={editingSubject.name}
                          onChange={event => setEditingSubject({ ...editingSubject, name: trimToMax(event.target.value, LIMITS.subject.max) })}
                          minLength={LIMITS.subject.min}
                          maxLength={LIMITS.subject.max}
                          autoFocus
                        />
                      ) : (
                        <span className="badge badge-user">{subject.name}</span>
                      )}
                      <div className="management-actions">
                        {editingSubject?.id === subject.id ? (
                          <>
                            <button className="btn-primary btn-sm" type="button" onClick={updateSubject}>Сохранить</button>
                            <button className="btn-secondary btn-sm" type="button" onClick={() => setEditingSubject(null)}>Отмена</button>
                          </>
                        ) : (
                          <>
                            <button className="action-btn action-edit" type="button" onClick={() => setEditingSubject(subject)}>Редактировать</button>
                            <button className="action-btn action-delete" type="button" onClick={() => deleteSubject(subject)}>Удалить</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Классы</h2>
              <form onSubmit={createClass} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                  value={className}
                  onChange={event => setClassName(trimToMax(event.target.value, LIMITS.className.max))}
                  placeholder="Название класса"
                  required
                  minLength={LIMITS.className.min}
                  maxLength={LIMITS.className.max}
                />
                <button className="btn-primary" type="submit">Добавить</button>
              </form>
              {classes.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>Классов пока нет</div>
              ) : (
                <div className="management-list">
                  {classes.map(classItem => (
                    <div className="management-item" key={classItem.id}>
                      {editingClass?.id === classItem.id ? (
                        <input
                          value={editingClass.name}
                          onChange={event => setEditingClass({ ...editingClass, name: trimToMax(event.target.value, LIMITS.className.max) })}
                          minLength={LIMITS.className.min}
                          maxLength={LIMITS.className.max}
                          autoFocus
                        />
                      ) : (
                        <span className="badge badge-4">{classItem.name}</span>
                      )}
                      <div className="management-actions">
                        {editingClass?.id === classItem.id ? (
                          <>
                            <button className="btn-primary btn-sm" type="button" onClick={updateClass}>Сохранить</button>
                            <button className="btn-secondary btn-sm" type="button" onClick={() => setEditingClass(null)}>Отмена</button>
                          </>
                        ) : (
                          <>
                            <button className="action-btn action-edit" type="button" onClick={() => setEditingClass(classItem)}>Редактировать</button>
                            <button className="action-btn action-delete" type="button" onClick={() => deleteClass(classItem)}>Удалить</button>
                          </>
                        )}
                      </div>
                    </div>
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
                    <th>Действия</th>
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
                      <td>
                        <button className="action-btn action-delete" onClick={() => deleteUser(item)}>Удалить</button>
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
