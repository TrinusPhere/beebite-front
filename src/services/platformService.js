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
  addStoreToTenant: async (tenantId, payload) => {
    const response = await api.post(`/platform/tenants/${tenantId}/stores`, payload);
    return response.data;
  },
  changeTenantStatus: async (tenantId, status) => {
    await api.patch(`/platform/tenants/${tenantId}/status`, { status });
  },
  listContracts: async () => {
    const response = await api.get("/platform/contracts");
    return response.data;
  },
  listInvoices: async (params = {}) => {
    const response = await api.get("/platform/invoices", { params });
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
};

