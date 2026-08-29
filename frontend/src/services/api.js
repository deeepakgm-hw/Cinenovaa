import axios from 'axios'
import { API_BASE_URL, API_ORIGIN } from '../config/apiConfig'

export { API_ORIGIN, API_BASE_URL }

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

export const authApi = {
  sendOtp: (payload) => api.post('/auth/otp/send', payload),
  verifyOtp: (payload) => api.post('/auth/otp/verify', payload)
}

export const movieApi = {
  list: (cityId) => api.get(cityId ? `/movies?cityId=${cityId}` : '/movies'),
  upcoming: () => api.get('/movies/upcoming'),
  popular: () => api.get('/movies/popular'),
  nowPlaying: () => api.get('/movies/now-playing'),
  search: (query) => api.get(`/movies/search?q=${encodeURIComponent(query)}`)
}

export const bookingApi = {
  seats: (showtimeId) => api.get(`/showtimes/${showtimeId}/seats`),
  lock: (payload) => api.post('/seats/lock', payload),
  pay: (payload) => api.post('/payments/confirm', payload)
}

export const groupApi = {
  create: (payload) => api.post('/group-sessions', payload),
  get: (code) => api.get(`/group-sessions/${code}`),
  close: (code) => api.delete(`/group-sessions/${code}`)
}

export const adminApi = {
  analytics: () => api.get('/analytics/summary')
}

export default api
