import api from "./api";

export const printingService = {
  getPrinters: async () => (await api.get("/printers")).data,
  savePrinter: async (data) => (await api.post("/printers", data)).data,
  deletePrinter: async (id) => (await api.delete(`/printers/${id}`)).data,
  getRules: async () => (await api.get("/print-rules")).data,
  saveRule: async (data) => (await api.post("/print-rules", data)).data,
  testPrint: async (printer) =>
    (await api.post(`/printers/${printer.id}/test`)).data,
};
