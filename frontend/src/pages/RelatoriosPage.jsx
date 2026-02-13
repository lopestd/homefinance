import { useCallback, useMemo } from "react";
import useRelatorios from "../hooks/useRelatorios";
import { formatCurrency } from "../utils/appUtils";

const RelatoriosPage = ({
  orcamentos,
  receitas,
  despesas,
  cartoes,
  lancamentosCartao,
  categorias
}) => {
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
  const saldoAcumuladoPrevisto = saldoPrevisto;

  return (
    <div className="page-grid">
      <section className="panel filters-panel">
        <div className="panel-header">
          <div>
            <h2>Relatórios Analíticos</h2>
          </div>
        </div>
        <form className="form-inline" onSubmit={(event) => event.preventDefault()}>
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
            Mês inicial
            <select
              value={mesInicio || ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, mesInicio: event.target.value }))}
            >
              {mesesOrcamento.length === 0 ? (
                <option value="">Sem meses configurados</option>
              ) : (
                mesesOrcamento.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="field">
            Mês final
            <select
              value={mesFim || ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, mesFim: event.target.value }))}
            >
              {mesesOrcamento.length === 0 ? (
                <option value="">Sem meses configurados</option>
              ) : (
                mesesOrcamento.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes}
                  </option>
                ))
              )}
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
      </section>

      <section className="panel">
        <h3>Resumo Financeiro Consolidado</h3>
        <div className="dashboard-grid">
          <div className="summary-card">
            <span className="summary-title">Receitas</span>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Previsto:</span>
              <strong>{formatCurrency(resumoConsolidado.recPrevisto)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Recebido:</span>
              <strong>{formatCurrency(resumoConsolidado.recRecebido)}</strong>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-title">Despesas</span>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Previsto:</span>
              <strong>{formatCurrency(resumoConsolidado.despPrevisto)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Pago:</span>
              <strong>{formatCurrency(resumoConsolidado.despPago)}</strong>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-title">Saldo</span>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Previsto:</span>
              <strong>{formatCurrency(saldoPrevisto)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Em conta:</span>
              <strong>{formatCurrency(saldoEmConta)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Acumulado (previsão):</span>
              <strong>{formatCurrency(saldoAcumuladoPrevisto)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Evolução Mensal do Orçamento</h3>
        <div className="table">
          <div className="table-row table-header cols-7">
            <span>Mês</span>
            <span>Rec. Previsto</span>
            <span>Rec. Recebido</span>
            <span>Desp. Previsto</span>
            <span>Desp. Pago</span>
            <span>Saldo do Mês</span>
            <span>Saldo Acumulado</span>
          </div>
          {evolucaoMensalComAcumulado.length === 0 ? (
            <div className="table-row empty cols-7">
              <span>Sem dados para o período selecionado.</span>
            </div>
          ) : (
            evolucaoMensalComAcumulado.map((item) => (
              <div className="table-row cols-7" key={item.mes}>
                <span>{item.mes}</span>
                <span>{formatCurrency(item.recPrevisto)}</span>
                <span>{formatCurrency(item.recRecebido)}</span>
                <span>{formatCurrency(item.despPrevisto)}</span>
                <span>{formatCurrency(item.despPago)}</span>
                <span>{formatCurrency(item.saldoMes)}</span>
                <span>{formatCurrency(item.saldoAcumulado)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Comparativo Planejado x Realizado</h3>
        <div className="table">
          <div className="table-row table-header cols-3">
            <span>Tipo</span>
            <span>Diferença (R$)</span>
            <span>Diferença (%)</span>
          </div>
          {comparativoPlanejado.map((item) => (
            <div className="table-row cols-3" key={item.tipo}>
              <span>{item.tipo}</span>
              <span>{formatCurrency(item.diff)}</span>
              <span>{formatPercent(item.percent)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Despesas por Categoria</h3>
        <div className="table">
          <div className="table-row table-header cols-4">
            <span>Categoria</span>
            <span>Total previsto</span>
            <span>Total pago</span>
            <span>Diferença</span>
          </div>
          {despesasPorCategoria.length === 0 ? (
            <div className="table-row empty cols-4">
              <span>Sem despesas no período selecionado.</span>
            </div>
          ) : (
            despesasPorCategoria.map((item) => (
              <div className="table-row cols-4" key={item.categoria}>
                <span>{item.categoria}</span>
                <span>{formatCurrency(item.previsto)}</span>
                <span>{formatCurrency(item.pago)}</span>
                <span>{formatCurrency(item.diferenca)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Receitas por Categoria</h3>
        <div className="table">
          <div className="table-row table-header cols-4">
            <span>Categoria</span>
            <span>Total previsto</span>
            <span>Total recebido</span>
            <span>Percentual</span>
          </div>
          {receitasPorCategoria.length === 0 ? (
            <div className="table-row empty cols-4">
              <span>Sem receitas no período selecionado.</span>
            </div>
          ) : (
            receitasPorCategoria.map((item) => (
              <div className="table-row cols-4" key={item.categoria}>
                <span>{item.categoria}</span>
                <span>{formatCurrency(item.previsto)}</span>
                <span>{formatCurrency(item.recebido)}</span>
                <span>{formatPercent(item.percentual)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Gastos por Descrição (Gastos Idênticos)</h3>
        <div className="table">
          <div className="table-row table-header cols-5-report">
            <span>Descrição</span>
            <span>Ocorrências</span>
            <span>Total previsto</span>
            <span>Total pago</span>
            <span>Valor médio</span>
          </div>
          {gastosPorDescricao.length === 0 ? (
            <div className="table-row empty cols-5-report">
              <span>Sem gastos no período selecionado.</span>
            </div>
          ) : (
            gastosPorDescricao.map((item) => (
              <div className="table-row cols-5-report" key={item.descricao}>
                <span>{item.descricao}</span>
                <span>{item.ocorrencias}</span>
                <span>{formatCurrency(item.previsto)}</span>
                <span>{formatCurrency(item.pago)}</span>
                <span>{formatCurrency(item.media)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Gastos Recorrentes Ocultos</h3>
        <div className="table">
          <div className="table-row table-header cols-4">
            <span>Descrição</span>
            <span>Meses distintos</span>
            <span>Ocorrências</span>
            <span>Total previsto</span>
          </div>
          {recorrentesOcultos.length === 0 ? (
            <div className="table-row empty cols-4">
              <span>Sem gastos recorrentes ocultos no período.</span>
            </div>
          ) : (
            recorrentesOcultos.map((item) => (
              <div className="table-row cols-4" key={item.descricao}>
                <span>{item.descricao}</span>
                <span>{item.meses}</span>
                <span>{item.ocorrencias}</span>
                <span>{formatCurrency(item.previsto)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Análise do Cartão de Crédito</h3>
        <div className="table">
          <div className="table-row table-header cols-8">
            <span>Cartão</span>
            <span>Mês</span>
            <span>Valor alocado</span>
            <span>Fixo/Parcelado</span>
            <span>Gastos do mês</span>
            <span>Total do mês</span>
            <span>Saldo do mês</span>
            <span>Situação</span>
          </div>
          {analiseCartao.length === 0 ? (
            <div className="table-row empty cols-8">
              <span>Sem dados de cartão no período selecionado.</span>
            </div>
          ) : (
            analiseCartao.map((item, index) => (
              <div className="table-row cols-8" key={`${item.cartao}-${item.mes}-${index}`}>
                <span>{item.cartao}</span>
                <span>{item.mes}</span>
                <span>{formatCurrency(item.valorAlocado)}</span>
                <span>{formatCurrency(item.fixoParcelado)}</span>
                <span>{formatCurrency(item.gastosMes)}</span>
                <span>{formatCurrency(item.totalMes)}</span>
                <span>{formatCurrency(item.saldoMes)}</span>
                <span>{item.situacao}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Resumo Anual por Mês</h3>
        <div className="table">
          <div className="table-row table-header cols-7">
            <span>Mês</span>
            <span>Rec. Previsto</span>
            <span>Rec. Recebido</span>
            <span>Desp. Previsto</span>
            <span>Desp. Pago</span>
            <span>Saldo do Mês</span>
            <span>Saldo Acumulado</span>
          </div>
          {resumoAnual.length === 0 ? (
            <div className="table-row empty cols-7">
              <span>Sem dados para o orçamento selecionado.</span>
            </div>
          ) : (
            resumoAnual.map((item) => (
              <div className="table-row cols-7" key={`anual-${item.mes}`}>
                <span>{item.mes}</span>
                <span>{formatCurrency(item.recPrevisto)}</span>
                <span>{formatCurrency(item.recRecebido)}</span>
                <span>{formatCurrency(item.despPrevisto)}</span>
                <span>{formatCurrency(item.despPago)}</span>
                <span>{formatCurrency(item.saldoMes)}</span>
                <span>{formatCurrency(item.saldoAcumulado)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export { RelatoriosPage };
