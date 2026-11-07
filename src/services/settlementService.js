import api from "./api";

export const settlementService = {
  getSettlementReport: async (period, date) => {
    const periodLower = period ? period.toLowerCase() : "daily";
    const params = { period: periodLower };
    if (date) params.date = date;
    const response = await api.get("/settlements", { params });
    return response.data;
  },
};
