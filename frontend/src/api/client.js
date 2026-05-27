import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

const translations = {
  'Field required': 'Заполните обязательное поле',
  'Input should be a valid integer': 'Введите целое число',
  'Input should be a valid string': 'Введите текст',
  'Input should be a valid email address': 'Введите корректную почту',
  'String should have at least': 'Слишком короткое значение',
  'String should have at most': 'Слишком длинное значение',
  'Input should be greater than or equal to': 'Значение меньше допустимого',
  'Input should be less than or equal to': 'Значение больше допустимого',
  'Invalid credentials': 'Неверный логин или пароль',
  'Not authenticated': 'Войдите в систему',
}

const translateMessage = (message) => {
  if (!message) return 'Произошла ошибка'
  const direct = translations[message]
  if (direct) return direct
  const partial = Object.entries(translations).find(([key]) => message.includes(key))
  return partial ? partial[1] : message
}

const normalizeErrorDetail = (detail) => {
  if (Array.isArray(detail)) {
    return detail.map(item => translateMessage(item.msg)).join('. ')
  }
  if (typeof detail === 'string') {
    return translateMessage(detail)
  }
  return detail
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.data?.detail) {
      error.response.data.detail = normalizeErrorDetail(error.response.data.detail)
    }
    const authUrl = original?.url ?? ''
    const isAuthRequest = authUrl.includes('/auth/login') || authUrl.includes('/auth/register')
    if (isAuthRequest) {
      return Promise.reject(error)
    }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post('/api/auth/refresh', { refresh_token: refresh })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
