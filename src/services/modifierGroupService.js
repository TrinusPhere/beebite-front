import api from './api'

export const modifierGroupService = {
  getAll: async () => {
    const response = await api.get('/modifier-groups')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/modifier-groups/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/modifier-groups', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/modifier-groups/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/modifier-groups/${id}`)
    return response.data
  }
}
