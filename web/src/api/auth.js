import api from './axios'

export const login = (email, password) =>
  api.post('/login', { email, password })

export const logout = () => api.post('/logout')

export const forgotPassword = (email) =>
  api.post('/password/forgot', { email })

export const getProfile = () => api.get('/user')
