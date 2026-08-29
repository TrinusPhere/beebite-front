import api from "./api";

export const customerService = {
  getAll: async (search = "") => {
    const response = await api.get("/customers", {
      params: { search },
    });
    return response.data.content || response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/customers", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};
