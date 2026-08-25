import api from "./api";

export const chatService = {
  list: async () => (await api.get("/conversations")).data,
  getOrCreate: async (payload) =>
    (await api.post("/conversations/resolve", payload)).data,
  send: async (id, content) =>
    (await api.post(`/conversations/${id}/messages`, { content })).data,
  update: async (id, patch) =>
    (await api.patch(`/conversations/${id}`, patch)).data,
};
