import api from "./api";

export const digitalMenuService = {
  getMenu: async (storeName) =>
    (await api.get(`/public/stores/${encodeURIComponent(storeName)}/menu`))
      .data,

  createOrder: async (storeName, data) =>
    (
      await api.post(
        `/public/stores/${encodeURIComponent(storeName)}/orders`,
        data,
      )
    ).data,
};
