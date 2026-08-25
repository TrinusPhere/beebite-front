import api from "./api";

export const productService = {
  getAll: async (category, page = 0, size = 20) => {
    let url = `/products?page=${page}&size=${size}`;
    if (category) url += `&categoryId=${encodeURIComponent(category)}`;
    return (await api.get(url)).data;
  },
  getById: async (id) => (await api.get(`/products/${id}`)).data,
  create: async (data) => (await api.post("/products", data)).data,
  update: async (id, data) => (await api.put(`/products/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/products/${id}`)).data,
  updateRemovableItems: async (id, ingredientIds) =>
    (await api.put(`/products/${id}/removable-items`, ingredientIds)).data,
  updateModifierGroups: async (id, groupIds) =>
    (await api.put(`/products/${id}/modifier-groups`, groupIds)).data,
  getCategories: async () => (await api.get("/products/categories")).data,
};
