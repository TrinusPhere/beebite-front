import api from './api'

export const additionalService = {
  getAll: async () => {
    const response = await api.get('/additionals')
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/additionals', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/additionals/${id}`, data)
    return response.data
  },
  toggleStatus: async (id) => {
    const response = await api.patch(`/additionals/${id}/toggle-status`)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/additionals/${id}`)
    return response.data
  }
}
