import api from "./api";

export const authService = {
  login: async (login, password) => {
    const response = await api.post("/auth/login", { login, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  updateProfile: async (payload) => {
    const response = await api.put("/auth/me", payload);
    return response.data;
  },
  getAccessibleStores: async () => {
    const response = await api.get("/auth/stores");
    return response.data;
  },
  switchStore: async (storeId) => {
    const response = await api.post(`/auth/switch-store/${storeId}`);
    return response.data;
  },
  grantStoreAccess: async (payload) => {
    const response = await api.post("/auth/store-access", payload);
    return response.data;
  },
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("Falha no logout da API", e);
    }
  },
};
