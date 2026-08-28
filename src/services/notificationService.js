import { reactive } from "vue";

const defaultState = {
  show: false,
  type: "info",
  title: "",
  message: "",
  confirmation: false,
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
};

let confirmationResolver = null;

export const notificationState = reactive({ ...defaultState });

const inferType = (message) => {
  const text = String(message || "").toLowerCase();
  if (text.includes("sucesso") || text.includes("cadastrado") || text.includes("atualizado")) {
    return "success";
  }
  if (text.includes("erro") || text.includes("não foi possível") || text.includes("inválido")) {
    return "error";
  }
  return "info";
};

const defaultTitle = (type) => {
  if (type === "success") return "Tudo certo";
  if (type === "error") return "Atenção";
  return "Aviso";
};

export const notify = ({ message, title, type } = {}) => {
  const resolvedType = type || inferType(message);
  notificationState.type = resolvedType;
  notificationState.title = title || defaultTitle(resolvedType);
  notificationState.message = String(message || "");
  notificationState.confirmation = false;
  notificationState.show = true;
};

export const closeNotification = () => {
  if (confirmationResolver) {
    confirmationResolver(false);
    confirmationResolver = null;
  }
  notificationState.show = false;
};

export const confirmAction = ({
  message,
  title = "Confirmar ação",
  type = "warning",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
} = {}) =>
  new Promise((resolve) => {
    if (confirmationResolver) confirmationResolver(false);
    confirmationResolver = resolve;
    Object.assign(notificationState, {
      show: true,
      type,
      title,
      message: String(message || ""),
      confirmation: true,
      confirmLabel,
      cancelLabel,
    });
  });

export const resolveConfirmation = (confirmed) => {
  if (confirmationResolver) {
    confirmationResolver(Boolean(confirmed));
    confirmationResolver = null;
  }
  notificationState.show = false;
};

export const installAlertModal = () => {
  window.alert = (message) => {
    notify({ message });
  };
};
