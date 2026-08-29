import api from "./api";

export const ingredientService = {
  getAll: async () => {
    const response = await api.get("/ingredients");
    return response.data.content || response.data;
  },
  getById: async (id) => (await api.get(`/ingredients/${id}`)).data,
  create: async (data) => (await api.post("/ingredients", data)).data,
  update: async (id, data) => (await api.put(`/ingredients/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/ingredients/${id}`)).data,
};
