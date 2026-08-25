import api from "./api";

export const integrationService = {
  getAll: async () => (await api.get("/integrations")).data,
  saveWhatsapp: async (data) =>
    (await api.put("/integrations/whatsapp", data)).data,
  saveIfood: async (data) => (await api.put("/integrations/ifood", data)).data,
  authorizeIfood: async () =>
    (await api.post("/integrations/ifood/authorize")).data,
  toggleIfoodStore: async (open) =>
    (await api.patch("/integrations/ifood/store-status", { open })).data,
};
