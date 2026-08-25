import api from "./api";

export const storeService = {
  getStore: async () => {
    const response = await api.get("/store");
    return response.data;
  },
  updateStore: async (storeData) => {
    const response = await api.put("/store", storeData);
    return response.data;
  },
};
