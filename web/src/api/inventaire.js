import api from './axios'

export const getCampagnes = (params) => api.get('/inventaires', { params })
export const createCampagne = (data) => api.post('/inventaires', data)
export const syncInventaire = (id, data) => api.post(`/inventaires/${id}/sync`, data)
export const cloturerCampagne = (id) => api.post(`/inventaires/${id}/cloturer`)
