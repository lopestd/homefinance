import { useMemo, useState } from "react";
import { formatCurrency, getCurrentMonthName } from "../utils/appUtils";
import { KPICard, SummaryCard } from "../components/dashboard";
import { AreaChart, HorizontalBar } from "../components/charts";

const DashboardPage = ({ receitas, despesas, orcamentos, categorias }) => {
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState("");
  const [selectedMes, setSelectedMes] = useState("");
  
  const initialOrcamentoId = orcamentos[0]?.id ?? "";
  const effectiveOrcamentoId = selectedOrcamentoId || initialOrcamentoId;
  const currentOrcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
  
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

  // Dados para gráfico de evolução mensal
  const evolucaoMensalData = useMemo(() => {
    if (!effectiveOrcamentoId || mesesDisponiveis.length === 0) return [];

    return mesesDisponiveis.map((mes) => {
      let recRecebido = 0;
      let despPago = 0;

      receitas.forEach((r) => {
        if (r.orcamentoId !== effectiveOrcamentoId) return;
        const isActive = r.mes === mes || (r.meses && r.meses.includes(mes));
        if (isActive && r.status === "Recebido") {
          recRecebido += parseFloat(r.valor) || 0;
        }
      });

      despesas.forEach((d) => {
        if (d.orcamentoId !== effectiveOrcamentoId) return;
        const isActive = d.mes === mes || (d.meses && d.meses.includes(mes));
        if (isActive && d.status === "Pago") {
          despPago += parseFloat(d.valor) || 0;
        }
      });

      return {
        name: mes.substring(0, 3),
        receitas: recRecebido,
        despesas: despPago,
        saldo: recRecebido - despPago
      };
    });
  }, [receitas, despesas, effectiveOrcamentoId, mesesDisponiveis]);

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

  // Calcular tendência
  const calcularTendencia = (atual, previsto) => {
    if (previsto === 0) return { trend: 'neutral', trendValue: 'N/A' };
    const diff = atual - previsto;
    const percent = ((diff / previsto) * 100).toFixed(1);
    if (diff > 0) {
      return { trend: 'up', trendValue: `+${percent}% acima do previsto` };
    } else if (diff < 0) {
      return { trend: 'down', trendValue: `${percent}% abaixo do previsto` };
    }
    return { trend: 'neutral', trendValue: 'Dentro do previsto' };
  };

  const saldoTendencia = calcularTendencia(resumoMensal.saldo, resumoMensal.recLancadas - resumoMensal.despLancadas);

  // Series para o gráfico de área
  const areaSeries = [
    { dataKey: 'receitas', name: 'Receitas', color: '#10B981' },
    { dataKey: 'despesas', name: 'Despesas', color: '#EF4444' }
  ];

  return (
    <div className="page-grid dashboard-page">
      {/* Header com filtros */}
      <section className="panel dashboard-header">
        <div className="dashboard-header__content">
          <h2 className="dashboard-header__title">📊 Dashboard</h2>
          <form className="form-inline dashboard-filters" onSubmit={(e) => e.preventDefault()}>
            <label className="field">
              Orçamento
              <select value={effectiveOrcamentoId} onChange={(e) => setSelectedOrcamentoId(e.target.value)}>
                {orcamentos.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <label className="field">
              Mês
              <select value={effectiveMes} onChange={(e) => setSelectedMes(e.target.value)}>
                {mesesDisponiveis.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </form>
        </div>
      </section>

      {/* KPI Hero - Saldo em Destaque */}
      <section className="panel dashboard-hero">
        <KPICard
          title="Saldo do Mês"
          value={formatCurrency(resumoMensal.saldo)}
          subtitle={`Receitas: ${formatCurrency(resumoMensal.recRecebidas)} | Despesas: ${formatCurrency(resumoMensal.despPagas)}`}
          trend={saldoTendencia.trend}
          trendValue={saldoTendencia.trendValue}
          color={resumoMensal.saldo >= 0 ? 'positive' : 'negative'}
        >
          <div className="kpi-card__details">
            <div className="kpi-card__detail-row">
              <span>Previsto:</span>
              <strong>{formatCurrency(resumoMensal.recLancadas - resumoMensal.despLancadas)}</strong>
            </div>
            <div className="kpi-card__detail-row">
              <span>Realizado:</span>
              <strong>{formatCurrency(resumoMensal.saldo)}</strong>
            </div>
          </div>
        </KPICard>
      </section>

      {/* Cards de Resumo */}
      <section className="dashboard-cards">
        <SummaryCard
          title="Receitas"
          icon="📈"
          previsto={resumoMensal.recLancadas}
          realizado={resumoMensal.recRecebidas}
          color="#10B981"
          labelPrevisto="Previsto"
          labelRealizado="Recebido"
        />
        <SummaryCard
          title="Despesas"
          icon="📉"
          previsto={resumoMensal.despLancadas}
          realizado={resumoMensal.despPagas}
          color="#EF4444"
          labelPrevisto="Previsto"
          labelRealizado="Pago"
        />
        <SummaryCard
          title="Balanço Anual"
          icon="📊"
          previsto={resumoAnual.recPrevisto - resumoAnual.despPrevisto}
          realizado={resumoAnual.saldoRealizado}
          color={resumoAnual.saldoRealizado >= 0 ? '#10B981' : '#EF4444'}
          labelPrevisto="Previsto"
          labelRealizado="Realizado"
        />
      </section>

      {/* Gráfico de Evolução Mensal */}
      <section className="panel dashboard-chart">
        <h3 className="panel-title">Evolução Mensal</h3>
        <AreaChart
          data={evolucaoMensalData}
          series={areaSeries}
          height={280}
          showGrid={true}
          showLegend={true}
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
              <p>Sem despesas no período</p>
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
              <p>Sem receitas no período</p>
            </div>
          )}
        </div>
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
