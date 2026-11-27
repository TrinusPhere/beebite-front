import api from "./api";

export const edgeSyncService = {
  getHealth: async () => (await api.get("/sync/health")).data,
  listFailed: async (page = 0, size = 20) =>
    (await api.get("/sync/failed", { params: { page, size } })).data,
  retryFailed: async (eventId) =>
    (await api.post(`/sync/failed/${eventId}/retry`)).data,
  triggerReconciliation: async (from, to) =>
    (await api.post("/sync/reconcile", { from, to })).data,
};

