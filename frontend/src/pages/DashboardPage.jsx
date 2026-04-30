import { useMemo, useState } from "react";
import { formatCurrency, getCurrentMonthName, MONTHS_ORDER } from "../utils/appUtils";
import { CardTopGastosCartao } from "../components/dashboard";
import useSaldoAcumulado from "../hooks/useSaldoAcumulado";

const CREDITO_TAG = "[CREDITO]";
const stripCreditoTag = (descricao) => {
  const text = String(descricao || "").trim();
  if (text === CREDITO_TAG) return "";
  if (text.startsWith(`${CREDITO_TAG} `)) return text.slice(CREDITO_TAG.length).trim();
  return text;
};
const isCreditoLancamento = (lancamento) =>
  Number(lancamento?.valor) < 0 || String(lancamento?.descricao || "").startsWith(CREDITO_TAG);

const resolveLimiteCartao = (cartao, orcamentoId, mes) => {
  const limitesMensais = cartao?.limitesMensais || {};

  const nestedValue = limitesMensais?.[String(orcamentoId)]?.[mes];
  if (nestedValue !== undefined && nestedValue !== null && nestedValue !== "") {
    return parseFloat(nestedValue) || 0;
  }

  // Compatibilidade com payload legado (flat).
  const flatValue = limitesMensais?.[mes];
  if (flatValue !== undefined && flatValue !== null && flatValue !== "") {
    return parseFloat(flatValue) || 0;
  }

  return 0;
};

const resolveEffectiveOrcamentoId = (orcamentos, selectedOrcamentoId) => {
  if (!Array.isArray(orcamentos) || orcamentos.length === 0) return "";
  if (selectedOrcamentoId !== null && selectedOrcamentoId !== undefined && selectedOrcamentoId !== "") {
    const match = orcamentos.find((orcamento) => String(orcamento.id) === String(selectedOrcamentoId));
    if (match) return match.id;
  }
  const currentYear = String(new Date().getFullYear());
  const currentYearMatch = orcamentos.find((orcamento) => String(orcamento.label) === currentYear);
  return currentYearMatch?.id ?? orcamentos[0]?.id ?? "";
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safePercentage = (value, total) => {
  if (!total || total <= 0) return 0;
  return (value / total) * 100;
};

const clampProgress = (value) => Math.min(100, Math.max(0, value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatPercent = (value) => `${Math.round(value)}%`;
const MASKED_CURRENCY = "R$ •••••";
const MASKED_CURRENCY_COMPACT = "R$ •••";
const MASKED_PERCENT = "••%";

const displayCurrency = (value, valuesVisible) => (
  valuesVisible ? formatCurrency(value) : MASKED_CURRENCY
);

const displayCurrencyCompact = (value, valuesVisible) => (
  valuesVisible ? formatCurrencyCompact(value) : MASKED_CURRENCY_COMPACT
);

const displayPercent = (value, valuesVisible) => (
  valuesVisible ? formatPercent(value) : MASKED_PERCENT
);

const formatCurrencyCompact = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "R$ 0";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(parsed);
};

const abbreviateMonth = (mes) => String(mes || "").slice(0, 3) || "Mês";

const IconSaldoAtual = () => (
  <svg viewBox="0 0 24 24" role="img" aria-label="Saldo atual">
    <path d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
    <path d="M4 9h16" />
    <path d="M15.75 13.25h1.5" />
  </svg>
);

const IconResultadoMes = () => (
  <svg viewBox="0 0 24 24" role="img" aria-label="Resultado do mês">
    <path d="M4 17.5h16" />
    <path d="M6 15l4.1-4.1 3.1 3.1L19 8.2" />
    <path d="M15.5 8.2H19v3.5" />
  </svg>
);

const IconSaldoPrevisto = () => (
  <svg viewBox="0 0 24 24" role="img" aria-label="Saldo previsto">
    <path d="M7 3.5v3" />
    <path d="M17 3.5v3" />
    <path d="M5.5 6h13A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9A2.5 2.5 0 0 1 5.5 6Z" />
    <path d="M3 10h18" />
    <path d="M8 15h3.25L13 12.5l1.75 4L16 15h1" />
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" role="img" aria-label="Visualizar saldo">
    <path d="M2.75 12s3.25-5.25 9.25-5.25S21.25 12 21.25 12 18 17.25 12 17.25 2.75 12 2.75 12Z" />
    <path d="M12 14.25A2.25 2.25 0 1 0 12 9.75a2.25 2.25 0 0 0 0 4.5Z" />
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" role="img" aria-label="Ocultar saldo">
    <path d="M3.5 4.25 20.5 20.75" />
    <path d="M9.55 6.95A9.73 9.73 0 0 1 12 6.75c6 0 9.25 5.25 9.25 5.25a14.98 14.98 0 0 1-2.45 2.92" />
    <path d="M14.2 14.08A2.25 2.25 0 0 1 9.9 10.4" />
    <path d="M6.65 8.28C4.1 9.82 2.75 12 2.75 12S6 17.25 12 17.25c1.18 0 2.26-.2 3.23-.52" />
  </svg>
);

const calculateDashboardSummary = ({
  saldoInicial = 0,
  receitasPrevistas = 0,
  receitasRecebidas = 0,
  despesasPrevistas = 0,
  despesasPagas = 0
}) => {
  const resultadoDoMes = receitasRecebidas - despesasPagas;
  const resultadoPrevisto = receitasPrevistas - despesasPrevistas;
  const saldoAtualEmConta = saldoInicial + resultadoDoMes;
  const saldoPrevisto = saldoInicial + resultadoPrevisto;
  const diferencaResultado = resultadoDoMes - resultadoPrevisto;
  const percentualReceitas = safePercentage(receitasRecebidas, receitasPrevistas);
  const percentualDespesas = safePercentage(despesasPagas, despesasPrevistas);
  const faltaReceber = receitasPrevistas - receitasRecebidas;
  const restantePrevisto = despesasPrevistas - despesasPagas;

  return {
    resultadoDoMes,
    resultadoPrevisto,
    saldoAtualEmConta,
    saldoPrevisto,
    diferencaResultado,
    percentualReceitas,
    percentualDespesas,
    faltaReceber,
    restantePrevisto
  };
};

const DashboardMetricCard = ({
  title,
  value,
  variant = "primary",
  icon,
  summaryRows = [],
  stats = [],
  showEye = false,
  valuesVisible = true,
  onToggleValues
}) => (
  <article className={`hf-kpi-card hf-kpi-card--${variant}`}>
    <span className="hf-kpi-card__icon" aria-hidden="true">{icon}</span>
    <div className="hf-kpi-card__body">
      <div className="hf-kpi-card__title-row">
        <h3 className="hf-kpi-card__title">{title}</h3>
        {showEye ? (
          <button
            type="button"
            className={`hf-kpi-card__eye ${valuesVisible ? "" : "hf-kpi-card__eye--hidden"}`}
            onClick={onToggleValues}
            aria-label={valuesVisible ? "Ocultar valores do dashboard" : "Mostrar valores do dashboard"}
            aria-pressed={!valuesVisible}
          >
            {valuesVisible ? <IconEye /> : <IconEyeOff />}
          </button>
        ) : null}
      </div>
      <strong className="hf-kpi-card__value">{displayCurrency(value, valuesVisible)}</strong>
      {summaryRows.length > 0 ? (
        <div className="hf-kpi-card__summary">
          {summaryRows.map((row) => (
            <p className="hf-kpi-card__summary-row" key={row.label}>
              <span>{row.label}:</span>
              <strong className={row.tone ? `hf-tone-${row.tone}` : undefined}>{displayCurrency(row.value, valuesVisible)}</strong>
            </p>
          ))}
        </div>
      ) : null}
      {stats.length > 0 ? (
        <div className="hf-kpi-card__stats">
          {stats.map((item) => (
            <div className="hf-kpi-card__stat" key={item.label}>
              <span>{item.label}</span>
              <strong className={item.tone ? `hf-tone-${item.tone}` : undefined}>{displayCurrency(item.value, valuesVisible)}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  </article>
);

const DashboardProgressPanel = ({
  title,
  percentage,
  plannedLabel,
  plannedValue,
  realizedLabel,
  realizedValue,
  remainingLabel,
  remainingValue,
  variant,
  icon,
  valuesVisible = true
}) => {
  const isOver = remainingValue < 0;
  const displayRemaining = Math.abs(remainingValue);
  const displayRemainingLabel = isOver ? "Acima do previsto" : remainingLabel;

  return (
    <div className={`hf-progress-panel hf-progress-panel--${variant}`}>
      <div className="hf-progress-panel__heading">
        <div className="hf-progress-panel__title-wrap">
          <span className="hf-progress-panel__icon" aria-hidden="true">{icon}</span>
          <h4 className="hf-progress-panel__title">{title}</h4>
        </div>
        <strong className="hf-progress-panel__percent">{displayPercent(percentage, valuesVisible)}</strong>
      </div>

      <div className="hf-progress-panel__bar" aria-hidden="true">
        <span className="hf-progress-panel__bar-fill" style={{ width: `${valuesVisible ? clampProgress(percentage) : 48}%` }} />
      </div>

      <div className="hf-progress-panel__rows">
        <div className="hf-progress-panel__row">
          <span>{plannedLabel}</span>
          <strong>{displayCurrency(plannedValue, valuesVisible)}</strong>
        </div>
        <div className="hf-progress-panel__row">
          <span>{realizedLabel}</span>
          <strong className={`hf-progress-panel__value-${variant}`}>{displayCurrency(realizedValue, valuesVisible)}</strong>
        </div>
        <div className={`hf-progress-panel__row ${isOver ? "hf-progress-panel__row--alert" : ""}`}>
          <span>{displayRemainingLabel}</span>
          <strong>{displayCurrency(displayRemaining, valuesVisible)}</strong>
        </div>
      </div>
    </div>
  );
};

const DashboardMonthOverview = ({ resumoMensal, dashboardSummary, valuesVisible }) => (
  <section className="hf-card hf-month-overview">
    <h3 className="hf-section-title">Visão geral do mês</h3>
    <div className="hf-month-overview__grid">
      <DashboardProgressPanel
        title="Receitas"
        percentage={dashboardSummary.percentualReceitas}
        plannedLabel="Previsto"
        plannedValue={resumoMensal.recLancadas}
        realizedLabel="Recebido"
        realizedValue={resumoMensal.recRecebidas}
        remainingLabel="Falta receber"
        remainingValue={dashboardSummary.faltaReceber}
        variant="income"
        icon="↗"
        valuesVisible={valuesVisible}
      />
      <DashboardProgressPanel
        title="Despesas"
        percentage={dashboardSummary.percentualDespesas}
        plannedLabel="Previsto"
        plannedValue={resumoMensal.despLancadas}
        realizedLabel="Pago"
        realizedValue={resumoMensal.despPagas}
        remainingLabel="Restante previsto"
        remainingValue={dashboardSummary.restantePrevisto}
        variant="expense"
        icon="↘"
        valuesVisible={valuesVisible}
      />
    </div>
  </section>
);

const DashboardRankingList = ({ title, data, colors, emptyMessage, valuesVisible }) => {
  const maxValue = data.length > 0 ? Math.max(...data.map((item) => safeNumber(item.value))) : 0;

  return (
    <div className="hf-ranking-list">
      <h3 className="hf-section-title hf-ranking-list__title">{title}</h3>
      {data.length > 0 ? (
        <div className="hf-ranking-list__items">
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            const width = valuesVisible && maxValue > 0 ? clamp((safeNumber(item.value) / maxValue) * 100, 3, 100) : 54;
            return (
              <div className="hf-ranking-list__item" key={`${title}-${item.name}`}>
                <span className="hf-ranking-list__label" title={item.name}>{item.name}</span>
                <span className="hf-ranking-list__track" aria-hidden="true">
                  <span className="hf-ranking-list__fill" style={{ width: `${width}%`, backgroundColor: color }} />
                </span>
                <strong className="hf-ranking-list__value">{displayCurrencyCompact(item.value, valuesVisible)}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="hf-empty-state">{emptyMessage}</div>
      )}
    </div>
  );
};

const DashboardRankingsCard = ({ topDespesasPorCategoria, topReceitasPorCategoria, valuesVisible }) => (
  <section className="hf-card hf-rankings-card">
    <DashboardRankingList
      title="Top 5 Despesas"
      data={topDespesasPorCategoria}
      colors={["#e11d2e", "#f97316", "#f59e0b", "#eab308", "#facc15"]}
      emptyMessage="Sem despesas no período"
      valuesVisible={valuesVisible}
    />
    <DashboardRankingList
      title="Top 5 Receitas"
      data={topReceitasPorCategoria}
      colors={["#16a34a", "#14b8a6", "#06b6d4", "#0ea5e9", "#2563eb"]}
      emptyMessage="Sem receitas no período"
      valuesVisible={valuesVisible}
    />
  </section>
);

const DashboardAnnualMetric = ({ title, rows, valuesVisible }) => (
  <div className="hf-annual-metric">
    <h4>{title}</h4>
    {rows.map((row) => (
      <div className="hf-annual-metric__row" key={row.label}>
        <span>{row.label}</span>
        <strong className={row.tone ? `hf-tone-${row.tone}` : undefined}>{displayCurrency(row.value, valuesVisible)}</strong>
      </div>
    ))}
  </div>
);

const DashboardAnnualSparkline = ({ saldos, selectedMes, fallbackValue, valuesVisible }) => {
  const source = MONTHS_ORDER.map((mesNome) => {
    const saldo = saldos.find((item) => item.mesNome === mesNome);
    const value = saldo ? safeNumber(saldo.saldoFinal) : null;
    return value === null ? null : { mesNome, value };
  }).filter(Boolean);

  const selectedFallback = safeNumber(fallbackValue);
  const chartData = source.length >= 2
    ? source
    : [
        { mesNome: MONTHS_ORDER[0], value: selectedFallback * 0.92 },
        { mesNome: selectedMes || MONTHS_ORDER[3], value: selectedFallback },
        { mesNome: MONTHS_ORDER[MONTHS_ORDER.length - 1], value: selectedFallback * 1.08 }
      ];

  const selectedPointIndex = chartData.findIndex((item) => item.mesNome === selectedMes);
  const selectedIndex = selectedPointIndex === -1 ? chartData.length - 1 : selectedPointIndex;
  const selectedValue = chartData[selectedIndex]?.value ?? selectedFallback;
  const width = 188;
  const height = 82;
  const paddingX = 12;
  const paddingY = 12;
  const displayChartData = valuesVisible
    ? chartData
    : chartData.map((item, index) => ({ ...item, value: index % 2 === 0 ? 0.64 : 0.9 }));
  const values = displayChartData.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const points = displayChartData.map((item, index) => {
    const x = paddingX + (index / Math.max(1, chartData.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((item.value - minValue) / range) * (height - paddingY * 2);
    return { ...item, x, y };
  });
  const selectedPoint = points[selectedIndex] || points[points.length - 1];
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${paddingX},${height - paddingY} ${linePoints} ${width - paddingX},${height - paddingY}`;
  const tooltipLeft = clamp((selectedPoint.x / width) * 100, 22, 78);
  const tooltipTop = clamp((selectedPoint.y / height) * 100 - 30, 3, 42);

  return (
    <div className="hf-annual-sparkline" aria-label="Evolução do saldo anual">
      <div className="hf-annual-sparkline__tooltip" style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%` }}>
        <span>{abbreviateMonth(selectedMes)}</span>
        <strong>{displayCurrency(selectedValue, valuesVisible)}</strong>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <linearGradient id="hfSparklineArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#hfSparklineArea)" />
        <polyline points={linePoints} fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={selectedPoint.x} cy={selectedPoint.y} r="4" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
      </svg>
    </div>
  );
};

const DashboardPage = ({
  receitas,
  despesas,
  orcamentos,
  selectedOrcamentoId,
  setSelectedOrcamentoId,
  categorias,
  cartoes,
  lancamentosCartao
}) => {
  const [selectedMes, setSelectedMes] = useState("");
  const [valuesVisible, setValuesVisible] = useState(true);

  const effectiveOrcamentoId = resolveEffectiveOrcamentoId(orcamentos, selectedOrcamentoId);
  const currentOrcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
  const anoOrcamento = Number.parseInt(currentOrcamento?.label, 10) || new Date().getFullYear();

  const mesesDisponiveis = useMemo(
    () => currentOrcamento?.meses || [],
    [currentOrcamento]
  );

  const defaultMes = useMemo(() => {
    if (mesesDisponiveis.length === 0) return "";
    const currentMonth = getCurrentMonthName();
    return mesesDisponiveis.includes(currentMonth) ? currentMonth : mesesDisponiveis[0];
  }, [mesesDisponiveis]);

  const effectiveMes = selectedMes && mesesDisponiveis.includes(selectedMes) ? selectedMes : defaultMes;
  const { saldos, getSaldoDoMes } = useSaldoAcumulado(effectiveOrcamentoId, anoOrcamento);
  const saldoMesAtual = useMemo(() => getSaldoDoMes(effectiveMes), [getSaldoDoMes, effectiveMes]);

  const categoriasMap = useMemo(
    () => new Map(categorias?.map((categoria) => [categoria.id, categoria.nome]) || []),
    [categorias]
  );

  const resumoMensal = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes) {
      return { recLancadas: 0, recRecebidas: 0, despLancadas: 0, despPagas: 0, saldo: 0 };
    }

    let recLancadas = 0;
    let recRecebidas = 0;
    let despLancadas = 0;
    let despPagas = 0;

    receitas.forEach((r) => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = r.mes === effectiveMes || (r.meses && r.meses.includes(effectiveMes));
      if (isActive) {
        const val = parseFloat(r.valor) || 0;
        recLancadas += val;
        if (r.status === "Recebido") recRecebidas += val;
      }
    });

    despesas.forEach((d) => {
      if (d.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = d.mes === effectiveMes || (d.meses && d.meses.includes(effectiveMes));
      if (isActive) {
        const val = parseFloat(d.valor) || 0;
        despLancadas += val;
        if (d.status === "Pago") despPagas += val;
      }
    });

    return {
      recLancadas,
      recRecebidas,
      despLancadas,
      despPagas,
      saldo: recRecebidas - despPagas
    };
  }, [receitas, despesas, effectiveOrcamentoId, effectiveMes]);

  const resumoAnual = useMemo(() => {
    if (!effectiveOrcamentoId) {
      return {
        recPrevisto: 0,
        recRecebido: 0,
        despPrevisto: 0,
        despPago: 0,
        saldoPrevisto: 0,
        saldoRealizado: 0
      };
    }

    let recPrevisto = 0;
    let recRecebido = 0;
    let despPrevisto = 0;
    let despPago = 0;

    receitas.forEach((r) => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const val = parseFloat(r.valor) || 0;
      const occurrences = (r.meses && r.meses.length > 0) ? r.meses.length : (r.mes ? 1 : 0);
      recPrevisto += val * occurrences;
      if (r.status === "Recebido") {
        recRecebido += val * occurrences;
      }
    });

    despesas.forEach((d) => {
      if (d.orcamentoId !== effectiveOrcamentoId) return;
      const val = parseFloat(d.valor) || 0;
      const occurrences = (d.meses && d.meses.length > 0) ? d.meses.length : (d.mes ? 1 : 0);
      despPrevisto += val * occurrences;
      if (d.status === "Pago") {
        despPago += val * occurrences;
      }
    });

    return {
      recPrevisto,
      recRecebido,
      despPrevisto,
      despPago,
      saldoPrevisto: recPrevisto - despPrevisto,
      saldoRealizado: recRecebido - despPago
    };
  }, [receitas, despesas, effectiveOrcamentoId]);

  const topDespesasPorCategoria = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes) return [];

    const categoriasMapLocal = {};
    despesas.forEach((d) => {
      if (d.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = d.mes === effectiveMes || (d.meses && d.meses.includes(effectiveMes));
      if (isActive) {
        const nome = d.categoria || categoriasMap.get(d.categoriaId) || "Sem categoria";
        const val = parseFloat(d.valor) || 0;
        categoriasMapLocal[nome] = (categoriasMapLocal[nome] || 0) + val;
      }
    });

    return Object.entries(categoriasMapLocal)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [despesas, effectiveOrcamentoId, effectiveMes, categoriasMap]);

  const topReceitasPorCategoria = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes) return [];

    const categoriasMapLocal = {};
    receitas.forEach((r) => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = r.mes === effectiveMes || (r.meses && r.meses.includes(effectiveMes));
      if (isActive) {
        const nome = r.categoria || categoriasMap.get(r.categoriaId) || "Sem categoria";
        const val = parseFloat(r.valor) || 0;
        categoriasMapLocal[nome] = (categoriasMapLocal[nome] || 0) + val;
      }
    });

    return Object.entries(categoriasMapLocal)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [receitas, effectiveOrcamentoId, effectiveMes, categoriasMap]);

  const cartoesData = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes || !cartoes || cartoes.length === 0) {
      return [];
    }

    return cartoes.map((cartao) => {
      const lancamentosDoMes = (lancamentosCartao || []).filter((l) =>
        String(l.orcamentoId) === String(effectiveOrcamentoId) &&
        String(l.cartaoId) === String(cartao.id) &&
        (l.mesReferencia === effectiveMes || (l.meses && l.meses.includes(effectiveMes)))
      );

      const gastosPorDescricao = {};
      let totalDebitos = 0;
      let totalCreditos = 0;

      lancamentosDoMes.forEach((l) => {
        const val = Math.abs(parseFloat(l.valor) || 0);
        if (isCreditoLancamento(l)) {
          totalCreditos += val;
          return;
        }

        totalDebitos += val;
        let descricao = stripCreditoTag(l.descricao) || "Sem descrição";
        descricao = descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
        gastosPorDescricao[descricao] = (gastosPorDescricao[descricao] || 0) + val;
      });

      const top5Gastos = Object.entries(gastosPorDescricao)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const totalGasto = Math.max(totalDebitos - totalCreditos, 0);
      const limite = resolveLimiteCartao(cartao, effectiveOrcamentoId, effectiveMes);

      return {
        cartao,
        lancamentos: lancamentosDoMes,
        top5Gastos,
        totalGasto,
        limite,
        saldo: limite - totalGasto
      };
    });
  }, [cartoes, lancamentosCartao, effectiveOrcamentoId, effectiveMes]);

  const saldoInicialMes = saldoMesAtual ? parseFloat(saldoMesAtual.saldoInicial) : 0;
  const dashboardSummary = calculateDashboardSummary({
    saldoInicial: safeNumber(saldoInicialMes),
    receitasPrevistas: resumoMensal.recLancadas,
    receitasRecebidas: resumoMensal.recRecebidas,
    despesasPrevistas: resumoMensal.despLancadas,
    despesasPagas: resumoMensal.despPagas
  });

  const resultadoMesStats = [
    { label: "Recebido", value: resumoMensal.recRecebidas, tone: "income" },
    { label: "Pago", value: resumoMensal.despPagas, tone: "expense" },
    { label: "Previsto", value: dashboardSummary.resultadoPrevisto }
  ];
  const saldoPrevistoVariant = dashboardSummary.saldoPrevisto >= 0 ? "forecast" : "danger";

  return (
    <div className="page-grid hf-dashboard-page">
      <section className="hf-card hf-dashboard-filters-card" aria-label="Filtros do dashboard">
        <form className="hf-dashboard-filters" onSubmit={(event) => event.preventDefault()}>
          <label className="hf-dashboard-filter-field">
            <span>Orçamento</span>
            <select
              value={effectiveOrcamentoId}
              onChange={(event) => {
                const nextId = orcamentos.find((orcamento) => String(orcamento.id) === event.target.value)?.id ?? "";
                setSelectedOrcamentoId(nextId);
              }}
            >
              {orcamentos.map((orcamento) => <option key={orcamento.id} value={orcamento.id}>{orcamento.label}</option>)}
            </select>
          </label>
          <label className="hf-dashboard-filter-field">
            <span>Mês</span>
            <select value={effectiveMes} onChange={(event) => setSelectedMes(event.target.value)}>
              {mesesDisponiveis.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
            </select>
          </label>
        </form>
      </section>

      <section className="hf-dashboard-kpis">
        <DashboardMetricCard
          title={`Saldo em conta | ${effectiveMes || "Mês"}`}
          value={dashboardSummary.saldoAtualEmConta}
          summaryRows={[{ label: "Saldo inicial", value: safeNumber(saldoInicialMes) }]}
          variant={dashboardSummary.saldoAtualEmConta >= 0 ? "account-positive" : "account-negative"}
          icon={<IconSaldoAtual />}
          showEye={true}
          valuesVisible={valuesVisible}
          onToggleValues={() => setValuesVisible((current) => !current)}
        />
        <DashboardMetricCard
          title="Resultado do mês"
          value={dashboardSummary.resultadoDoMes}
          stats={resultadoMesStats}
          variant={dashboardSummary.resultadoDoMes >= 0 ? "success" : "danger"}
          icon={<IconResultadoMes />}
          valuesVisible={valuesVisible}
        />
        <DashboardMetricCard
          title="Saldo previsto"
          value={dashboardSummary.saldoPrevisto}
          summaryRows={[
            { label: "Saldo inicial", value: safeNumber(saldoInicialMes) },
            { label: "Resultado previsto", value: dashboardSummary.resultadoPrevisto }
          ]}
          variant={saldoPrevistoVariant}
          icon={<IconSaldoPrevisto />}
          valuesVisible={valuesVisible}
        />
      </section>

      <section className="hf-dashboard-middle-grid">
        <DashboardMonthOverview
          resumoMensal={resumoMensal}
          dashboardSummary={dashboardSummary}
          valuesVisible={valuesVisible}
        />
        <DashboardRankingsCard
          topDespesasPorCategoria={topDespesasPorCategoria}
          topReceitasPorCategoria={topReceitasPorCategoria}
          valuesVisible={valuesVisible}
        />
      </section>

      <section className="hf-dashboard-cards-grid">
        {cartoesData.length === 0 ? (
          <div className="hf-card dashboard-cartoes-empty">
            <p>Nenhum cartão cadastrado</p>
          </div>
        ) : (
          cartoesData.map((cartaoData) => (
            <CardTopGastosCartao
              key={cartaoData.cartao.id}
              cartao={cartaoData.cartao}
              top5Gastos={cartaoData.top5Gastos}
              totalGasto={cartaoData.totalGasto}
              limite={cartaoData.limite}
              saldo={cartaoData.saldo}
              valuesVisible={valuesVisible}
            />
          ))
        )}
      </section>

      <section className="hf-card hf-annual-card">
        <header className="hf-annual-card__header">
          <h3 className="hf-section-title">Resumo anual</h3>
          <span className="hf-annual-card__badge">{currentOrcamento?.label}</span>
        </header>
        <div className="hf-annual-card__body">
          <div className="hf-annual-card__metrics">
            <DashboardAnnualMetric
              title="Receitas do ano"
              rows={[
                { label: "Previsto", value: resumoAnual.recPrevisto },
                { label: "Recebido", value: resumoAnual.recRecebido, tone: "income" }
              ]}
              valuesVisible={valuesVisible}
            />
            <DashboardAnnualMetric
              title="Despesas do ano"
              rows={[
                { label: "Previsto", value: resumoAnual.despPrevisto },
                { label: "Pago", value: resumoAnual.despPago, tone: "expense" }
              ]}
              valuesVisible={valuesVisible}
            />
            <DashboardAnnualMetric
              title="Saldo anual"
              rows={[
                { label: "Previsto", value: resumoAnual.saldoPrevisto },
                { label: "Realizado", value: dashboardSummary.saldoAtualEmConta, tone: dashboardSummary.saldoAtualEmConta >= 0 ? "income" : "expense" }
              ]}
              valuesVisible={valuesVisible}
            />
          </div>
          <DashboardAnnualSparkline
            saldos={saldos}
            selectedMes={effectiveMes}
            fallbackValue={dashboardSummary.saldoAtualEmConta}
            valuesVisible={valuesVisible}
          />
        </div>
      </section>
    </div>
  );
};

export { DashboardPage };
