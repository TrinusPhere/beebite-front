import axios from "axios";
import { authState } from "@/utils/auth";
import router from "@/router";

const rawBaseUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "";
const baseURL = `${rawBaseUrl}/api/v1`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptador de requisição — suporta Cookie HttpOnly E Authorization Header Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("beebite_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptador de resposta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Evita loop infinito se o próprio /logout der 401
    const isLogoutRequest =
      error.config &&
      error.config.url &&
      error.config.url.includes("/auth/logout");

    if (!isLogoutRequest) {
      const isUnauthorized =
        error.response &&
        (error.response.status === 401 || error.response.status === 403);
      const isCorsAuthError =
        !error.response &&
        error.message === "Network Error" &&
        authState.currentUser;

      if (isUnauthorized || isCorsAuthError) {
        // Token expirado ou inválido (ou bloqueado por CORS devido a 401 do Quarkus)
        authState.logout();
        router.push({ name: "login" });
      }
    }
    return Promise.reject(error);
  },
);

export default api;
