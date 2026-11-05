import api from "./api";

export const kdsService = {
  // Estações
  listStations() {
    return api.get("/kds/stations").then((r) => r.data);
  },
  getStation(id) {
    return api.get(`/kds/stations/${id}`).then((r) => r.data);
  },
  createStation(data) {
    return api.post("/kds/stations", data).then((r) => r.data);
  },
  updateStation(id, data) {
    return api.put(`/kds/stations/${id}`, data).then((r) => r.data);
  },
  deleteStation(id) {
    return api.delete(`/kds/stations/${id}`).then((r) => r.data);
  },

  // Tarefas KDS
  getActiveTasks(stationId = null) {
    const params = stationId ? { stationId } : {};
    return api.get("/kds/tasks/active", { params }).then((r) => r.data);
  },
  getCompletedTasks(stationId = null, limit = 50) {
    const params = { limit };
    if (stationId) params.stationId = stationId;
    return api.get("/kds/tasks/completed", { params }).then((r) => r.data);
  },
  dispatchOrder(orderId) {
    return api.post(`/kds/orders/${orderId}/dispatch`).then((r) => r.data);
  },
  startTask(taskId) {
    return api.patch(`/kds/tasks/${taskId}/start`).then((r) => r.data);
  },
  completeTask(taskId) {
    return api.patch(`/kds/tasks/${taskId}/complete`).then((r) => r.data);
  },
  reopenTask(taskId) {
    return api.patch(`/kds/tasks/${taskId}/reopen`).then((r) => r.data);
  },

  // Configurações
  getSettings() {
    return api.get("/kds/settings").then((r) => r.data);
  },
  updateSettings(data) {
    return api.put("/kds/settings", data).then((r) => r.data);
  },

  // Componentes de Combos
  getComboComponents(productId) {
    return api.get(`/products/${productId}/components`).then((r) => r.data);
  },
  manageComboComponents(productId, components) {
    return api.put(`/products/${productId}/components`, components).then((r) => r.data);
  },

  // Event Source SSE
  subscribeToEvents(onMessage, onError) {
    const eventSource = new EventSource("/api/v1/kds/events", { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (onMessage) onMessage(payload);
      } catch (err) {
        console.error("Erro ao processar evento KDS SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return eventSource;
  },
};

export default kdsService;
