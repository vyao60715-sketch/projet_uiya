import api from './axios'

export const getDashboard = () => api.get('/dashboard')
export const getNotifications = () => api.get('/notifications')
