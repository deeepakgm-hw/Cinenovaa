import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000
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

export const adminApi = {
  analytics: () => api.get('/analytics/summary')
}

export default api
