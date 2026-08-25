import api from "./api";

export const productionSectorService = {
  getAll: async () => (await api.get("/production-sectors")).data,
  save: async (data) => (await api.post("/production-sectors", data)).data,
  remove: async (id) => (await api.delete(`/production-sectors/${id}`)).data,
};
