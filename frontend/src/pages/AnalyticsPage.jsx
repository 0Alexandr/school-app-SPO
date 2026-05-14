import { useState, useEffect } from 'react'
import api from '../api/client'

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/analytics/')
      .then(r => setData(r.data))
      .catch(() => setError('Ошибка загрузки аналитики'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 24 }}><div className="empty-state">Загрузка...</div></div>
  if (error) return <div style={{ padding: 24 }}><div className="alert alert-error">{error}</div></div>
  if (!data) return null

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-title" style={{ marginBottom: 24 }}>📈 Аналитика успеваемости</div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Средняя оценка</div>
          <div className="stat-value">{data.average_grade ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Минимальная оценка</div>
          <div className="stat-value" style={{ color: '#e02424' }}>{data.min_grade ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Максимальная оценка</div>
          <div className="stat-value" style={{ color: '#057a55' }}>{data.max_grade ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Лучший класс</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{data.best_class ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Слабейший класс</div>
          <div className="stat-value" style={{ fontSize: 22, color: '#c27803' }}>{data.worst_class ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Учитель (низкий ср. балл)</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, color: '#e02424' }}>{data.worst_teacher ?? '—'}</div>
        </div>
      </div>

      {/* Failing students */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          ⚠️ Неуспевающие ученики ({data.failing_students.length})
        </div>
        {data.failing_students.length === 0 ? (
          <div className="alert alert-success">Неуспевающих учеников нет 🎉</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ФИО</th>
                <th>Класс</th>
              </tr>
            </thead>
            <tbody>
              {data.failing_students.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500, color: 'var(--danger)' }}>{s.full_name}</td>
                  <td>{s.class_?.name ?? `Класс #${s.class_id}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
