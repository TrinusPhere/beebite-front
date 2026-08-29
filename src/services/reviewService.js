import api from "./api";
export const reviewService = {getOrderInfo: async (orderId) => (await api.get(`/public/order-reviews/${orderId}`)).data};
