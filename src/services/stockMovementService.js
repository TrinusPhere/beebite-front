import api from "./api";

export const stockMovementService = {
  getAll: async () => {
    const response = await api.get("/stock-movements");
    return response.data.content || response.data;
  },
  create: async (data) => (await api.post("/stock-movements", data)).data,
};
