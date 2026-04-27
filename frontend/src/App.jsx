import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadConfigFromApi } from "./services/configApi";
import useAuth from "./hooks/useAuth";
import useCartao from "./hooks/useCartao";
import useDespesas from "./hooks/useDespesas";
import useReceitas from "./hooks/useReceitas";
import Modal from "./components/Modal";
import { CartaoPage } from "./pages/CartaoPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DespesasPage } from "./pages/DespesasPage";
import { LoginScreen } from "./pages/LoginScreen";
import { ReceitasPage } from "./pages/ReceitasPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { formatCurrency, MONTHS_ORDER } from "./utils/appUtils";
import "./styles/index.css";

const getHashPage = () => {
  const hash = window.location.hash.replace("#", "");
  return hash || "dashboard";
};

const resolveGlobalOrcamentoId = (orcamentos = [], preferredId = "") => {
  if (!Array.isArray(orcamentos) || orcamentos.length === 0) return "";

  const preferred = preferredId === null || preferredId === undefined ? "" : String(preferredId);
  if (preferred && orcamentos.some((orcamento) => String(orcamento.id) === preferred)) {
    return orcamentos.find((orcamento) => String(orcamento.id) === preferred)?.id ?? "";
  }

  const currentYear = String(new Date().getFullYear());
  const currentYearOrcamento = orcamentos.find((orcamento) => String(orcamento.label) === currentYear);
  if (currentYearOrcamento) return currentYearOrcamento.id;

  return orcamentos[0]?.id ?? "";
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const MONTH_INDEX_MAP = new Map(
  MONTHS_ORDER.map((mes, index) => [normalizeText(mes), index])
);

const getMonthIndex = (mes) => {
  const index = MONTH_INDEX_MAP.get(normalizeText(mes));
  return Number.isInteger(index) ? index : -1;
};

const parseOrcamentoYear = (label) => {
  const match = String(label || "").match(/\d{4}/);
  return match ? Number(match[0]) : NaN;
};

const getPreviousMonthsWindow = (count = 2, referenceDate = new Date()) => {
  const months = [];
  for (let offset = count; offset >= 1; offset -= 1) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    months.push({
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      monthName: MONTHS_ORDER[date.getMonth()]
    });
  }
  return months;
};

const getItemMonths = (item) => {
  const rawMonths = [];
  if (item?.mes) rawMonths.push(item.mes);
  if (Array.isArray(item?.meses)) rawMonths.push(...item.meses);

  const unique = new Set();
  rawMonths.forEach((mes) => {
    const monthIndex = getMonthIndex(mes);
    if (monthIndex >= 0) unique.add(MONTHS_ORDER[monthIndex]);
  });
  return Array.from(unique);
};

const toCurrencyNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
};

const formatPendingDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

function App() {
  const [activeKey, setActiveKey] = useState(getHashPage());
  const [categorias, setCategorias] = useState([]);
  const [gastosPredefinidos, setGastosPredefinidos] = useState([]);
  const [tiposReceita, setTiposReceita] = useState([]);
  const { receitas, setReceitas } = useReceitas([]);
  const { despesas, setDespesas } = useDespesas([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState("");
  const { cartoes, setCartoes, lancamentosCartao, setLancamentosCartao } = useCartao([], []);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [pendingModalShown, setPendingModalShown] = useState(false);
  const contentRef = useRef(null);

  const clearData = useCallback(() => {
    setCategorias([]);
    setGastosPredefinidos([]);
    setTiposReceita([]);
    setReceitas([]);
    setDespesas([]);
    setOrcamentos([]);
    setSelectedOrcamentoId("");
    setCartoes([]);
    setLancamentosCartao([]);
    setIsDataLoaded(false);
    setIsPendingModalOpen(false);
    setPendingModalShown(false);
  }, [
    setCategorias,
    setGastosPredefinidos,
    setTiposReceita,
    setReceitas,
    setDespesas,
    setOrcamentos,
    setSelectedOrcamentoId,
    setCartoes,
    setLancamentosCartao,
    setIsDataLoaded,
    setIsPendingModalOpen,
    setPendingModalShown
  ]);

  const {
    authToken,
    authUser,
    authReady,
    authLoading,
    authError,
    handleLogin,
    handleLogout
  } = useAuth({ onLogoutCleanup: clearData });

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
  }, [
    setCategorias,
    setGastosPredefinidos,
    setTiposReceita,
    setReceitas,
    setDespesas,
    setOrcamentos,
    setCartoes,
    setLancamentosCartao
  ]);

  const reloadConfigData = useCallback(async () => {
    try {
      const data = await loadConfigFromApi();
      applyConfigData(data);
      return true;
    } catch {
      return false;
    }
  }, [applyConfigData]);

  const pages = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "receitas", label: "💰 Receitas" },
    { key: "despesas", label: "💸 Despesas" },
    { key: "cartao", label: "💳 Cartões" },
    { key: "relatorios", label: "📋 Relatórios" },
    { key: "configuracoes", label: "⚙️ Configurações" }
  ];
  const bottomNavPages = pages.filter((page) =>
    ["dashboard", "receitas", "despesas", "cartao"].includes(page.key)
  );

  useEffect(() => {
    setSelectedOrcamentoId((previous) => resolveGlobalOrcamentoId(orcamentos, previous));
  }, [orcamentos]);

  useEffect(() => {
    if (!authUser || !authToken) return;
    const loadData = async () => {
      await reloadConfigData();
      setIsDataLoaded(true);
    };
    loadData();
  }, [authUser, authToken, reloadConfigData]);

  useEffect(() => {
    const onHashChange = () => {
      setActiveKey(getHashPage());
      if (isDataLoaded && authUser && authToken) {
        reloadConfigData();
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [isDataLoaded, authUser, authToken, reloadConfigData]);

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

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return undefined;
    const contentEl = contentRef.current;
    if (!contentEl) return undefined;

    const resetScroll = () => {
      contentEl.scrollTop = 0;
      contentEl.scrollLeft = 0;
      window.scrollTo(0, 0);
    };

    resetScroll();
    const rafId = window.requestAnimationFrame(resetScroll);
    const timeoutId = window.setTimeout(resetScroll, 120);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [isMobile, activeKey, isDataLoaded]);

  const pendingOpenData = useMemo(() => {
    const previousMonths = getPreviousMonthsWindow(2, new Date());
    const targetMonthKeys = new Set(previousMonths.map((item) => `${item.year}-${item.monthIndex}`));

    const orcamentoYearById = new Map();
    orcamentos.forEach((orcamento) => {
      const year = parseOrcamentoYear(orcamento?.label);
      if (Number.isInteger(year)) {
        orcamentoYearById.set(String(orcamento.id), year);
      }
    });

    const items = [];
    const dedupeKeys = new Set();

    const appendPendingItems = (entries, tipo) => {
      entries.forEach((entry) => {
        const status = String(entry?.status || "").trim();
        const isClosed = tipo === "RECEITA" ? status === "Recebido" : status === "Pago";
        if (isClosed) return;

        const year = orcamentoYearById.get(String(entry?.orcamentoId));
        if (!Number.isInteger(year)) return;

        const months = getItemMonths(entry);
        if (months.length === 0) return;

        months.forEach((mes) => {
          const monthIndex = getMonthIndex(mes);
          if (monthIndex < 0) return;
          if (!targetMonthKeys.has(`${year}-${monthIndex}`)) return;

          const dedupeKey = `${tipo}-${entry?.id || "sem-id"}-${year}-${monthIndex}`;
          if (dedupeKeys.has(dedupeKey)) return;
          dedupeKeys.add(dedupeKey);

          items.push({
            key: dedupeKey,
            tipo,
            tipoLabel: tipo === "RECEITA" ? "Receita" : "Despesa",
            ano: year,
            monthIndex,
            mes: MONTHS_ORDER[monthIndex],
            data: entry?.data || "",
            categoria: entry?.categoria || "Sem categoria",
            descricao: entry?.descricao || "Sem descricao",
            complemento: entry?.complemento || "",
            status: status || "-",
            valor: toCurrencyNumber(entry?.valor)
          });
        });
      });
    };

    appendPendingItems(receitas, "RECEITA");
    appendPendingItems(despesas, "DESPESA");

    items.sort((a, b) =>
      a.ano - b.ano ||
      a.monthIndex - b.monthIndex ||
      String(a.data || "").localeCompare(String(b.data || "")) ||
      String(a.descricao || "").localeCompare(String(b.descricao || ""))
    );

    const totalReceitas = items
      .filter((item) => item.tipo === "RECEITA")
      .reduce((acc, item) => acc + item.valor, 0);
    const totalDespesas = items
      .filter((item) => item.tipo === "DESPESA")
      .reduce((acc, item) => acc + item.valor, 0);

    return {
      items,
      totalReceitas,
      totalDespesas,
      referenceLabel: previousMonths.map((item) => `${item.monthName}/${item.year}`).join(" e ")
    };
  }, [receitas, despesas, orcamentos]);

  useEffect(() => {
    if (!authUser || !isDataLoaded || pendingModalShown) return;
    setPendingModalShown(true);
    if (pendingOpenData.items.length > 0) {
      setIsPendingModalOpen(true);
    }
  }, [authUser, isDataLoaded, pendingModalShown, pendingOpenData.items.length]);

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
        <main className="content" ref={contentRef}>
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
              selectedOrcamentoId={selectedOrcamentoId}
              setSelectedOrcamentoId={setSelectedOrcamentoId}
              categorias={categorias}
              cartoes={cartoes}
              lancamentosCartao={lancamentosCartao}
            />
          )}
          {activeKey === "receitas" && (
            <ReceitasPage
              categorias={categorias}
              tiposReceita={tiposReceita}
              orcamentos={orcamentos}
              selectedOrcamentoId={selectedOrcamentoId}
              setSelectedOrcamentoId={setSelectedOrcamentoId}
              receitas={receitas}
              setReceitas={setReceitas}
            />
          )}
          {activeKey === "despesas" && (
            <DespesasPage
              categorias={categorias}
              setCategorias={setCategorias}
              gastosPredefinidos={gastosPredefinidos}
              orcamentos={orcamentos}
              selectedOrcamentoId={selectedOrcamentoId}
              setSelectedOrcamentoId={setSelectedOrcamentoId}
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
              selectedOrcamentoId={selectedOrcamentoId}
              setSelectedOrcamentoId={setSelectedOrcamentoId}
              despesas={despesas}
              setDespesas={setDespesas}
              categorias={categorias}
              setCategorias={setCategorias}
              gastosPredefinidos={gastosPredefinidos}
            />
          )}
          {activeKey === "relatorios" && (
            <RelatoriosPage
              orcamentos={orcamentos}
              selectedOrcamentoId={selectedOrcamentoId}
              setSelectedOrcamentoId={setSelectedOrcamentoId}
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

        <Modal
          open={isPendingModalOpen}
          title="Pendências dos 2 meses anteriores"
          onClose={() => setIsPendingModalOpen(false)}
          className="pending-open-modal"
          footerClassName="pending-open-modal__footer"
          footer={(
            <button
              type="button"
              className="pending-open-modal__ok-btn"
              onClick={() => setIsPendingModalOpen(false)}
            >
              OK
            </button>
          )}
        >
          <div className="pending-open-modal__content">
            <p className="pending-open-modal__subtitle">
              Referência de consulta: {pendingOpenData.referenceLabel}
            </p>

            <div className="pending-open-modal__summary">
              <div className="pending-open-modal__summary-card pending-open-modal__summary-card--receita">
                <span>Receitas pendentes</span>
                <strong>{formatCurrency(pendingOpenData.totalReceitas)}</strong>
              </div>
              <div className="pending-open-modal__summary-card pending-open-modal__summary-card--despesa">
                <span>Despesas pendentes</span>
                <strong>{formatCurrency(pendingOpenData.totalDespesas)}</strong>
              </div>
            </div>

            <div className="pending-open-modal__table-wrapper">
              <table className="pending-open-modal__table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Orçamento</th>
                    <th>Mês</th>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Status</th>
                    <th>Valor pendente</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOpenData.items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="pending-open-modal__empty">
                        Não há pendências nos 2 meses anteriores.
                      </td>
                    </tr>
                  ) : (
                    pendingOpenData.items.map((item) => (
                      <tr key={item.key}>
                        <td>
                          <span className={`pending-open-modal__tipo pending-open-modal__tipo--${item.tipo.toLowerCase()}`}>
                            {item.tipoLabel}
                          </span>
                        </td>
                        <td>{item.ano}</td>
                        <td>{item.mes}</td>
                        <td>{formatPendingDate(item.data)}</td>
                        <td>{item.categoria}</td>
                        <td>{item.complemento ? `${item.descricao} - ${item.complemento}` : item.descricao}</td>
                        <td>{item.status}</td>
                        <td className={item.tipo === "RECEITA" ? "pending-open-modal__value--receita" : "pending-open-modal__value--despesa"}>
                          {formatCurrency(item.valor)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default App;
