import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function StudentModal({ student, classes, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: student?.full_name ?? '',
    class_id: student?.class_id ?? (classes[0]?.id ?? ''),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Введите ФИО'); return }
    if (!form.class_id) { setError('Выберите класс'); return }
    setSaving(true)
    try {
      if (student) {
        await api.put(`/students/${student.id}`, { ...form, class_id: Number(form.class_id) })
      } else {
        await api.post('/students/', { ...form, class_id: Number(form.class_id) })
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
        <div className="modal-title">{student ? 'Редактировать ученика' : 'Добавить ученика'}</div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>ФИО</label>
          <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Алексеев Дмитрий Павлович" />
        </div>
        <div className="form-group">
          <label>Класс</label>
          <select value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([
        api.get('/students/'),
        api.get('/students/classes/all'),
      ])
      setStudents(s.data)
      setClasses(c.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить ученика?')) return
    await api.delete(`/students/${id}`)
    loadData()
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(filter.toLowerCase()) ||
    s.class_?.name?.toLowerCase().includes(filter.toLowerCase())
  )

  const getClassName = (s) => {
    if (s.class_) return s.class_.name
    const cls = classes.find(c => c.id === s.class_id)
    return cls?.name ?? '—'
  }

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title">🎓 Ученики</div>
        {isAdmin && <button className="btn-primary" onClick={() => setModal('add')}>+ Добавить</button>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input placeholder="🔍 Поиск по ФИО или классу..." value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Ученики не найдены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ФИО</th>
                <th>Класс</th>
                {isAdmin && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                  <td>
                    <span style={{ background: '#f3f4f6', border: '1px solid var(--border)', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      {getClassName(s)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <button className="btn-secondary btn-sm" onClick={() => setModal(s)} style={{ marginRight: 6 }}>✏️</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(s.id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <StudentModal
          student={modal === 'add' ? null : modal}
          classes={classes}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadData() }}
        />
      )}
    </div>
  )
}
