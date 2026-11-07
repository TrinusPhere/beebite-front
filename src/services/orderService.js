import api from "./api";

export const orderService = {
  getKanban: async (typeFilter = "") =>
    (await api.get("/orders/kanban", { params: { type: typeFilter } })).data,

  getHistory: async (date) =>
    (await api.get("/orders/history", { params: { date } })).data,

  getById: async (id) => (await api.get(`/orders/${id}`)).data,
  create: async (data) => (await api.post("/orders", data)).data,
  update: async (id, data) => (await api.put(`/orders/${id}`, data)).data,
  advanceStatus: async (id) => (await api.patch(`/orders/${id}/advance`)).data,
  moveToColumn: async (id, targetStatus) =>
    (await api.patch(`/orders/${id}/move`, { targetStatus })).data,
  cancel: async (id) =>
    (await api.patch(`/orders/${id}/move`, { targetStatus: "CANCELADO" })).data,
  assignDriver: async (id, driverId, driverName) =>
    (await api.patch(`/orders/${id}/assign-driver`, { driverId, driverName }))
      .data,
  emitNfe: async (id) => (await api.post(`/orders/${id}/nfe`)).data,
  batchMove: async (orderIds, targetStatus) =>
    (await api.patch("/orders/batch/move", { orderIds, targetStatus })).data,
  batchAssignDriver: async (orderIds, driverId, driverName) =>
    (
      await api.patch("/orders/batch/assign-driver", {
        orderIds,
        driverId,
        driverName,
      })
    ).data,
  delete: async (id) => (await api.delete(`/orders/${id}`)).data,
};
