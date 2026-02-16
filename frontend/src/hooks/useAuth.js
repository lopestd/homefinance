import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { clearStoredToken, getStoredToken, saveStoredToken } from "../utils/appUtils";

const getTokenExpiration = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload.exp * 1000; // Converter para milissegundos
  } catch {
    return null;
  }
};

const useAuth = ({ onLogoutCleanup } = {}) => {
  const [authToken, setAuthToken] = useState(getStoredToken());
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tokenExpirationTime, setTokenExpirationTime] = useState(null);
  const [tokenIssuedTime, setTokenIssuedTime] = useState(null);
  const [LastApiRequestTime, setLastApiRequestTime] = useState(Date.now());
  const [isUserActive, setIsUserActive] = useState(false);

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
      // Ignorar erros ao fazer logout
    }
    clearAuth();
    setTokenExpirationTime(null);
    setTokenIssuedTime(null);
    setLastApiRequestTime(Date.now());
    setIsUserActive(false);
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
        
        // Extrair data de expiração e criação do token JWT
        const expiration = getTokenExpiration(data.token);
        setTokenExpirationTime(expiration);
        setTokenIssuedTime(Date.now());
        setLastApiRequestTime(Date.now());
        
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

  // Renovação inteligente do token com verificação de atividade
  useEffect(() => {
    if (!authToken || !tokenExpirationTime || !tokenIssuedTime) return;

    const now = Date.now();
    const tokenDuration = tokenExpirationTime - tokenIssuedTime;
    const renewalThreshold = tokenDuration * 0.9; // 90% do tempo do token
    const timeSinceIssued = now - tokenIssuedTime;

    // Função para renovar a sessão
    const renewSession = async () => {
      try {
        // Fazer requisição para renovar a sessão
        await api.get("/auth/verificar");
        // A sessão foi renovada pelo backend
        setLastApiRequestTime(Date.now());
      } catch {
        // Se a sessão expirou, o interceptor vai tratar o erro 401
      }
    };

    // Verificar se transcorreu 90% do tempo do token
    if (timeSinceIssued >= renewalThreshold) {
      // Se usuário estiver ativo, fazer renovação
      if (isUserActive) {
        // Fazer renovação imediatamente
        renewSession();
        
        // Configurar timer para verificar novamente após 10% do tempo restante
        const remainingTime = tokenDuration - timeSinceIssued;
        const checkTimer = setTimeout(() => {
          if (isUserActive) {
            renewSession();
          }
        }, remainingTime * 0.5); // Verificar novamente após metade do tempo restante
        
        return () => clearTimeout(checkTimer);
      }
      // Se usuário não estiver ativo, deixar a sessão expirar
    } else {
      // Configurar timer para verificar após 90% do tempo do token
      const timeUntilRenewal = renewalThreshold - timeSinceIssued;
      const checkTimer = setTimeout(() => {
        if (isUserActive) {
          renewSession();
        }
      }, timeUntilRenewal);
      
      return () => clearTimeout(checkTimer);
    }
  }, [authToken, tokenExpirationTime, tokenIssuedTime, isUserActive]);

  // Monitorar atividade do usuário
  useEffect(() => {
    if (!authToken) return;

    const activityEvents = [
      "mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"
    ];

    const handleActivity = () => {
      setIsUserActive(true);
      
      // Resetar flag de atividade após 30 segundos de inatividade
      setTimeout(() => {
        setIsUserActive(false);
      }, 30 * 1000);
    };

    // Adicionar listeners de atividade
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
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
