import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { LIMITS, trimToMax } from '../utils/validation'

function GradeModal({ grade, students, subjects, onClose, onSaved }) {
  const [form, setForm] = useState({
    student_id: grade?.student_id ?? (students[0]?.id ?? ''),
    subject_id: grade?.subject_id ?? (subjects[0]?.id ?? ''),
    quarter: grade?.quarter ?? 1,
    value: grade?.value ?? 4,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        ...form,
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        quarter: Number(form.quarter),
        value: Number(form.value),
      }

      if (grade) {
        await api.put(`/grades/${grade.id}`, { value: body.value, quarter: body.quarter })
      } else {
        await api.post('/grades/', body)
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
        <div className="modal-title">{grade ? 'Изменить оценку' : 'Добавить оценку'}</div>
        {error && <div className="alert alert-error">{error}</div>}
        {!grade && (
          <>
            <div className="form-group">
              <label>Ученик</label>
              <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Предмет</label>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>Четверть</label>
            <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))}>
              {[1, 2, 3, 4].map(quarter => (
                <option key={quarter} value={quarter}>
                  {quarter} четверть
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Оценка (2-5)</label>
            <select value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}>
              {[2, 3, 4, 5].map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GradesPage() {
  const { user } = useAuth()
  const canEditGrades = user?.role === 'admin' || user?.role === 'user'
  const [grades, setGrades] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [modal, setModal] = useState(null)
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterQuarter, setFilterQuarter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [gradesResponse, studentsResponse, subjectsResponse] = await Promise.all([
        api.get('/grades/'),
        api.get('/students/'),
        api.get('/teachers/subjects/all'),
      ])

      setGrades(gradesResponse.data)
      setStudents(studentsResponse.data)
      setSubjects(subjectsResponse.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить оценку?')) return
    await api.delete(`/grades/${id}`)
    loadData()
  }

  const getStudentById = (id) => students.find(student => student.id === id)
  const getStudentName = (id) => getStudentById(id)?.full_name ?? `#${id}`
  const getStudentClassName = (id) => getStudentById(id)?.class_?.name ?? '—'
  const getSubjectName = (id) => subjects.find(subject => subject.id === id)?.name ?? `#${id}`

  const classOptions = [...new Set(students.map(student => student.class_?.name).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
  const subjectOptions = [...subjects].sort((a, b) => a.name.localeCompare(b.name))

  const gradeColor = (value) => {
    if (value === 5) return 'badge-5'
    if (value === 4) return 'badge-4'
    if (value === 3) return 'badge-3'
    return 'badge-2'
  }

  const filtered = grades.filter(grade => {
    const student = getStudentById(grade.student_id)
    const studentName = student?.full_name?.toLowerCase() ?? ''
    const className = student?.class_?.name ?? ''

    return (
      (!filterStudent || studentName.includes(filterStudent.toLowerCase())) &&
      (!filterSubject || String(grade.subject_id) === filterSubject) &&
      (!filterClass || className === filterClass) &&
      (!filterQuarter || grade.quarter === Number(filterQuarter))
    )
  })

  return (
    <div style={{ padding: '24px', maxWidth: 1040, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title">Успеваемость</div>
        {canEditGrades && <button className="btn-primary" onClick={() => setModal('add')}>Добавить оценку</button>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Поиск по ученику..."
          value={filterStudent}
          onChange={e => setFilterStudent(trimToMax(e.target.value, LIMITS.search.max))}
          maxLength={LIMITS.search.max}
          style={{ maxWidth: 280 }}
        />
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Все предметы</option>
          {subjectOptions.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Все классы</option>
          {classOptions.map(className => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        <select value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Все четверти</option>
          {[1, 2, 3, 4].map(quarter => (
            <option key={quarter} value={quarter}>
              {quarter} четверть
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Оценки не найдены</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ученик</th>
                <th>Класс</th>
                <th>Предмет</th>
                <th>Четверть</th>
                <th>Оценка</th>
                {canEditGrades && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(grade => (
                <tr key={grade.id}>
                  <td>{getStudentName(grade.student_id)}</td>
                  <td>{getStudentClassName(grade.student_id)}</td>
                  <td>{grade.subject ? grade.subject.name : getSubjectName(grade.subject_id)}</td>
                  <td>{grade.quarter}</td>
                  <td><span className={`badge ${gradeColor(grade.value)}`}>{grade.value}</span></td>
                  {canEditGrades && (
                    <td>
                      <div className="table-actions">
                        <button className="action-btn action-edit" onClick={() => setModal(grade)}>Редактировать</button>
                        <button className="action-btn action-delete" onClick={() => handleDelete(grade.id)}>Удалить</button>
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
        <GradeModal
          grade={modal === 'add' ? null : modal}
          students={students}
          subjects={subjects}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
