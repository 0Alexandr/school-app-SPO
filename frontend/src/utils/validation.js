export const LIMITS = {
  login: { min: 3, max: 15 },
  password: { min: 3, max: 15 },
  fullName: { min: 5, max: 80 },
  email: { max: 120 },
  subject: { min: 2, max: 40 },
  className: { min: 1, max: 10 },
  room: { max: 12 },
  search: { max: 80 },
}

export const loginPasswordPattern = /^[A-Za-z0-9@._-]{3,15}$/
export const loginPasswordHint = 'Используйте 3-15 символов: английские буквы, цифры и @ . _ -'

export const validateLength = (value, label, { min = 0, max }) => {
  const text = value.trim()
  if (min && text.length < min) return `${label}: минимум ${min} символов`
  if (max && text.length > max) return `${label}: максимум ${max} символов`
  return ''
}

export const trimToMax = (value, max) => value.slice(0, max)
