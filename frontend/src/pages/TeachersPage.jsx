import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { LIMITS, trimToMax, validateLength } from '../utils/validation'

function TeacherModal({ teacher, subjects, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: teacher?.full_name ?? '',
    room: teacher?.room ?? '',
    user_id: teacher?.user_id ?? '',
    subject_ids: teacher?.subjects?.map(s => s.id) ?? [],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleSubject = (id) => {
    setForm(f => ({
      ...f,
      subject_ids: f.subject_ids.includes(id)
        ? f.subject_ids.filter(x => x !== id)
        : [...f.subject_ids, id],
    }))
  }

  const handleSave = async () => {
    const fullNameError = validateLength(form.full_name, 'ФИО', LIMITS.fullName)
    if (fullNameError) { setError(fullNameError); return }
    const roomError = form.room.trim() ? validateLength(form.room, 'Кабинет', { min: 1, max: LIMITS.room.max }) : ''
    if (roomError) { setError(roomError); return }
    setSaving(true)
    try {
      if (teacher) {
        await api.put(`/teachers/${teacher.id}`, { ...form, user_id: form.user_id ? Number(form.user_id) : null })
      } else {
        await api.post('/teachers/', { ...form, user_id: form.user_id ? Number(form.user_id) : null })
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{teacher ? 'Редактировать учителя' : 'Добавить учителя'}</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>ФИО</label>
          <input
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: trimToMax(e.target.value, LIMITS.fullName.max) }))}
            placeholder="Иванов Иван Иванович"
            required
            minLength={LIMITS.fullName.min}
            maxLength={LIMITS.fullName.max}
          />
        </div>
        <div className="form-group">
          <label>Кабинет</label>
          <input
            value={form.room}
            onChange={e => setForm(f => ({ ...f, room: trimToMax(e.target.value, LIMITS.room.max) }))}
            placeholder="101"
            maxLength={LIMITS.room.max}
          />
        </div>
        <div className="form-group">
          <label>Аккаунт учителя</label>
          <select
            value={form.user_id}
            onChange={e => {
              const selectedUser = users.find(user => user.id === Number(e.target.value))
              setForm(f => ({
                ...f,
                user_id: e.target.value,
                full_name: selectedUser?.full_name || f.full_name,
              }))
            }}
          >
            <option value="">Не привязан</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>ID {user.id} - {user.full_name || user.login}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Предметы</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {subjects.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 400, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.subject_ids.includes(s.id)} onChange={() => toggleSubject(s.id)} style={{ width: 'auto' }} />
                {s.name}
              </label>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null) // null | 'add' | teacher obj
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      const [teachersResponse, subjectsResponse, usersResponse] = await Promise.all([
        api.get('/teachers/'),
        api.get('/teachers/subjects/all'),
        isAdmin ? api.get('/admin/users') : Promise.resolve({ data: [] }),
      ])
      setTeachers(teachersResponse.data)
      setSubjects(subjectsResponse.data)
      setUsers(usersResponse.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubjects() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить учителя?')) return
    await api.delete(`/teachers/${id}`)
    fetchSubjects()
  }
  const linkedTeacherUserIds = new Set(teachers.map(teacher => teacher.user_id).filter(Boolean))
  const availableTeacherUsers = users.filter(item =>
    item.role === 'user' && (!linkedTeacherUserIds.has(item.id) || item.id === modal?.user_id)
  )
  const normalizedFilter = filter.trim().toLowerCase()
  const filteredTeachers = teachers.filter(teacher =>
    !normalizedFilter ||
    teacher.full_name.toLowerCase().includes(normalizedFilter) ||
    String(teacher.user_id ?? '').includes(normalizedFilter)
  )

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title">Учителя</div>
      </div>

      <div className="table-toolbar">
        <input
          placeholder="Поиск по ФИО или ID аккаунта..."
          value={filter}
          onChange={e => setFilter(trimToMax(e.target.value, LIMITS.search.max))}
          maxLength={LIMITS.search.max}
          style={{ maxWidth: 360 }}
        />
        {isAdmin && <button className="btn-primary" onClick={() => setModal('add')}>Добавить</button>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">Загрузка...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="empty-state">Учителя не найдены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                {isAdmin && <th>ID аккаунта</th>}
                <th>ФИО</th>
                <th>Кабинет</th>
                <th>Предметы</th>
                {isAdmin && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t, i) => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  {isAdmin && <td>{t.user_id ? `ID ${t.user_id}` : '—'}</td>}
                  <td style={{ fontWeight: 500 }}>{t.full_name}</td>
                  <td>{t.room || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {t.subjects.length ? t.subjects.map(s => (
                        <span key={s.id} style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{s.name}</span>
                      )) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="table-actions">
                        <button className="action-btn action-edit" onClick={() => setModal(t)}>Редактировать</button>
                        <button className="action-btn action-delete" onClick={() => handleDelete(t.id)}>Удалить</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <TeacherModal
          teacher={modal === 'add' ? null : modal}
          subjects={subjects}
          users={availableTeacherUsers}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchSubjects() }}
        />
      )}
    </div>
  )
}
