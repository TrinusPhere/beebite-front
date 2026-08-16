import api from './api';

export default {
  async getCategories() {
    const res = await api.get('/categories');
    return res.data;
  },
  async getCategory(id) {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
  async createCategory(categoryData) {
    const res = await api.post('/categories', categoryData);
    return res.data;
  },
  async updateCategory(id, categoryData) {
    const res = await api.put(`/categories/${id}`, categoryData);
    return res.data;
  },
  async deleteCategory(id) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
  async bulkApplyModifiers(id) {
    const res = await api.post(`/categories/${id}/bulk-apply-modifiers`);
    return res.data;
  }
};
