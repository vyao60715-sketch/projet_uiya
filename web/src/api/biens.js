import api from './axios'

export const getBiens = (params) => api.get('/biens', { params })
export const getBien = (id) => api.get(`/biens/${id}`)
export const createBien = (data) => api.post('/biens', data)
export const updateBien = (id, data) => api.put(`/biens/${id}`, data)
export const deleteBien = (id) => api.delete(`/biens/${id}`)
export const getBienByQr = (uuid) => api.get(`/biens/qr/${uuid}`)
export const getBienHistorique = (id) => api.get(`/biens/${id}/historique`)
export const getEtiquette = (id) => api.get(`/biens/${id}/etiquette`, { responseType: 'blob' })
export const affecter = (id, data) => api.post(`/biens/${id}/affecter`, data)
export const transferer = (id, data) => api.post(`/biens/${id}/transferer`, data)
export const preter = (id, data) => api.post(`/biens/${id}/preter`, data)
export const retourPret = (id, data) => api.post(`/biens/${id}/retour`, data)
