import api from './api'

export const orderService = {
  getKanban: async (typeFilter = '') => {
    const response = await api.get('/orders/kanban', {
      params: { type: typeFilter }
    })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/orders', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/orders/${id}`, data)
    return response.data
  },

  advanceStatus: async (id) => {
    const response = await api.patch(`/orders/${id}/advance`)
    return response.data
  },

  moveToColumn: async (id, targetStatus) => {
    const response = await api.patch(`/orders/${id}/move`, { targetStatus })
    return response.data
  },

  assignDriver: async (id, driverId, driverName) => {
    const response = await api.patch(`/orders/${id}/assign-driver`, { driverId, driverName })
    return response.data
  },

  emitNfe: async (id) => {
    const response = await api.post(`/orders/${id}/nfe`)
    return response.data
  },

  batchMove: async (orderIds, targetStatus) => {
    const response = await api.patch('/orders/batch/move', { orderIds, targetStatus })
    return response.data
  },

  batchAssignDriver: async (orderIds, driverId, driverName) => {
    const response = await api.patch('/orders/batch/assign-driver', { orderIds, driverId, driverName })
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/orders/${id}`)
    return response.data
  }
}
