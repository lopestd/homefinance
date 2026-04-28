import { useMemo, useState } from "react";
import { formatCurrency, getCurrentMonthName } from "../utils/appUtils";
import { CardTopGastosCartao } from "../components/dashboard";
import { HorizontalBar } from "../components/charts";
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

const formatPercent = (value) => `${Math.round(value)}%`;

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
  description,
  detail,
  breakdown,
  breakdownStyle = "pill",
  breakdownLabelsOnly = false,
  mobileSummary,
  mobileSummaryOnly = false,
  mobileSummaryTone,
  badge,
  variant = "neutral",
  icon
}) => (
  <article className={`dashboard-metric-card dashboard-metric-card--${variant}${mobileSummaryOnly ? " dashboard-metric-card--mobile-summary-only" : ""}`}>
    <div className="dashboard-metric-card__header">
      <span className="dashboard-metric-card__icon" aria-hidden="true">{icon}</span>
      <h3 className="dashboard-metric-card__title">{title}</h3>
    </div>
    <strong className="dashboard-metric-card__value">{formatCurrency(value)}</strong>
    {description ? <p className="dashboard-metric-card__description">{description}</p> : null}
    {breakdown?.length ? (
      breakdownStyle === "tracking" ? (
        <div className="dashboard-metric-card__tracking-values">
          {breakdown.map((item) => (
            <div
              className={`dashboard-metric-card__tracking-value-item ${item.tone ? `dashboard-metric-card__tracking-value-item--${item.tone}` : ""}`}
              key={item.label}
            >
              <span>{item.label}</span>
              <strong>{formatCurrency(item.value)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className={`dashboard-metric-card__breakdown ${breakdownLabelsOnly ? "dashboard-metric-card__breakdown--labels-only" : ""}`}>
          {breakdown.map((item) => (
            <div
              className={`dashboard-metric-card__breakdown-item ${item.tone ? `dashboard-metric-card__breakdown-item--${item.tone}` : ""}`}
              key={item.label}
            >
              <span>{item.label}</span>
              {!breakdownLabelsOnly ? <strong>{formatCurrency(item.value)}</strong> : null}
            </div>
          ))}
        </div>
      )
    ) : null}
    {detail ? <p className="dashboard-metric-card__detail">{detail}</p> : null}
    {mobileSummary ? (
      <p className={`dashboard-metric-card__mobile-summary ${mobileSummaryTone ? `dashboard-metric-card__mobile-summary--${mobileSummaryTone}` : ""}`}>
        {mobileSummary}
      </p>
    ) : null}
    {badge ? <span className="dashboard-metric-card__badge">{badge}</span> : null}
  </article>
);

const DashboardProgressCard = ({
  title,
  percentage,
  plannedLabel,
  plannedValue,
  realizedLabel,
  realizedValue,
  remainingLabel,
  remainingValue,
  variant,
  icon
}) => {
  const isOver = remainingValue < 0;
  const displayRemaining = Math.abs(remainingValue);
  const displayRemainingLabel = isOver ? "Acima do previsto" : remainingLabel;

  return (
    <article className={`dashboard-progress-card dashboard-progress-card--${variant}`}>
      <div className="dashboard-progress-card__header">
        <div className="dashboard-progress-card__title-group">
          <span className="dashboard-progress-card__icon" aria-hidden="true">{icon}</span>
          <h3 className="dashboard-progress-card__title">{title}</h3>
        </div>
        <strong className="dashboard-progress-card__percent">{formatPercent(percentage)}</strong>
      </div>

      <div className="dashboard-progress-card__bar" aria-hidden="true">
        <span
          className="dashboard-progress-card__bar-fill"
          style={{ width: `${clampProgress(percentage)}%` }}
        />
      </div>

      <div className="dashboard-progress-card__values">
        <div className="dashboard-progress-card__value-item">
          <span>{plannedLabel}</span>
          <strong>{formatCurrency(plannedValue)}</strong>
        </div>
        <div className="dashboard-progress-card__value-item">
          <span>{realizedLabel}</span>
          <strong>{formatCurrency(realizedValue)}</strong>
        </div>
        <div className={`dashboard-progress-card__value-item ${isOver ? "dashboard-progress-card__value-item--alert" : ""}`}>
          <span>{displayRemainingLabel}</span>
          <strong>{formatCurrency(displayRemaining)}</strong>
        </div>
      </div>
    </article>
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
  const { getSaldoDoMes } = useSaldoAcumulado(effectiveOrcamentoId, anoOrcamento);
  const saldoMesAtual = useMemo(() => getSaldoDoMes(effectiveMes), [getSaldoDoMes, effectiveMes]);

  // Map de categorias
  const categoriasMap = useMemo(
    () => new Map(categorias?.map((categoria) => [categoria.id, categoria.nome]) || []),
    [categorias]
  );

  // Resumo Mensal
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

  // Resumo Anual
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

  // Top 5 despesas por categoria
  const topDespesasPorCategoria = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes) return [];

    const categoriasMap_local = {};
    despesas.forEach((d) => {
      if (d.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = d.mes === effectiveMes || (d.meses && d.meses.includes(effectiveMes));
      if (isActive) {
        const nome = d.categoria || categoriasMap.get(d.categoriaId) || "Sem categoria";
        const val = parseFloat(d.valor) || 0;
        categoriasMap_local[nome] = (categoriasMap_local[nome] || 0) + val;
      }
    });

    return Object.entries(categoriasMap_local)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [despesas, effectiveOrcamentoId, effectiveMes, categoriasMap]);

  // Top 5 receitas por categoria
  const topReceitasPorCategoria = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes) return [];

    const categoriasMap_local = {};
    receitas.forEach((r) => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = r.mes === effectiveMes || (r.meses && r.meses.includes(effectiveMes));
      if (isActive) {
        const nome = r.categoria || categoriasMap.get(r.categoriaId) || "Sem categoria";
        const val = parseFloat(r.valor) || 0;
        categoriasMap_local[nome] = (categoriasMap_local[nome] || 0) + val;
      }
    });

    return Object.entries(categoriasMap_local)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [receitas, effectiveOrcamentoId, effectiveMes, categoriasMap]);

  // Dados para cards de cartao
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
  const saldoAtualBreakdown = [
    { label: "Saldo inicial", value: safeNumber(saldoInicialMes) },
    { label: "Entradas", value: resumoMensal.recRecebidas, tone: "income" },
    { label: "Saídas", value: resumoMensal.despPagas, tone: "expense" }
  ];
  const resultadoMesBreakdown = [
    { label: "Recebido", value: resumoMensal.recRecebidas, tone: "income" },
    { label: "Pago", value: resumoMensal.despPagas, tone: "expense" },
    { label: "Previsto", value: dashboardSummary.resultadoPrevisto, tone: "forecast" }
  ];
  const saldoPrevistoBreakdown = [
    { label: "Saldo inicial", value: safeNumber(saldoInicialMes) },
    { label: "Resultado previsto", value: dashboardSummary.resultadoPrevisto, tone: "forecast" }
  ];
  const saldoPrevistoVariant = dashboardSummary.saldoPrevisto >= 0 ? "forecast-positive" : "forecast-negative";
  const resultadoMesMobileSummary = `Previsto: ${formatCurrency(dashboardSummary.resultadoPrevisto)}`;
  const resultadoMesMobileSummaryTone = dashboardSummary.resultadoPrevisto >= 0 ? "success" : "danger";
  const saldoPrevistoMobileSummary = `Saldo inicial + Resultado previsto`;

  return (
    <div className="page-grid dashboard-page">
      {/* Header com filtros */}
      <section className="panel dashboard-header">
        <div className="dashboard-header__content">
          <form className="form-inline dashboard-filters" onSubmit={(e) => e.preventDefault()}>
            <label className="field">
              {"Or\u00e7amento"}
              <select
                value={effectiveOrcamentoId}
                onChange={(event) => {
                  const nextId = orcamentos.find((orcamento) => String(orcamento.id) === event.target.value)?.id ?? "";
                  setSelectedOrcamentoId(nextId);
                }}
              >
                {orcamentos.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="field">
              {"M\u00eas"}
              <select value={effectiveMes} onChange={(e) => setSelectedMes(e.target.value)}>
                {mesesDisponiveis.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </form>
        </div>
      </section>

      {/* Cards principais */}
      <section className="dashboard-metrics-grid">
        <DashboardMetricCard
          title="Saldo atual em conta"
          value={dashboardSummary.saldoAtualEmConta}
          breakdown={saldoAtualBreakdown}
          breakdownStyle="tracking"
          variant="primary"
          icon={<IconSaldoAtual />}
        />
        <DashboardMetricCard
          title="Resultado do mês"
          value={dashboardSummary.resultadoDoMes}
          breakdown={resultadoMesBreakdown}
          breakdownStyle="tracking"
          mobileSummary={resultadoMesMobileSummary}
          mobileSummaryOnly={true}
          mobileSummaryTone={resultadoMesMobileSummaryTone}
          variant={dashboardSummary.resultadoDoMes >= 0 ? "success" : "danger"}
          icon={<IconResultadoMes />}
        />
        <DashboardMetricCard
          title="Saldo previsto"
          value={dashboardSummary.saldoPrevisto}
          breakdown={saldoPrevistoBreakdown}
          breakdownLabelsOnly={true}
          mobileSummary={saldoPrevistoMobileSummary}
          variant={saldoPrevistoVariant}
          icon={<IconSaldoPrevisto />}
        />
      </section>

      {/* Cards de acompanhamento */}
      <section className="dashboard-tracking-grid">
        <DashboardProgressCard
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
        />
        <DashboardProgressCard
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
        />
      </section>

      {/* Top Categorias */}
      <section className="dashboard-categories">
        <div className="panel dashboard-category">
          <h3 className="panel-title">Top 5 Despesas</h3>
          {topDespesasPorCategoria.length > 0 ? (
            <HorizontalBar
              data={topDespesasPorCategoria}
              height={180}
              colors={['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#CA8A04']}
              showValues={true}
            />
          ) : (
            <div className="chart-empty" style={{ height: 180 }}>
              <p>{"Sem despesas no per\u00edodo"}</p>
            </div>
          )}
        </div>
        <div className="panel dashboard-category">
          <h3 className="panel-title">Top 5 Receitas</h3>
          {topReceitasPorCategoria.length > 0 ? (
            <HorizontalBar
              data={topReceitasPorCategoria}
              height={180}
              colors={['#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6']}
              showValues={true}
            />
          ) : (
            <div className="chart-empty" style={{ height: 180 }}>
              <p>{"Sem receitas no per\u00edodo"}</p>
            </div>
          )}
        </div>
      </section>

      {/* Top 5 Gastos por Cartao */}
      <section className="dashboard-cartoes">
        {cartoesData.length === 0 ? (
          <div className="panel dashboard-cartoes-empty">
            <p>{"Nenhum cart\u00e3o cadastrado"}</p>
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
            />
          ))
        )}
      </section>

      {/* Resumo Anual */}
      <section className="panel dashboard-annual">
        <h3 className="panel-title">
          Resumo Anual <span className="badge-year">{currentOrcamento?.label}</span>
        </h3>
        <div className="dashboard-grid">
          <div className="summary-card">
            <h4 className="summary-card-title">Receitas do Ano</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Previsto:</span>
              <strong className="summary-card-value">{formatCurrency(resumoAnual.recPrevisto)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Recebido:</span>
              <strong className="summary-card-value summary-card-value--positive">{formatCurrency(resumoAnual.recRecebido)}</strong>
            </div>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Despesas do Ano</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Previsto:</span>
              <strong className="summary-card-value">{formatCurrency(resumoAnual.despPrevisto)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Pago:</span>
              <strong className="summary-card-value summary-card-value--negative">{formatCurrency(resumoAnual.despPago)}</strong>
            </div>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Saldo Anual</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Previsto:</span>
              <strong className="summary-card-value">{formatCurrency(resumoAnual.saldoPrevisto)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Realizado:</span>
              <strong className={`summary-card-value ${resumoAnual.saldoRealizado >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}`}>
                {formatCurrency(resumoAnual.saldoRealizado)}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export { DashboardPage };
