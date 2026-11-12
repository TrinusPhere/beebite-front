import { reactive } from "vue";
import { authService } from "@/services/authService";

const CURRENT_USER_KEY = "beebite_current_user";
const ACCESSIBLE_STORES_KEY = "beebite_accessible_stores";

const loadCurrentUser = () => {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

const loadAccessibleStores = () => {
  const saved = localStorage.getItem(ACCESSIBLE_STORES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

export const authState = reactive({
  currentUser: loadCurrentUser(),
  accessibleStores: loadAccessibleStores(),
  switchingStore: false,

  async login(login, password) {
    try {
      const response = await authService.login(login, password);
      if (response && response.token) {
        this.currentUser = response.user;
        this.accessibleStores = Array.isArray(response.accessibleStores)
          ? response.accessibleStores
          : [];
        localStorage.setItem(
          CURRENT_USER_KEY,
          JSON.stringify(this.currentUser),
        );
        localStorage.setItem(
          ACCESSIBLE_STORES_KEY,
          JSON.stringify(this.accessibleStores),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro no login", error);
      throw error;
    }
  },

  async refreshAccessibleStores() {
    if (!this.currentUser) return [];
    try {
      const stores = await authService.getAccessibleStores();
      if (Array.isArray(stores)) {
        this.accessibleStores = stores;
        localStorage.setItem(ACCESSIBLE_STORES_KEY, JSON.stringify(stores));
      }
      return this.accessibleStores;
    } catch (error) {
      console.warn("Não foi possível carregar lojas vinculadas", error);
      return this.accessibleStores;
    }
  },

  async switchStore(targetStoreId) {
    if (!targetStoreId || this.switchingStore) return false;
    this.switchingStore = true;
    try {
      const response = await authService.switchStore(targetStoreId);
      if (response && response.user) {
        this.currentUser = response.user;
        this.accessibleStores = Array.isArray(response.accessibleStores)
          ? response.accessibleStores
          : this.accessibleStores;
        localStorage.setItem(
          CURRENT_USER_KEY,
          JSON.stringify(this.currentUser),
        );
        localStorage.setItem(
          ACCESSIBLE_STORES_KEY,
          JSON.stringify(this.accessibleStores),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao alternar de loja", error);
      throw error;
    } finally {
      this.switchingStore = false;
    }
  },

  logout() {
    this.currentUser = null;
    this.accessibleStores = [];
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(ACCESSIBLE_STORES_KEY);
    authService.logout();
  },

  hasPermission(permission) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === "ADMIN") return true;
    return (
      this.currentUser.permissions &&
      this.currentUser.permissions.includes(permission)
    );
  },
});
