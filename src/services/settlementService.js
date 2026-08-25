import api from "./api";

export const settlementService = {
  getSettlementReport: async (period) => {
    // Backend API expects ?period=daily|weekly|monthly
    const periodLower = period ? period.toLowerCase() : "daily";
    const response = await api.get(`/settlements?period=${periodLower}`);
    return response.data;
  },
};
