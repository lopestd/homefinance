import { useMemo, useState } from "react";
import { formatCurrency, getCurrentMonthName, MONTHS_ORDER } from "../utils/appUtils";
import { KPICard, SummaryCard, CardTopGastosCartao } from "../components/dashboard";
import { AreaChart, HorizontalBar } from "../components/charts";
import useSaldoAcumulado from "../hooks/useSaldoAcumulado";

const DashboardPage = ({ receitas, despesas, orcamentos, categorias, cartoes, lancamentosCartao }) => {
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState("");
  const [selectedMes, setSelectedMes] = useState("");
  
  const initialOrcamentoId = orcamentos[0]?.id ?? "";
  const effectiveOrcamentoId = selectedOrcamentoId || initialOrcamentoId;
  const currentOrcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
  const anoOrcamento = Number.parseInt(currentOrcamento?.label, 10) || new Date().getFullYear();
  
  const mesesDisponiveis = useMemo(
    () => currentOrcamento?.meses || [],
    [currentOrcamento]
  );

  const mesesOrdenados = useMemo(
    () => MONTHS_ORDER.filter((mes) => mesesDisponiveis.includes(mes)),
    [mesesDisponiveis]
  );
  
  const defaultMes = useMemo(() => {
    if (mesesDisponiveis.length === 0) return "";
    const currentMonth = getCurrentMonthName();
    return mesesDisponiveis.includes(currentMonth) ? currentMonth : mesesDisponiveis[0];
  }, [mesesDisponiveis]);
  
  const effectiveMes = selectedMes && mesesDisponiveis.includes(selectedMes) ? selectedMes : defaultMes;
  const { getSaldoDoMes, getSaldoFinalDoMes } = useSaldoAcumulado(effectiveOrcamentoId, anoOrcamento);
  const saldoMesAtual = useMemo(() => getSaldoDoMes(effectiveMes), [getSaldoDoMes, effectiveMes]);
  const mesIndex = mesesOrdenados.indexOf(effectiveMes);
  const mesAnterior = mesIndex > 0 ? mesesOrdenados[mesIndex - 1] : "";
  const saldoAcumuladoAnterior = useMemo(() => {
    if (!effectiveMes) return 0;
    if (mesIndex <= 0) {
      const value = saldoMesAtual ? parseFloat(saldoMesAtual.saldoInicial) : 0;
      return Number.isNaN(value) ? 0 : value;
    }
    return getSaldoFinalDoMes(mesAnterior);
  }, [effectiveMes, mesIndex, saldoMesAtual, getSaldoFinalDoMes, mesAnterior]);

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

  // Dados para cards de cartão
  const cartoesData = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes || !cartoes || cartoes.length === 0) {
      return [];
    }

    return cartoes.map((cartao) => {
      // Filtrar lançamentos do cartão para o mês
      const lancamentosDoMes = (lancamentosCartao || []).filter((l) =>
        l.cartaoId === cartao.id &&
        (l.mesReferencia === effectiveMes || (l.meses && l.meses.includes(effectiveMes)))
      );

      // Agrupar gastos por descrição (removendo padrão de parcelamento)
      const gastosPorDescricao = {};
      lancamentosDoMes.forEach((l) => {
        // Remover padrão de parcelamento da descrição (ex: " (1/2)")
        let descricao = l.descricao || "Sem descrição";
        descricao = descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
        
        const val = parseFloat(l.valor) || 0;
        gastosPorDescricao[descricao] = (gastosPorDescricao[descricao] || 0) + val;
      });

      // Ordenar e pegar top 5
      const top5Gastos = Object.entries(gastosPorDescricao)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Calcular total gasto
      const totalGasto = lancamentosDoMes.reduce((acc, l) => acc + (parseFloat(l.valor) || 0), 0);

      // Calcular limite
      const limitesMensais = cartao.limitesMensais || {};
      const limite = limitesMensais[effectiveMes] !== undefined && limitesMensais[effectiveMes] !== null && limitesMensais[effectiveMes] !== ""
        ? parseFloat(limitesMensais[effectiveMes])
        : parseFloat(cartao.limite) || 0;

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

  const saldoPrevistoMes = resumoMensal.recLancadas - resumoMensal.despLancadas;
  const saldoConsolidado = saldoAcumuladoAnterior + saldoPrevistoMes;
  const saldoTendencia = calcularTendencia(resumoMensal.saldo, saldoPrevistoMes);
  const saldoConsolidadoClass = saldoConsolidado >= 0 ? "summary-card-value--positive" : "summary-card-value--negative";
  const saldoInicialMes = saldoMesAtual ? parseFloat(saldoMesAtual.saldoInicial) : 0;
  const receitasRecebidasMes = saldoMesAtual ? parseFloat(saldoMesAtual.receitasRecebidas) : 0;
  const despesasPagasMes = saldoMesAtual ? parseFloat(saldoMesAtual.despesasPagas) : 0;
  const saldoFinalMes = saldoMesAtual ? parseFloat(saldoMesAtual.saldoFinal) : 0;

  return (
    <div className="page-grid dashboard-page">
      {/* Header com filtros */}
      <section className="panel dashboard-header">
        <div className="dashboard-header__content">
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

      {/* KPI Hero Row - Saldo do Mês + Saldo Acumulado */}
      <section className="dashboard-hero-row">
        <div className="panel dashboard-hero dashboard-hero--left">
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
                <span>Saldo acumulado anterior:</span>
                <strong>{formatCurrency(saldoAcumuladoAnterior)}</strong>
              </div>
              <div className="kpi-card__detail-row">
                <span>Saldo previsto:</span>
                <strong>{formatCurrency(saldoPrevistoMes)}</strong>
              </div>
              <div className="kpi-card__detail-row">
                <span>Saldo consolidado:</span>
                <strong className={saldoConsolidadoClass}>{formatCurrency(saldoConsolidado)}</strong>
              </div>
            </div>
          </KPICard>
        </div>
        <div className="panel dashboard-hero dashboard-hero--right">
          <KPICard
            title="Saldo Acumulado (EM CONTA)"
            value={formatCurrency(Number.isNaN(saldoFinalMes) ? 0 : saldoFinalMes)}
            subtitle={`Saldo Inicial: ${formatCurrency(Number.isNaN(saldoInicialMes) ? 0 : saldoInicialMes)}`}
            trend={saldoFinalMes >= 0 ? 'up' : 'down'}
            trendValue={saldoFinalMes >= 0 ? 'Positivo' : 'Negativo'}
            color="blue"
          >
            <div className="kpi-card__details">
              <div className="kpi-card__detail-row">
                <span>Receitas Recebidas:</span>
                <strong className="kpi-card__value--positive">{formatCurrency(Number.isNaN(receitasRecebidasMes) ? 0 : receitasRecebidasMes)}</strong>
              </div>
              <div className="kpi-card__detail-row">
                <span>Despesas Pagas:</span>
                <strong className="kpi-card__value--negative">{formatCurrency(Number.isNaN(despesasPagasMes) ? 0 : despesasPagasMes)}</strong>
              </div>
            </div>
          </KPICard>
        </div>
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

      {/* Top 5 Gastos por Cartão */}
      <section className="dashboard-cartoes">
        {cartoesData.length === 0 ? (
          <div className="panel dashboard-cartoes-empty">
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
