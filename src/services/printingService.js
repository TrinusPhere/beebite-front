import api from "./api";

export const printingService = {
  getPrinters: async () => (await api.get("/printers")).data,
  savePrinter: async (data) => (await api.post("/printers", data)).data,
  deletePrinter: async (id) => (await api.delete(`/printers/${id}`)).data,
  testPrint: async (printer) =>
    (await api.post(`/printers/${printer.id}/test`)).data,

  getRules: async () => (await api.get("/print-rules")).data,
  saveRule: async (data) => (await api.post("/print-rules", data)).data,

  getTemplate: async (documentType) =>
    (await api.get(`/print-templates/${documentType}`)).data,
  saveTemplate: async (documentType, data) =>
    (await api.put(`/print-templates/${documentType}`, data)).data,
  previewTemplate: async (documentType, data) =>
    (await api.post(`/print-templates/${documentType}/preview`, data)).data,

  printOrder: async (orderId, printerId, documentType) =>
    (await api.post(`/orders/${orderId}/print`, { printerId, documentType })).data,
};
