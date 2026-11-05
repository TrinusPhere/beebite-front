import api from "./api";

export const cashService = {
  // Terminais de Caixa
  listRegisters() {
    return api.get("/cash/registers").then((r) => r.data);
  },
  getRegister(id) {
    return api.get(`/cash/registers/${id}`).then((r) => r.data);
  },
  createRegister(data) {
    return api.post("/cash/registers", data).then((r) => r.data);
  },
  updateRegister(id, data) {
    return api.put(`/cash/registers/${id}`, data).then((r) => r.data);
  },
  deleteRegister(id) {
    return api.delete(`/cash/registers/${id}`).then((r) => r.data);
  },

  // Sessões de Caixa
  openSession(data) {
    return api.post("/cash/sessions/open", data).then((r) => r.data);
  },
  getCurrentSession() {
    return api.get("/cash/sessions/current").then((r) => r.data);
  },
  getSessionSummary(sessionId) {
    return api.get(`/cash/sessions/${sessionId}/summary`).then((r) => r.data);
  },
  closeSession(sessionId, data) {
    return api.post(`/cash/sessions/${sessionId}/close`, data).then((r) => r.data);
  },

  // Movimentações (Sangria, Suprimento, Ajuste Compensatório)
  addMovement(sessionId, data) {
    return api.post(`/cash/sessions/${sessionId}/movements`, data).then((r) => r.data);
  },
  listMovements(sessionId) {
    return api.get(`/cash/sessions/${sessionId}/movements`).then((r) => r.data);
  },

  // Pagamentos Desacoplados
  registerPayment(data) {
    return api.post("/payments", data).then((r) => r.data);
  },
  listOrderPayments(orderId) {
    return api.get(`/payments/orders/${orderId}`).then((r) => r.data);
  },
};

export default cashService;
