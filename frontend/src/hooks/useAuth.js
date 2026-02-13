import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { clearStoredToken, getStoredToken, saveStoredToken } from "../utils/appUtils";

const useAuth = ({ onLogoutCleanup } = {}) => {
  const [authToken, setAuthToken] = useState(getStoredToken());
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (authToken) {
      api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [authToken]);

  const clearAuth = useCallback(() => {
    clearStoredToken();
    setAuthToken("");
    setAuthUser(null);
    setAuthError("");
    onLogoutCleanup?.();
    setAuthReady(true);
  }, [onLogoutCleanup]);

  const handleLogout = useCallback(async () => {
    try {
      if (authToken) {
        await api.post("/auth/logout");
      }
    } catch {
      null;
    }
    clearAuth();
  }, [authToken, clearAuth]);

  const handleLogin = useCallback(async ({ email, senha, lembrar }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await api.post("/auth/login", {
        email,
        senha,
        lembrar: Boolean(lembrar)
      });
      const data = response.data;
      if (data?.token) {
        saveStoredToken(data.token);
        setAuthToken(data.token);
        setAuthUser(data.usuario || null);
        setAuthReady(true);
        return { ok: true };
      }
      setAuthError("Não foi possível autenticar.");
      return { erro: "Não foi possível autenticar." };
    } catch (error) {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.mensagem;
      const message =
        status === 423
          ? serverMessage || "Conta temporariamente bloqueada."
          : status === 401
            ? "Email ou senha incorretos."
            : "Falha ao tentar entrar.";
      setAuthError(message);
      return { erro: message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const verifyAuth = async () => {
      setAuthReady(false);
      if (!authToken) {
        setAuthReady(true);
        return;
      }
      try {
        const response = await api.get("/auth/verificar");
        if (!active) return;
        setAuthUser(response.data?.usuario || null);
        setAuthReady(true);
      } catch {
        if (!active) return;
        clearStoredToken();
        setAuthToken("");
        setAuthUser(null);
        setAuthReady(true);
      }
    };
    verifyAuth();
    return () => {
      active = false;
    };
  }, [authToken]);

  return {
    authToken,
    authUser,
    authReady,
    authLoading,
    authError,
    handleLogin,
    handleLogout
  };
};

export default useAuth;
