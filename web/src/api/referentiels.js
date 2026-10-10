import api from './axios'

export const getCategories = () => api.get('/categories')
export const getServices = () => api.get('/services')
export const getSalles = (params) => api.get('/salles', { params })
export const getFournisseurs = () => api.get('/fournisseurs')
export const getUsers = (params) => api.get('/users', { params })
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)
export const getRapport = (type, params) =>
  api.get(`/rapports/${type}`, { params, responseType: params?.format ? 'blob' : 'json' })
