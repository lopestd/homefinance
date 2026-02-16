import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { clearStoredToken, getStoredToken, saveStoredToken } from "../utils/appUtils";

const useAuth = ({ onLogoutCleanup } = {}) => {
  const [authToken, setAuthToken] = useState(getStoredToken());
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Configurações de timeout (30 minutos de sessão, 2 minutos de aviso)
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const WARNING_TIMEOUT = 2 * 60 * 1000;

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

  // Timer de inatividade
  useEffect(() => {
    if (!authToken) return;

    let inactivityTimer;
    let warningTimer;
    let countdownTimer;

    const resetTimers = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearTimeout(countdownTimer);
      setShowSessionWarning(false);
      setTimeRemaining(SESSION_TIMEOUT);

      // Aviso antes de expirar
      warningTimer = setTimeout(() => {
        setShowSessionWarning(true);
        setTimeRemaining(WARNING_TIMEOUT);

        // Countdown
        countdownTimer = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1000) {
              clearInterval(countdownTimer);
              handleLogout();
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
      }, SESSION_TIMEOUT - WARNING_TIMEOUT);

      // Expiração da sessão
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, SESSION_TIMEOUT);
    };

    // Eventos que resetam o timer
    const activityEvents = [
      "mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"
    ];

    const handleActivity = () => {
      resetTimers();
    };

    // Iniciar timer inicial
    resetTimers();

    // Adicionar listeners de atividade
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearTimeout(countdownTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [authToken, handleLogout]);

  return {
    authToken,
    authUser,
    authReady,
    authLoading,
    authError,
    handleLogin,
    handleLogout,
    showSessionWarning,
    timeRemaining
  };
};

export default useAuth;
