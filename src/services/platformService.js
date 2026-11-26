import api from "./api";

export const platformService = {
  getOverview: async () => {
    const response = await api.get("/platform/overview");
    return response.data;
  },
  listTenants: async () => {
    const response = await api.get("/platform/tenants");
    return response.data;
  },
  onboardClient: async (payload) => {
    const response = await api.post("/platform/tenants/onboard", payload);
    return response.data;
  },
  updateTenant: async (tenantId, payload) => {
    await api.put(`/platform/tenants/${tenantId}`, payload);
  },
  addStoreToTenant: async (tenantId, payload) => {
    const response = await api.post(`/platform/tenants/${tenantId}/stores`, payload);
    return response.data;
  },
  listTenantCatalogs: async (tenantId) => {
    const response = await api.get(`/platform/tenants/${tenantId}/catalogs`);
    return response.data;
  },
  updateStore: async (storeId, payload) => {
    const response = await api.put(`/platform/stores/${storeId}`, payload);
    return response.data;
  },
  regenerateEdgeToken: async (storeId) => {
    const response = await api.post(`/platform/stores/${storeId}/regenerate-edge-token`);
    return response.data;
  },
  changeTenantStatus: async (tenantId, status) => {
    await api.patch(`/platform/tenants/${tenantId}/status`, { status });
  },
  listContracts: async () => {
    const response = await api.get("/platform/contracts");
    return response.data;
  },
  updateContract: async (contractId, payload) => {
    const response = await api.put(`/platform/contracts/${contractId}`, payload);
    return response.data;
  },
  listInvoices: async (params = {}) => {
    const response = await api.get("/platform/invoices", { params });
    return response.data;
  },
  createInvoice: async (payload) => {
    const response = await api.post("/platform/invoices", payload);
    return response.data;
  },
  generateMonthlyInvoices: async (referenceMonth) => {
    const response = await api.post(`/platform/invoices/generate-month/${referenceMonth}`);
    return response.data;
  },
  markInvoicePaid: async (invoiceId, payload) => {
    const response = await api.post(`/platform/invoices/${invoiceId}/pay`, payload);
    return response.data;
  },
  cancelInvoice: async (invoiceId, notes) => {
    const response = await api.patch(`/platform/invoices/${invoiceId}/cancel`, { notes });
    return response.data;
  },
};
