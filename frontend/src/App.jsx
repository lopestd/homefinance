import { useCallback, useEffect, useState } from "react";
import api from "./services/api";
import { loadConfigFromApi, persistConfigToApi } from "./services/configApi";
import {
  getStoredToken,
  saveStoredToken,
  clearStoredToken
} from "./utils/appUtils";
import { AlertDialog } from "./components/Dialogs";
import { CartaoPage } from "./pages/CartaoPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DespesasPage } from "./pages/DespesasPage";
import { LoginScreen } from "./pages/LoginScreen";
import { ReceitasPage } from "./pages/ReceitasPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import "./App.css";

const getHashPage = () => {
  const hash = window.location.hash.replace("#", "");
  return hash || "dashboard";
};

function App() {
  const [authToken, setAuthToken] = useState(getStoredToken());
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [saveAlertOpen, setSaveAlertOpen] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState("");
  const [activeKey, setActiveKey] = useState(getHashPage());
  const [categorias, setCategorias] = useState([]);
  const [gastosPredefinidos, setGastosPredefinidos] = useState([]);
  const [tiposReceita, setTiposReceita] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [lancamentosCartao, setLancamentosCartao] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const clearData = useCallback(() => {
    setCategorias([]);
    setGastosPredefinidos([]);
    setTiposReceita([]);
    setReceitas([]);
    setDespesas([]);
    setOrcamentos([]);
    setCartoes([]);
    setLancamentosCartao([]);
    setIsDataLoaded(false);
  }, []);

  const applyConfigData = useCallback((data) => {
    if (!data) return;
    setCategorias(data.categorias);
    setGastosPredefinidos(data.gastosPredefinidos);
    setTiposReceita(data.tiposReceita);
    setReceitas(data.receitas);
    setDespesas(data.despesas);
    setOrcamentos(data.orcamentos);
    setCartoes(data.cartoes);
    setLancamentosCartao(data.lancamentosCartao);
  }, []);

  useEffect(() => {
    if (authToken) {
      api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [authToken]);

  const handleLogout = useCallback(async () => {
    try {
      if (authToken) {
        await api.post("/auth/logout");
      }
    } catch {
      null;
    }
    clearStoredToken();
    setAuthToken("");
    setAuthUser(null);
    setAuthError("");
    clearData();
    setAuthReady(true);
  }, [authToken, clearData]);

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

  const pages = [
    { key: "dashboard", label: "Dashboard" },
    { key: "receitas", label: "Receitas" },
    { key: "despesas", label: "Despesas" },
    { key: "cartao", label: "Cartão" },
    { key: "relatorios", label: "Relatórios" },
    { key: "configuracoes", label: "Configurações" }
  ];
  const bottomNavPages = pages.filter((page) =>
    ["dashboard", "receitas", "despesas", "cartao"].includes(page.key)
  );

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

  useEffect(() => {
    if (!authUser || !authToken) return;
    const loadData = async () => {
      try {
        const data = await loadConfigFromApi();
        applyConfigData(data);
        setIsDataLoaded(true);
      } catch (error) {
        if (error?.message === "UNAUTHORIZED") {
          handleLogout();
          return;
        }
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, [authUser, authToken, handleLogout, applyConfigData]);

  useEffect(() => {
    const onHashChange = () => setActiveKey(getHashPage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!isDataLoaded || !authToken) return;
    const persist = async () => {
      try {
        await persistConfigToApi({
          categorias,
          gastosPredefinidos,
          tiposReceita,
          receitas,
          despesas,
          orcamentos,
          cartoes,
          lancamentosCartao
        });
      } catch (error) {
        if (error?.message === "UNAUTHORIZED") {
          handleLogout();
        } else {
          setSaveAlertMessage(error?.message || "Falha ao salvar configurações.");
          setSaveAlertOpen(true);
        }
      }
    };
    persist();
  }, [categorias, gastosPredefinidos, tiposReceita, receitas, despesas, orcamentos, cartoes, lancamentosCartao, isDataLoaded, authToken, handleLogout]);

  const activePage = pages.find((p) => p.key === activeKey) || pages[0];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (window.location.hash.replace("#", "") !== activePage.key) {
      window.location.hash = activePage.key;
    }
  }, [activePage.key]);

  useEffect(() => {
    const updateZoom = () => {
      const zoom = window.devicePixelRatio || 1;
      document.documentElement.style.setProperty("--ui-zoom", zoom.toString());
    };
    updateZoom();
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleChange = (event) => {
      setIsMobile(event.matches);
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleChange = (event) => {
      if (!event.matches) {
        setIsMobileMenuOpen(false);
      }
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  if (!authReady) {
    return (
      <div className="auth-screen auth-screen--loading">
        <div className="auth-card auth-card--loading">
          <div className="auth-loading">
            <div className="auth-spinner" />
            <span>Validando sessão...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        loading={authLoading}
        errorMessage={authError}
      />
    );
  }

  const userName = authUser?.nome || "Usuário";
  const userEmail = authUser?.email || "";
  const userInitial = (userName || userEmail || "U").trim().charAt(0).toUpperCase();
  const showSkeleton = isMobile && !isDataLoaded;

  return (
    <div className={`app ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <h1>HomeFinance</h1>
          <span>Orçamento Doméstico</span>
        </div>
        <nav className="nav" aria-label="Navegação principal">
          {pages.map((page) => (
            <a
              key={page.key}
              href={`#${page.key}`}
              className={`nav-item ${page.key === activePage.key ? "active" : ""}`}
              onClick={handleNavClick}
            >
              {page.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-meta">
              <strong>{userName}</strong>
              <span>{userEmail}</span>
            </div>
          </div>
          <button type="button" className="ghost logout-button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>
      {isMobileMenuOpen && <div className="mobile-backdrop" onClick={handleNavClick} />}
      <div className="main">
        <header className="header">
          <div className="header-left">
            <button
              type="button"
              className="menu-toggle"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              ☰
            </button>
            <h2>{activePage.label}</h2>
          </div>
        </header>
        <main className="content">
          {showSkeleton && (
            <div className="mobile-skeleton">
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
            </div>
          )}
          {activeKey === "dashboard" && (
            <DashboardPage 
              receitas={receitas} 
              despesas={despesas} 
              orcamentos={orcamentos} 
            />
          )}
          {activeKey === "receitas" && (
            <ReceitasPage
              categorias={categorias}
              tiposReceita={tiposReceita}
              orcamentos={orcamentos}
              receitas={receitas}
              setReceitas={setReceitas}
            />
          )}
          {activeKey === "despesas" && (
            <DespesasPage
              categorias={categorias}
              gastosPredefinidos={gastosPredefinidos}
              orcamentos={orcamentos}
              despesas={despesas}
              setDespesas={setDespesas}
              cartoes={cartoes}
              lancamentosCartao={lancamentosCartao}
            />
          )}
          {activeKey === "cartao" && (
            <CartaoPage
              cartoes={cartoes}
              setCartoes={setCartoes}
              lancamentosCartao={lancamentosCartao}
              setLancamentosCartao={setLancamentosCartao}
              orcamentos={orcamentos}
              despesas={despesas}
              setDespesas={setDespesas}
              categorias={categorias}
              gastosPredefinidos={gastosPredefinidos}
            />
          )}
          {activeKey === "relatorios" && (
            <RelatoriosPage
              orcamentos={orcamentos}
              receitas={receitas}
              despesas={despesas}
              cartoes={cartoes}
              lancamentosCartao={lancamentosCartao}
              categorias={categorias}
            />
          )}
          {activeKey === "configuracoes" && (
            <ConfiguracoesPage
              categorias={categorias}
              setCategorias={setCategorias}
              gastosPredefinidos={gastosPredefinidos}
              setGastosPredefinidos={setGastosPredefinidos}
              tiposReceita={tiposReceita}
              setTiposReceita={setTiposReceita}
              orcamentos={orcamentos}
              setOrcamentos={setOrcamentos}
              cartoes={cartoes}
              setCartoes={setCartoes}
              despesas={despesas}
              receitas={receitas}
              lancamentosCartao={lancamentosCartao}
            />
          )}
        </main>
        <nav className="bottom-nav" aria-label="Navegação rápida">
          {bottomNavPages.map((page) => (
            <a
              key={page.key}
              href={`#${page.key}`}
              className={`bottom-nav-item ${page.key === activePage.key ? "active" : ""}`}
              onClick={handleNavClick}
            >
              {page.label}
            </a>
          ))}
        </nav>
        <AlertDialog
          open={saveAlertOpen}
          title="Não foi possível salvar"
          message={saveAlertMessage}
          variant="danger"
          primaryLabel="Ok"
          onClose={() => setSaveAlertOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
