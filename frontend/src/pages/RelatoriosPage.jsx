import { useCallback, useMemo, useState } from "react";
import useRelatorios from "../hooks/useRelatorios";
import { formatCurrency } from "../utils/appUtils";
import { TabNavigation } from "../components/reports";
import { AreaChart, HorizontalBar, PieChart } from "../components/charts";
import { KPICard } from "../components/dashboard";

const RelatoriosPage = ({
  orcamentos,
  receitas,
  despesas,
  cartoes,
  lancamentosCartao,
  categorias
}) => {
  const [activeTab, setActiveTab] = useState('resumo');
  
  const {
    filters,
    setFilters,
    effectiveOrcamentoId,
    mesesOrcamento,
    mesInicio,
    mesFim,
    mesesSelecionados
  } = useRelatorios(orcamentos);

  const categoriasMap = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.nome])),
    [categorias]
  );

  const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  };

  const getCategoriaNome = useCallback(
    (item) => item.categoria || categoriasMap.get(item.categoriaId) || "Sem categoria",
    [categoriasMap]
  );

  const getMesesItem = useCallback((item) => {
    if (item.meses && item.meses.length > 0) return item.meses;
    if (item.mes) return [item.mes];
    return [];
  }, []);

  const countOcorrencias = useCallback(
    (item, months) => {
      const monthsItem = getMesesItem(item);
      if (monthsItem.length === 0) return 0;
      return monthsItem.filter((m) => months.includes(m)).length;
    },
    [getMesesItem]
  );

  const receitasOrcamento = useMemo(
    () => receitas.filter((r) => r.orcamentoId === effectiveOrcamentoId),
    [receitas, effectiveOrcamentoId]
  );
  const despesasOrcamento = useMemo(
    () => despesas.filter((d) => d.orcamentoId === effectiveOrcamentoId),
    [despesas, effectiveOrcamentoId]
  );

  const calcResumo = useCallback((months) => {
    let recPrevisto = 0;
    let recRecebido = 0;
    let despPrevisto = 0;
    let despPago = 0;

    receitasOrcamento.forEach((r) => {
      const ocorrencias = countOcorrencias(r, months);
      if (ocorrencias === 0) return;
      const val = parseFloat(r.valor) || 0;
      recPrevisto += val * ocorrencias;
      if (r.status === "Recebido") recRecebido += val * ocorrencias;
    });

    despesasOrcamento.forEach((d) => {
      const ocorrencias = countOcorrencias(d, months);
      if (ocorrencias === 0) return;
      const val = parseFloat(d.valor) || 0;
      despPrevisto += val * ocorrencias;
      if (d.status === "Pago") despPago += val * ocorrencias;
    });

    return { recPrevisto, recRecebido, despPrevisto, despPago };
  }, [receitasOrcamento, despesasOrcamento, countOcorrencias]);

  const resumoConsolidado = useMemo(() => {
    if (mesesSelecionados.length === 0) {
      return { recPrevisto: 0, recRecebido: 0, despPrevisto: 0, despPago: 0 };
    }
    return calcResumo(mesesSelecionados);
  }, [mesesSelecionados, calcResumo]);

  const evolucaoMensal = useMemo(() => {
    return mesesSelecionados.map((mes) => {
      const resumo = calcResumo([mes]);
      const saldoMes = resumo.recRecebido - resumo.despPago;
      return { mes, ...resumo, saldoMes };
    });
  }, [mesesSelecionados, calcResumo]);

  const evolucaoMensalComAcumulado = useMemo(() => {
    return evolucaoMensal.map((item, index) => {
      const saldoAcumulado = evolucaoMensal
        .slice(0, index + 1)
        .reduce((acc, current) => acc + current.saldoMes, 0);
      return {
        ...item,
        saldoAcumulado: filters.visao === "Acumulada" ? saldoAcumulado : item.saldoMes
      };
    });
  }, [evolucaoMensal, filters.visao]);

  // Dados para gráfico de evolução
  const evolucaoChartData = useMemo(() => {
    return evolucaoMensalComAcumulado.map((item) => ({
      name: item.mes.substring(0, 3),
      receitas: item.recRecebido,
      despesas: item.despPago,
      saldo: item.saldoAcumulado
    }));
  }, [evolucaoMensalComAcumulado]);

  const comparativoPlanejado = useMemo(() => {
    const diffReceitas = resumoConsolidado.recRecebido - resumoConsolidado.recPrevisto;
    const diffDespesas = resumoConsolidado.despPago - resumoConsolidado.despPrevisto;
    return [
      {
        tipo: "Receitas",
        diff: diffReceitas,
        percent: resumoConsolidado.recPrevisto ? (diffReceitas / resumoConsolidado.recPrevisto) * 100 : 0
      },
      {
        tipo: "Despesas",
        diff: diffDespesas,
        percent: resumoConsolidado.despPrevisto ? (diffDespesas / resumoConsolidado.despPrevisto) * 100 : 0
      }
    ];
  }, [resumoConsolidado]);

  const despesasPorCategoria = useMemo(() => {
    const map = new Map();
    despesasOrcamento.forEach((d) => {
      const ocorrencias = countOcorrencias(d, mesesSelecionados);
      if (ocorrencias === 0) return;
      const nome = getCategoriaNome(d);
      const val = parseFloat(d.valor) || 0;
      const previsto = val * ocorrencias;
      const pago = d.status === "Pago" ? val * ocorrencias : 0;
      const current = map.get(nome) || { categoria: nome, previsto: 0, pago: 0 };
      map.set(nome, {
        categoria: nome,
        previsto: current.previsto + previsto,
        pago: current.pago + pago
      });
    });
    return Array.from(map.values()).map((item) => ({
      ...item,
      diferenca: item.previsto - item.pago
    }));
  }, [despesasOrcamento, mesesSelecionados, countOcorrencias, getCategoriaNome]);

  const receitasPorCategoria = useMemo(() => {
    const map = new Map();
    receitasOrcamento.forEach((r) => {
      const ocorrencias = countOcorrencias(r, mesesSelecionados);
      if (ocorrencias === 0) return;
      const nome = getCategoriaNome(r);
      const val = parseFloat(r.valor) || 0;
      const previsto = val * ocorrencias;
      const recebido = r.status === "Recebido" ? val * ocorrencias : 0;
      const current = map.get(nome) || { categoria: nome, previsto: 0, recebido: 0 };
      map.set(nome, {
        categoria: nome,
        previsto: current.previsto + previsto,
        recebido: current.recebido + recebido
      });
    });
    const totalRecebido = Array.from(map.values()).reduce((acc, item) => acc + item.recebido, 0);
    return Array.from(map.values()).map((item) => ({
      ...item,
      percentual: totalRecebido ? (item.recebido / totalRecebido) * 100 : 0
    }));
  }, [receitasOrcamento, mesesSelecionados, countOcorrencias, getCategoriaNome]);

  // Dados para gráficos de pizza
  const despesasPieData = useMemo(() => {
    return despesasPorCategoria
      .sort((a, b) => b.pago - a.pago)
      .slice(0, 5)
      .map((item) => ({ name: item.categoria, value: item.pago }));
  }, [despesasPorCategoria]);

  const receitasPieData = useMemo(() => {
    return receitasPorCategoria
      .sort((a, b) => b.recebido - a.recebido)
      .slice(0, 5)
      .map((item) => ({ name: item.categoria, value: item.recebido }));
  }, [receitasPorCategoria]);

  const gastosPorDescricao = useMemo(() => {
    const map = new Map();
    despesasOrcamento.forEach((d) => {
      const monthsItem = getMesesItem(d).filter((m) => mesesSelecionados.includes(m));
      if (monthsItem.length === 0) return;
      const descricao = d.descricao || "Sem descrição";
      const val = parseFloat(d.valor) || 0;
      const previsto = val * monthsItem.length;
      const pago = d.status === "Pago" ? val * monthsItem.length : 0;
      const current = map.get(descricao) || {
        descricao,
        ocorrencias: 0,
        previsto: 0,
        pago: 0,
        meses: new Set(),
        tipos: new Set()
      };
      monthsItem.forEach((mes) => current.meses.add(mes));
      if (d.tipoRecorrencia) current.tipos.add(d.tipoRecorrencia);
      map.set(descricao, {
        ...current,
        ocorrencias: current.ocorrencias,
        previsto: current.previsto + previsto,
        pago: current.pago + pago,
        meses: current.meses
      });
    });
    return Array.from(map.values()).map((item) => ({
      ...item,
      media: item.ocorrencias ? item.previsto / item.ocorrencias : 0
    }));
  }, [despesasOrcamento, mesesSelecionados, getMesesItem]);

  const recorrentesOcultos = useMemo(() => {
    return gastosPorDescricao
      .filter((item) => item.meses.size > 1 && !item.tipos.has("FIXO"))
      .map((item) => ({
        descricao: item.descricao,
        meses: item.meses.size,
        ocorrencias: item.ocorrencias,
        previsto: item.previsto,
        pago: item.pago
      }));
  }, [gastosPorDescricao]);

  const analiseCartao = useMemo(() => {
    const rows = [];
    cartoes.forEach((cartao) => {
      mesesSelecionados.forEach((mes) => {
        const lancamentosMes = lancamentosCartao.filter((l) =>
          l.cartaoId === cartao.id &&
          (l.mesReferencia === mes || (l.meses && l.meses.includes(mes)))
        );
        const fixoParcelado = lancamentosMes.reduce((acc, l) => {
          const val = parseFloat(l.valor) || 0;
          if (l.tipoRecorrencia === "FIXO" || l.tipoRecorrencia === "PARCELADO") return acc + val;
          return acc;
        }, 0);
        const gastosMes = lancamentosMes.reduce((acc, l) => {
          const val = parseFloat(l.valor) || 0;
          if (l.tipoRecorrencia === "FIXO" || l.tipoRecorrencia === "PARCELADO") return acc;
          return acc + val;
        }, 0);
        const totalMes = fixoParcelado + gastosMes;
        const limitesMensais = cartao.limitesMensais || {};
        const valorAlocado = limitesMensais[mes] !== undefined && limitesMensais[mes] !== null && limitesMensais[mes] !== ""
          ? parseFloat(limitesMensais[mes]) || 0
          : parseFloat(cartao.limite) || 0;
        const saldoMes = valorAlocado - totalMes;
        const isFechada = cartao.faturasFechadas?.includes(mes) || false;
        if (lancamentosMes.length > 0 || valorAlocado > 0 || isFechada) {
          rows.push({
            cartao: cartao.nome,
            mes,
            valorAlocado,
            fixoParcelado,
            gastosMes,
            totalMes,
            saldoMes,
            situacao: isFechada ? "Fechada" : "Aberta"
          });
        }
      });
    });
    return rows;
  }, [cartoes, lancamentosCartao, mesesSelecionados]);

  const resumoAnual = useMemo(() => {
    const base = mesesOrcamento.map((mes) => {
      const resumo = calcResumo([mes]);
      const saldoMes = resumo.recRecebido - resumo.despPago;
      return {
        mes,
        ...resumo,
        saldoMes
      };
    });
    return base.map((item, index) => {
      const saldoAcumulado = base
        .slice(0, index + 1)
        .reduce((acc, current) => acc + current.saldoMes, 0);
      return { ...item, saldoAcumulado };
    });
  }, [mesesOrcamento, calcResumo]);

  const saldoPrevisto = resumoConsolidado.recPrevisto - resumoConsolidado.despPrevisto;
  const saldoEmConta = resumoConsolidado.recRecebido - resumoConsolidado.despPago;

  // Tabs configuration
  const tabs = [
    { id: 'resumo', label: 'Resumo', icon: '📊' },
    { id: 'evolucao', label: 'Evolução', icon: '📈' },
    { id: 'categorias', label: 'Categorias', icon: '🏷️' },
    { id: 'cartoes', label: 'Cartões', icon: '💳' },
    { id: 'analise', label: 'Análise', icon: '🔍' }
  ];

  // Series para gráficos
  const areaSeries = [
    { dataKey: 'receitas', name: 'Receitas', color: '#10B981' },
    { dataKey: 'despesas', name: 'Despesas', color: '#EF4444' }
  ];

  // Calcular variação
  const variacaoReceitas = resumoConsolidado.recPrevisto > 0 
    ? ((resumoConsolidado.recRecebido - resumoConsolidado.recPrevisto) / resumoConsolidado.recPrevisto * 100).toFixed(1)
    : 0;
  const variacaoDespesas = resumoConsolidado.despPrevisto > 0
    ? ((resumoConsolidado.despPago - resumoConsolidado.despPrevisto) / resumoConsolidado.despPrevisto * 100).toFixed(1)
    : 0;

  return (
    <div className="page-grid reports-page">
      {/* Header com filtros */}
      <section className="panel reports-header">
        <div className="reports-header__content">
          <form className="form-inline reports-filters" onSubmit={(event) => event.preventDefault()}>
            <label className="field">
              Orçamento
              <select
                value={effectiveOrcamentoId}
                onChange={(event) => setFilters((prev) => ({ ...prev, orcamentoId: event.target.value }))}
              >
                {orcamentos.length === 0 ? (
                  <option value="">Sem orçamentos</option>
                ) : (
                  orcamentos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="field">
              Início
              <select
                value={mesInicio || ""}
                onChange={(event) => setFilters((prev) => ({ ...prev, mesInicio: event.target.value }))}
              >
                {mesesOrcamento.map((mes) => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Fim
              <select
                value={mesFim || ""}
                onChange={(event) => setFilters((prev) => ({ ...prev, mesFim: event.target.value }))}
              >
                {mesesOrcamento.map((mes) => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Visão
              <select
                value={filters.visao}
                onChange={(event) => setFilters((prev) => ({ ...prev, visao: event.target.value }))}
              >
                <option value="Mensal">Mensal</option>
                <option value="Acumulada">Acumulada</option>
              </select>
            </label>
          </form>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="panel">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </section>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Tab Resumo */}
        {activeTab === 'resumo' && (
          <>
            <section className="panel">
              <KPICard
                title="Saldo do Período"
                value={formatCurrency(saldoEmConta)}
                subtitle={`${mesesSelecionados.length} mês(es) selecionado(s)`}
                color={saldoEmConta >= 0 ? 'positive' : 'negative'}
              >
                <div className="kpi-card__details">
                  <div className="kpi-card__detail-row">
                    <span>Previsto:</span>
                    <strong>{formatCurrency(saldoPrevisto)}</strong>
                  </div>
                </div>
              </KPICard>
            </section>

            <section className="panel">
              <div className="report-summary-grid">
                <div className="report-summary-item">
                  <div className="report-summary-item__label">Total Receitas</div>
                  <div className="report-summary-item__value report-summary-item__value--positive">
                    {formatCurrency(resumoConsolidado.recRecebido)}
                  </div>
                  <div className="report-summary-item__sub">
                    Previsto: {formatCurrency(resumoConsolidado.recPrevisto)}
                  </div>
                </div>
                <div className="report-summary-item">
                  <div className="report-summary-item__label">Total Despesas</div>
                  <div className="report-summary-item__value report-summary-item__value--negative">
                    {formatCurrency(resumoConsolidado.despPago)}
                  </div>
                  <div className="report-summary-item__sub">
                    Previsto: {formatCurrency(resumoConsolidado.despPrevisto)}
                  </div>
                </div>
                <div className="report-summary-item">
                  <div className="report-summary-item__label">Variação Receitas</div>
                  <div className={`report-summary-item__value ${parseFloat(variacaoReceitas) >= 0 ? 'report-summary-item__value--positive' : 'report-summary-item__value--negative'}`}>
                    {parseFloat(variacaoReceitas) >= 0 ? '+' : ''}{variacaoReceitas}%
                  </div>
                </div>
                <div className="report-summary-item">
                  <div className="report-summary-item__label">Variação Despesas</div>
                  <div className={`report-summary-item__value ${parseFloat(variacaoDespesas) <= 0 ? 'report-summary-item__value--positive' : 'report-summary-item__value--negative'}`}>
                    {parseFloat(variacaoDespesas) >= 0 ? '+' : ''}{variacaoDespesas}%
                  </div>
                </div>
              </div>
            </section>

            <section className="panel">
              <h3 className="panel-title">Comparativo Previsto x Realizado</h3>
              <div className="charts-grid charts-grid--single">
                <HorizontalBar
                  data={[
                    { name: 'Receitas Previsto', value: resumoConsolidado.recPrevisto },
                    { name: 'Receitas Realizado', value: resumoConsolidado.recRecebido },
                    { name: 'Despesas Previsto', value: resumoConsolidado.despPrevisto },
                    { name: 'Despesas Realizado', value: resumoConsolidado.despPago }
                  ]}
                  height={150}
                  colors={['#86EFAC', '#10B981', '#FCA5A5', '#EF4444']}
                />
              </div>
            </section>
          </>
        )}

        {/* Tab Evolução */}
        {activeTab === 'evolucao' && (
          <>
            <section className="panel">
              <h3 className="panel-title">Evolução Mensal</h3>
              <AreaChart
                data={evolucaoChartData}
                series={areaSeries}
                height={300}
                showGrid={true}
                showLegend={true}
              />
            </section>

            <section className="panel">
              <h3 className="panel-title">Detalhes por Mês</h3>
              <div className="table">
                <div className="table-row table-header cols-7">
                  <span>Mês</span>
                  <span>Rec. Previsto</span>
                  <span>Rec. Recebido</span>
                  <span>Desp. Previsto</span>
                  <span>Desp. Pago</span>
                  <span>Saldo</span>
                  <span>Acumulado</span>
                </div>
                {evolucaoMensalComAcumulado.length === 0 ? (
                  <div className="table-row empty cols-7">
                    <span>Sem dados para o período.</span>
                  </div>
                ) : (
                  evolucaoMensalComAcumulado.map((item) => (
                    <div className="table-row cols-7" key={item.mes}>
                      <span>{item.mes}</span>
                      <span>{formatCurrency(item.recPrevisto)}</span>
                      <span className="summary-card-value--positive">{formatCurrency(item.recRecebido)}</span>
                      <span>{formatCurrency(item.despPrevisto)}</span>
                      <span className="summary-card-value--negative">{formatCurrency(item.despPago)}</span>
                      <span className={item.saldoMes >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}>
                        {formatCurrency(item.saldoMes)}
                      </span>
                      <span className={item.saldoAcumulado >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}>
                        {formatCurrency(item.saldoAcumulado)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* Tab Categorias */}
        {activeTab === 'categorias' && (
          <section className="panel">
            <h3 className="panel-title">Análise por Categorias</h3>
            <div className="charts-grid">
              <div className="report-card">
                <h4 className="report-card__title">Despesas por Categoria</h4>
                {despesasPieData.length > 0 ? (
                  <PieChart
                    data={despesasPieData}
                    height={250}
                    showLegend={true}
                  />
                ) : (
                  <div className="chart-empty" style={{ height: 250 }}>
                    <p>Sem despesas no período</p>
                  </div>
                )}
              </div>
              <div className="report-card">
                <h4 className="report-card__title">Receitas por Categoria</h4>
                {receitasPieData.length > 0 ? (
                  <PieChart
                    data={receitasPieData}
                    height={250}
                    showLegend={true}
                    colors={['#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6']}
                  />
                ) : (
                  <div className="chart-empty" style={{ height: 250 }}>
                    <p>Sem receitas no período</p>
                  </div>
                )}
              </div>
            </div>

            <div className="accordion accordion--open">
              <div className="accordion__header">
                <h4 className="accordion__title">Ver todas as categorias de despesas</h4>
                <span className="accordion__icon">▼</span>
              </div>
              <div className="accordion__content">
                <div className="table">
                  <div className="table-row table-header cols-4">
                    <span>Categoria</span>
                    <span>Previsto</span>
                    <span>Pago</span>
                    <span>Diferença</span>
                  </div>
                  {despesasPorCategoria.map((item) => (
                    <div className="table-row cols-4" key={item.categoria}>
                      <span>{item.categoria}</span>
                      <span>{formatCurrency(item.previsto)}</span>
                      <span>{formatCurrency(item.pago)}</span>
                      <span className={item.diferenca >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}>
                        {formatCurrency(item.diferenca)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab Cartões */}
        {activeTab === 'cartoes' && (
          <section className="panel">
            <h3 className="panel-title">Análise de Cartões de Crédito</h3>
            
            {analiseCartao.length > 0 ? (
              <>
                <div className="report-summary-grid">
                  <div className="report-summary-item">
                    <div className="report-summary-item__label">Total Utilizado</div>
                    <div className="report-summary-item__value report-summary-item__value--negative">
                      {formatCurrency(analiseCartao.reduce((acc, item) => acc + item.totalMes, 0))}
                    </div>
                  </div>
                  <div className="report-summary-item">
                    <div className="report-summary-item__label">Total Alocado</div>
                    <div className="report-summary-item__value">
                      {formatCurrency(analiseCartao.reduce((acc, item) => acc + item.valorAlocado, 0))}
                    </div>
                  </div>
                </div>

                <div className="table">
                  <div className="table-row table-header cols-8">
                    <span>Cartão</span>
                    <span>Mês</span>
                    <span>Alocado</span>
                    <span>Fixo/Parcelado</span>
                    <span>Gastos</span>
                    <span>Total</span>
                    <span>Saldo</span>
                    <span>Status</span>
                  </div>
                  {analiseCartao.map((item, index) => (
                    <div className="table-row cols-8" key={`${item.cartao}-${item.mes}-${index}`}>
                      <span>{item.cartao}</span>
                      <span>{item.mes}</span>
                      <span>{formatCurrency(item.valorAlocado)}</span>
                      <span>{formatCurrency(item.fixoParcelado)}</span>
                      <span>{formatCurrency(item.gastosMes)}</span>
                      <span>{formatCurrency(item.totalMes)}</span>
                      <span className={item.saldoMes >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}>
                        {formatCurrency(item.saldoMes)}
                      </span>
                      <span>
                        <span className={`status-badge ${item.situacao === 'Fechada' ? 'status-badge--closed' : 'status-badge--open'}`}>
                          {item.situacao}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-empty" style={{ height: 200 }}>
                <p>Sem dados de cartão no período selecionado</p>
              </div>
            )}
          </section>
        )}

        {/* Tab Análise */}
        {activeTab === 'analise' && (
          <section className="panel">
            <h3 className="panel-title">Análises Especiais</h3>
            
            {/* Gastos Recorrentes Ocultos */}
            {recorrentesOcultos.length > 0 && (
              <div className="report-card">
                <h4 className="report-card__title">⚠️ Gastos Recorrentes Ocultos</h4>
                <p className="report-card__subtitle">
                  Identificamos {recorrentesOcultos.length} gastos que aparecem em múltiplos meses mas não estão marcados como recorrentes:
                </p>
                <div className="hidden-recurring-list">
                  {recorrentesOcultos.slice(0, 5).map((item) => (
                    <div className="hidden-recurring-item" key={item.descricao}>
                      <div>
                        <span className="hidden-recurring-item__description">{item.descricao}</span>
                        <span className="report-summary-item__sub"> - {item.meses} meses</span>
                      </div>
                      <span className="hidden-recurring-item__value">{formatCurrency(item.previsto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="report-card">
              <h4 className="report-card__title">💡 Insights</h4>
              <div className="insights-list">
                {resumoConsolidado.recRecebido > resumoConsolidado.recPrevisto && (
                  <div className="insight-item">
                    <span className="insight-item__icon">📈</span>
                    <span className="insight-item__text">
                      Você recebeu {formatPercent(Math.abs(variacaoReceitas))} a mais do que o previsto em receitas
                    </span>
                  </div>
                )}
                {resumoConsolidado.despPago < resumoConsolidado.despPrevisto && (
                  <div className="insight-item">
                    <span className="insight-item__icon">📉</span>
                    <span className="insight-item__text">
                      Você gastou {formatPercent(Math.abs(variacaoDespesas))} a menos do que o previsto em despesas
                    </span>
                  </div>
                )}
                {despesasPorCategoria.length > 0 && (
                  <div className="insight-item">
                    <span className="insight-item__icon">🏷️</span>
                    <span className="insight-item__text">
                      Sua maior categoria de despesa é <strong>{despesasPorCategoria[0]?.categoria}</strong> 
                      com {formatCurrency(despesasPorCategoria[0]?.pago)}
                    </span>
                  </div>
                )}
                {saldoEmConta >= 0 && (
                  <div className="insight-item">
                    <span className="insight-item__icon">✅</span>
                    <span className="insight-item__text">
                      Seu saldo está positivo no período: {formatCurrency(saldoEmConta)}
                    </span>
                  </div>
                )}
                {saldoEmConta < 0 && (
                  <div className="insight-item">
                    <span className="insight-item__icon">⚠️</span>
                    <span className="insight-item__text">
                      Atenção: seu saldo está negativo no período: {formatCurrency(saldoEmConta)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Gastos por Descrição */}
            <div className="accordion">
              <div className="accordion__header">
                <h4 className="accordion__title">Ver todos os gastos por descrição</h4>
                <span className="accordion__icon">▼</span>
              </div>
              <div className="accordion__content">
                <div className="table">
                  <div className="table-row table-header cols-5-report">
                    <span>Descrição</span>
                    <span>Ocorrências</span>
                    <span>Previsto</span>
                    <span>Pago</span>
                    <span>Média</span>
                  </div>
                  {gastosPorDescricao.slice(0, 20).map((item) => (
                    <div className="table-row cols-5-report" key={item.descricao}>
                      <span>{item.descricao}</span>
                      <span>{item.ocorrencias}</span>
                      <span>{formatCurrency(item.previsto)}</span>
                      <span>{formatCurrency(item.pago)}</span>
                      <span>{formatCurrency(item.media)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export { RelatoriosPage };
