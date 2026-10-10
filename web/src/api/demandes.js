import api from './axios'

export const getDemandes = (params) => api.get('/demandes', { params })
export const createDemande = (data) => api.post('/demandes', data)
export const validerDemande = (id, data) => api.post(`/demandes/${id}/valider`, data)
export const rejeterDemande = (id, data) => api.post(`/demandes/${id}/rejeter`, data)
