import api from './axios'

export const getCategories = () => api.get('/categories')
export const createCategorie = (data) => api.post('/categories', data)
export const updateCategorie = (id, data) => api.put(`/categories/${id}`, data)
export const deleteCategorie = (id) => api.delete(`/categories/${id}`)

export const getServices = () => api.get('/services')
export const createService = (data) => api.post('/services', data)
export const updateService = (id, data) => api.put(`/services/${id}`, data)
export const deleteService = (id) => api.delete(`/services/${id}`)

export const getBatiments = () => api.get('/batiments')
export const createBatiment = (data) => api.post('/batiments', data)
export const updateBatiment = (id, data) => api.put(`/batiments/${id}`, data)
export const deleteBatiment = (id) => api.delete(`/batiments/${id}`)

export const getSalles = (params) => api.get('/salles', { params })
export const createSalle = (data) => api.post('/salles', data)
export const updateSalle = (id, data) => api.put(`/salles/${id}`, data)
export const deleteSalle = (id) => api.delete(`/salles/${id}`)

export const getFournisseurs = () => api.get('/fournisseurs')
export const createFournisseur = (data) => api.post('/fournisseurs', data)
export const updateFournisseur = (id, data) => api.put(`/fournisseurs/${id}`, data)
export const deleteFournisseur = (id) => api.delete(`/fournisseurs/${id}`)

export const getUsers = (params) => api.get('/users', { params })
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

export const getRapport = (type, params) =>
  api.get(`/rapports/${type}`, { params, responseType: params?.format ? 'blob' : 'json' })
