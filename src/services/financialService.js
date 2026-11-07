import api from "./api";

export const financialService = {
  getSalesSummary: async (startDate, endDate) => {
    const response = await api.get(
      `/financial/summary?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  },

  getSalesByProduct: async (startDate, endDate) => {
    const response = await api.get(
      `/financial/sales-by-product?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  },

  getPaymentMethods: async (startDate, endDate) => {
    const response = await api.get(
      `/financial/payment-methods?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  },

  getDashboard: async (period = "daily", startDate = null, endDate = null) => {
    const params = { period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get("/dashboard", { params });
    return response.data;
  },
};

export const cmvService = {
  getGeneralCmv: async (data) => {
    // data: { startDate, endDate, initialStock, purchasesInPeriod, finalStock }
    const response = await api.post("/cmv/general", data);
    return response.data;
  },

  getProductCmv: async (productId) => {
    const response = await api.get(`/cmv/product/${productId}`);
    return response.data;
  },
};
