import api from "./api";

export const integrationService = {
  getAll: async () => (await api.get("/integrations")).data,
  saveWhatsapp: async (data) =>
    (await api.put("/integrations/whatsapp", data)).data,
  saveIfood: async (data) => (await api.put("/integrations/ifood", data)).data,
  authorizeIfood: async (storeId, data) => {
    if (data.clientId && data.clientSecret) {
      await api.post("/ifood/credentials", {
        storeId: storeId,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        merchantId: data.merchantId || ""
      });
    }
    return (await api.post("/integrations/ifood/authorize")).data;
  },
  toggleIfoodStore: async (open) =>
    (await api.patch("/integrations/ifood/store-status", { open })).data,
  
  // Catalog Sync (requests routed to biteflow-ifood-service via proxy)
  getIfoodCatalogDiff: async (storeId) =>
    (await api.get(`/ifood/sync/compare/${storeId}`)).data,
  mergeIfoodCatalog: async (storeId, decisions) =>
    (await api.post(`/ifood/sync/merge/${storeId}`, { decisions })).data,
  importCatalogFromIfood: async (storeId) =>
    (await api.post(`/ifood/sync/import/${storeId}`)).data,
  exportCatalogToIfood: async (storeId) =>
    (await api.post(`/ifood/sync/export/${storeId}`)).data,
};
