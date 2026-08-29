export const parseCurrencyInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
};

export const formatCurrencyInput = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    return "";
  }

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};
