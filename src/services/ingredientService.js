import api from './api'

export const ingredientService = {
  getAll: async () => {
    const response = await api.get('/ingredients')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/ingredients/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/ingredients', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/ingredients/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/ingredients/${id}`)
    return response.data
  }
}
