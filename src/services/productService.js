import api from './api'

export const productService = {
  getAll: async (category, page = 0, size = 20) => {
    let url = `/products?page=${page}&size=${size}`
    if (category) url += `&categoryId=${encodeURIComponent(category)}`
    const response = await api.get(url)
    return response.data; // Retorna PageResponse completo: {content, page, size, totalElements, totalPages}
  },
  getById: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/products', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },
  updateRemovableItems: async (id, ingredientIds) => {
    const response = await api.put(`/products/${id}/removable-items`, ingredientIds)
    return response.data
  },
  updateModifierGroups: async (id, groupIds) => {
    const response = await api.put(`/products/${id}/modifier-groups`, groupIds)
    return response.data
  },
  getCategories: async () => {
    const response = await api.get('/products/categories')
    return response.data
  }
}
