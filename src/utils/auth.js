import { reactive } from "vue";
import { authService } from "@/services/authService";

const CURRENT_USER_KEY = "biteflow_current_user";

const loadCurrentUser = () => {
  const saved = localStorage.getItem(CURRENT_USER_KEY);

  if (saved) {
    return JSON.parse(saved);
  }
  return null;
};

export const authState = reactive({
  currentUser: loadCurrentUser(),

  async login(login, password) {
    try {
      const response = await authService.login(login, password);
      if (response && response.token) {
        // A API já envia o Set-Cookie para autenticação automática do navegador.
        // Opcionalmente retém o token para integrações, mas o painel ignora.
        this.currentUser = response.user;
        localStorage.setItem(
          CURRENT_USER_KEY,
          JSON.stringify(this.currentUser),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro no login", error);
      throw error; // Lança para o componente tratar
    }
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    // Tenta invalidar o cookie HttpOnly batendo na API
    authService.logout();
  },

  hasPermission(permission) {
    if (!this.currentUser) return false;

    // A validação de sessão agora depende da API. Se uma chamada falhar com 401, o api.js cuidará do logout.
    if (this.currentUser.role === "ADMIN") return true;
    return (
      this.currentUser.permissions &&
      this.currentUser.permissions.includes(permission)
    );
  },
});
