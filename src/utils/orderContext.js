export const OPERATIONS = {
  SALAO: "SALAO",
  DELIVERY: "DELIVERY",
};

export const CHANNELS = {
  PDV: "PDV",
  CARDAPIO_PROPRIO: "CARDAPIO_PROPRIO",
  WHATSAPP: "WHATSAPP",
  IFOOD: "IFOOD",
  BRENDI: "BRENDI",
  RAPPI: "RAPPI",
  OUTRO: "OUTRO",
};

export const SERVICE_TYPES = {
  CONSUMO_LOCAL: "CONSUMO_LOCAL",
  MESA: "MESA",
  COMANDA: "COMANDA",
  ENTREGA: "ENTREGA",
  RETIRADA: "RETIRADA",
};

export const SOURCES = {
  PDV_CAIXA: "PDV_CAIXA",
  WEB: "WEB",
  ATENDIMENTO_WHATSAPP: "ATENDIMENTO_WHATSAPP",
  INTEGRACAO_IFOOD: "INTEGRACAO_IFOOD",
  INTEGRACAO_RAPPI: "INTEGRACAO_RAPPI",
  MANUAL: "MANUAL",
};

export const OPERATION_OPTIONS = [
  { value: OPERATIONS.SALAO, label: "Salão" },
  { value: OPERATIONS.DELIVERY, label: "Delivery" },
];

export const CHANNEL_OPTIONS = [
  { value: CHANNELS.PDV, label: "PDV" },
  { value: CHANNELS.CARDAPIO_PROPRIO, label: "Cardápio próprio" },
  { value: CHANNELS.WHATSAPP, label: "WhatsApp" },
  { value: CHANNELS.IFOOD, label: "iFood" },
  { value: CHANNELS.BRENDI, label: "Brendi" },
  { value: CHANNELS.RAPPI, label: "Rappi" },
  { value: CHANNELS.OUTRO, label: "Outro" },
];

export const SERVICE_OPTIONS_BY_OPERATION = {
  [OPERATIONS.SALAO]: [
    { value: SERVICE_TYPES.CONSUMO_LOCAL, label: "Consumo no local" },
    { value: SERVICE_TYPES.MESA, label: "Mesa" },
    { value: SERVICE_TYPES.COMANDA, label: "Comanda" },
  ],
  [OPERATIONS.DELIVERY]: [
    { value: SERVICE_TYPES.ENTREGA, label: "Entrega" },
    { value: SERVICE_TYPES.RETIRADA, label: "Retirada no local" },
  ],
};

export const inferLegacyType = ({ operation, serviceType }) => {
  if (operation === OPERATIONS.DELIVERY) return "DELIVERY";
  if ([SERVICE_TYPES.ENTREGA, SERVICE_TYPES.RETIRADA].includes(serviceType))
    return "DELIVERY";
  return "BALCAO";
};

export const inferSource = (channel) => {
  switch (channel) {
    case CHANNELS.CARDAPIO_PROPRIO:
      return SOURCES.WEB;
    case CHANNELS.WHATSAPP:
      return SOURCES.ATENDIMENTO_WHATSAPP;
    case CHANNELS.IFOOD:
      return SOURCES.INTEGRACAO_IFOOD;
    case CHANNELS.RAPPI:
      return SOURCES.INTEGRACAO_RAPPI;
    case CHANNELS.PDV:
      return SOURCES.PDV_CAIXA;
    default:
      return SOURCES.MANUAL;
  }
};

export const normalizeOrderContext = (order = {}) => {
  const legacyType = String(order.type || "").toUpperCase();
  const operation =
    String(order.operation || order.operationCode || "").toUpperCase() ||
    (legacyType === "DELIVERY" ? OPERATIONS.DELIVERY : OPERATIONS.SALAO);

  let serviceType = String(order.serviceType || "").toUpperCase();
  if (!serviceType) {
    serviceType =
      operation === OPERATIONS.DELIVERY
        ? SERVICE_TYPES.ENTREGA
        : SERVICE_TYPES.CONSUMO_LOCAL;
  }

  const channel =
    String(order.channel || "").toUpperCase() ||
    (operation === OPERATIONS.DELIVERY && order.source === "INTEGRACAO_IFOOD"
      ? CHANNELS.IFOOD
      : CHANNELS.PDV);

  const source =
    String(order.source || "").toUpperCase() || inferSource(channel);

  return { operation, channel, serviceType, source };
};

export const isDeliveryOrder = (order) =>
  normalizeOrderContext(order).operation === OPERATIONS.DELIVERY;

export const contextLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
