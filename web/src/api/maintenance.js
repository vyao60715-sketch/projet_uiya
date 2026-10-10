import api from './axios'

export const getMaintenances = (params) => api.get('/maintenances', { params })
export const createMaintenance = (data) => api.post('/maintenances', data)
export const updateMaintenance = (id, data) => api.put(`/maintenances/${id}`, data)
