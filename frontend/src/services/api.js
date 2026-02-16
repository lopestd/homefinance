import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Interceptor para capturar erros 401 globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Limpar token e redirecionar para login
      localStorage.removeItem("authToken");
      window.location.hash = "#login";
      window.location.reload(); // Recarregar a página para login
    }
    return Promise.reject(error);
  }
);

export default api;
