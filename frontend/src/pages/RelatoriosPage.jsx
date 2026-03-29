import { useCallback, useMemo, useState } from "react";
import useRelatorios from "../hooks/useRelatorios";
import useSaldoAcumulado from "../hooks/useSaldoAcumulado";
import { formatCurrency } from "../utils/appUtils";
import { TabNavigation } from "../components/reports";
import { AreaChart, HorizontalBar, PieChart } from "../components/charts";
import { KPICard } from "../components/dashboard";

const CREDITO_TAG = "[CREDITO]";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const stripCreditoTag = (descricao) => {
  const text = String(descricao || "").trim();
  if (text === CREDITO_TAG) return "";
  if (text.startsWith(`${CREDITO_TAG} `)) return text.slice(CREDITO_TAG.length).trim();
  return text;
};

const isCreditoLancamento = (lancamento) =>
  Number(lancamento?.valor) < 0 || String(lancamento?.descricao || "").startsWith(CREDITO_TAG);

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
};

const MetricCard = ({ title, value, subtitle, tone = "neutral" }) => (
  <div className={`reports-metric-card reports-metric-card--${tone}`}>
    <span className="reports-metric-card__label">{title}</span>
    <strong className="reports-metric-card__value">{value}</strong>
    {subtitle ? <span className="reports-metric-card__subtitle">{subtitle}</span> : null}
  </div>
);

const DataTable = ({ columns, rows, emptyMessage, className = "" }) => (
  <div className={`reports-table ${className}`.trim()}>
    <table className="reports-table__table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="reports-table__empty">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row, index) => (
            <tr key={row.id || `${row.categoria || row.mes || "row"}-${index}`}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const RelatoriosPage = ({
  orcamentos,
  receitas,
  despesas,
  cartoes,
  lancamentosCartao,
  categorias
}) => {
  const [activeTab, setActiveTab] = useState("visao-geral");

  const {
    filters,
    setFilters,
    effectiveOrcamentoId,
    mesesOrcamento,
    mesInicio,
    mesFim,
    mesesSelecionados
  } = useRelatorios(orcamentos);

  const currentOrcamento = useMemo(
    () => orcamentos.find((orcamento) => orcamento.id === effectiveOrcamentoId),
    [orcamentos, effectiveOrcamentoId]
  );

  const anoOrcamento = Number.parseInt(currentOrcamento?.label, 10) || new Date().getFullYear();
  const { saldos } = useSaldoAcumulado(effectiveOrcamentoId, anoOrcamento);

  const saldoAcumuladoMap = useMemo(() => {
    const map = new Map();
    (saldos || []).forEach((saldo) => {
      map.set(saldo.mesNome, Number(saldo.saldoFinal) || 0);
    });
    return map;
  }, [saldos]);

  const categoriasMap = useMemo(
    () => new Map((categorias || []).map((categoria) => [categoria.id, categoria.nome])),
    [categorias]
  );

  const cartoesMap = useMemo(
    () => new Map((cartoes || []).map((cartao) => [String(cartao.id), cartao])),
    [cartoes]
  );

  const mesesSelecionadosSet = useMemo(() => new Set(mesesSelecionados), [mesesSelecionados]);

  const getCategoriaNome = useCallback(
    (item) => item.categoria || categoriasMap.get(item.categoriaId) || "Sem categoria",
    [categoriasMap]
  );

  const getMesesItem = useCallback((item) => {
    if (Array.isArray(item.meses) && item.meses.length > 0) return item.meses;
    if (item.mesReferencia) return [item.mesReferencia];
    if (item.mes) return [item.mes];
    return [];
  }, []);

  const countOcorrencias = useCallback(
    (item, validMonthsSet) => getMesesItem(item).filter((mes) => validMonthsSet.has(mes)).length,
    [getMesesItem]
  );

  const receitasOrcamento = useMemo(
    () => receitas.filter((receita) => receita.orcamentoId === effectiveOrcamentoId),
    [receitas, effectiveOrcamentoId]
  );

  const despesasOrcamento = useMemo(
    () => despesas.filter((despesa) => despesa.orcamentoId === effectiveOrcamentoId),
    [despesas, effectiveOrcamentoId]
  );

  const isFaturaTecnica = useCallback((despesa) => {
    const descricao = normalizeText(despesa.descricao);
    return (
      descricao.startsWith("fatura do cartao ") ||
      descricao.startsWith("pagamento da fatura do cartao ") ||
      descricao.startsWith("fatura cartao ")
    );
  }, []);

  const isDespesaFinanceira = useCallback(
    (despesa) => {
      if (isFaturaTecnica(despesa)) return false;
      const categoria = normalizeText(getCategoriaNome(despesa));
      const descricao = normalizeText(despesa.descricao);
      return (
        categoria === "bancos/cartoes" ||
        categoria === "emprestimos" ||
        categoria === "financiamentos" ||
        descricao.includes("emprestimo") ||
        descricao.includes("financiamento") ||
        descricao.includes("juros") ||
        descricao.includes("tarifa") ||
        descricao.includes("anuidade") ||
        descricao.includes("iof")
      );
    },
    [getCategoriaNome, isFaturaTecnica]
  );

  const despesasOperacionais = useMemo(
    () => despesasOrcamento.filter((despesa) => !isFaturaTecnica(despesa) && !isDespesaFinanceira(despesa)),
    [despesasOrcamento, isFaturaTecnica, isDespesaFinanceira]
  );

  const despesasFinanceiras = useMemo(
    () => despesasOrcamento.filter((despesa) => !isFaturaTecnica(despesa) && isDespesaFinanceira(despesa)),
    [despesasOrcamento, isFaturaTecnica, isDespesaFinanceira]
  );

  const despesasTecnicas = useMemo(
    () => despesasOrcamento.filter((despesa) => isFaturaTecnica(despesa)),
    [despesasOrcamento, isFaturaTecnica]
  );

  const lancamentosPeriodo = useMemo(
    () => lancamentosCartao.filter((lancamento) => countOcorrencias(lancamento, mesesSelecionadosSet) > 0),
    [lancamentosCartao, countOcorrencias, mesesSelecionadosSet]
  );

  const lancamentosDebito = useMemo(
    () => lancamentosPeriodo.filter((lancamento) => !isCreditoLancamento(lancamento)),
    [lancamentosPeriodo]
  );

  const lancamentosCredito = useMemo(
    () => lancamentosPeriodo.filter((lancamento) => isCreditoLancamento(lancamento)),
    [lancamentosPeriodo]
  );

  const calcResumoFluxo = useCallback(
    (monthsSet) => {
      let receitasPrevistas = 0;
      let receitasRecebidas = 0;
      let despesasPrevistas = 0;
      let despesasPagas = 0;

      receitasOrcamento.forEach((receita) => {
        const ocorrencias = countOcorrencias(receita, monthsSet);
        if (ocorrencias === 0) return;
        const valor = Number(receita.valor) || 0;
        receitasPrevistas += valor * ocorrencias;
        if (receita.status === "Recebido") receitasRecebidas += valor * ocorrencias;
      });

      despesasOrcamento.forEach((despesa) => {
        const ocorrencias = countOcorrencias(despesa, monthsSet);
        if (ocorrencias === 0) return;
        const valor = Number(despesa.valor) || 0;
        despesasPrevistas += valor * ocorrencias;
        if (despesa.status === "Pago") despesasPagas += valor * ocorrencias;
      });

      return { receitasPrevistas, receitasRecebidas, despesasPrevistas, despesasPagas };
    },
    [receitasOrcamento, despesasOrcamento, countOcorrencias]
  );

  const fluxoConsolidado = useMemo(
    () => (mesesSelecionados.length === 0 ? {
      receitasPrevistas: 0,
      receitasRecebidas: 0,
      despesasPrevistas: 0,
      despesasPagas: 0
    } : calcResumoFluxo(mesesSelecionadosSet)),
    [mesesSelecionados.length, calcResumoFluxo, mesesSelecionadosSet]
  );

  const totaisOperacionais = useMemo(() => {
    let previsto = 0;
    let pago = 0;
    despesasOperacionais.forEach((despesa) => {
      const ocorrencias = countOcorrencias(despesa, mesesSelecionadosSet);
      if (ocorrencias === 0) return;
      const valor = Number(despesa.valor) || 0;
      previsto += valor * ocorrencias;
      if (despesa.status === "Pago") pago += valor * ocorrencias;
    });
    return { previsto, pago, aberto: previsto - pago };
  }, [despesasOperacionais, countOcorrencias, mesesSelecionadosSet]);

  const totaisFinanceiros = useMemo(() => {
    let previsto = 0;
    let pago = 0;
    despesasFinanceiras.forEach((despesa) => {
      const ocorrencias = countOcorrencias(despesa, mesesSelecionadosSet);
      if (ocorrencias === 0) return;
      const valor = Number(despesa.valor) || 0;
      previsto += valor * ocorrencias;
      if (despesa.status === "Pago") pago += valor * ocorrencias;
    });
    return { previsto, pago, aberto: previsto - pago };
  }, [despesasFinanceiras, countOcorrencias, mesesSelecionadosSet]);

  const totaisTecnicos = useMemo(() => {
    let previsto = 0;
    let pago = 0;
    despesasTecnicas.forEach((despesa) => {
      const ocorrencias = countOcorrencias(despesa, mesesSelecionadosSet);
      if (ocorrencias === 0) return;
      const valor = Number(despesa.valor) || 0;
      previsto += valor * ocorrencias;
      if (despesa.status === "Pago") pago += valor * ocorrencias;
    });
    return { previsto, pago, aberto: previsto - pago };
  }, [despesasTecnicas, countOcorrencias, mesesSelecionadosSet]);

  const totaisCartao = useMemo(() => {
    let consumo = 0;
    let faturaFechada = 0;
    let faturaAberta = 0;

    lancamentosDebito.forEach((lancamento) => {
      const mesesAtivos = getMesesItem(lancamento).filter((mes) => mesesSelecionadosSet.has(mes));
      if (mesesAtivos.length === 0) return;
      const valor = Math.abs(Number(lancamento.valor) || 0);
      consumo += valor * mesesAtivos.length;
      const cartao = cartoesMap.get(String(lancamento.cartaoId));
      const fechadas = cartao?.faturasFechadas || [];
      const quantidadeFechada = mesesAtivos.filter((mes) => fechadas.includes(mes)).length;
      faturaFechada += valor * quantidadeFechada;
      faturaAberta += valor * (mesesAtivos.length - quantidadeFechada);
    });

    const creditos = lancamentosCredito.reduce((acc, lancamento) => {
      const ocorrencias = countOcorrencias(lancamento, mesesSelecionadosSet);
      if (ocorrencias === 0) return acc;
      return acc + Math.abs(Number(lancamento.valor) || 0) * ocorrencias;
    }, 0);

    return { consumo, faturaFechada, faturaAberta, creditos };
  }, [lancamentosDebito, lancamentosCredito, getMesesItem, cartoesMap, countOcorrencias, mesesSelecionadosSet]);

  const saldoPrevisto = fluxoConsolidado.receitasPrevistas - fluxoConsolidado.despesasPrevistas;
  const saldoRealizado = fluxoConsolidado.receitasRecebidas - fluxoConsolidado.despesasPagas;
  const desvioReceitas = fluxoConsolidado.receitasPrevistas > 0
    ? ((fluxoConsolidado.receitasRecebidas - fluxoConsolidado.receitasPrevistas) / fluxoConsolidado.receitasPrevistas) * 100
    : 0;
  const desvioDespesas = fluxoConsolidado.despesasPrevistas > 0
    ? ((fluxoConsolidado.despesasPagas - fluxoConsolidado.despesasPrevistas) / fluxoConsolidado.despesasPrevistas) * 100
    : 0;

  const fluxoMensal = useMemo(
    () => mesesSelecionados.map((mes) => {
      const resumoMes = calcResumoFluxo(new Set([mes]));
      const saldoMes = resumoMes.receitasRecebidas - resumoMes.despesasPagas;
      return {
        id: mes,
        mes,
        receitasPrevistas: resumoMes.receitasPrevistas,
        receitasRecebidas: resumoMes.receitasRecebidas,
        despesasPrevistas: resumoMes.despesasPrevistas,
        despesasPagas: resumoMes.despesasPagas,
        saldoMes,
        saldoAcumulado: saldoAcumuladoMap.get(mes) ?? saldoMes
      };
    }),
    [mesesSelecionados, calcResumoFluxo, saldoAcumuladoMap]
  );

  const fluxoChartData = useMemo(
    () => fluxoMensal.map((item) => ({
      name: item.mes.slice(0, 3),
      receitas: item.receitasRecebidas,
      despesas: item.despesasPagas,
      saldo: item.saldoAcumulado
    })),
    [fluxoMensal]
  );

  const fluxoSeries = useMemo(
    () => [
      { dataKey: "receitas", name: "Receitas recebidas", color: "#059669" },
      { dataKey: "despesas", name: "Despesas pagas", color: "#dc2626" },
      { dataKey: "saldo", name: "Saldo acumulado", color: "#2563eb" }
    ],
    []
  );

  const categoriasDespesasDetalhadas = useMemo(() => {
    const map = new Map();
    despesasOperacionais.forEach((despesa) => {
      const ocorrencias = countOcorrencias(despesa, mesesSelecionadosSet);
      if (ocorrencias === 0) return;
      const categoria = getCategoriaNome(despesa);
      const descricao = despesa.complemento ? `${despesa.descricao} - ${despesa.complemento}` : despesa.descricao || "Sem descricao";
      const valor = Number(despesa.valor) || 0;
      const previsto = valor * ocorrencias;
      const pago = despesa.status === "Pago" ? previsto : 0;
      const key = `${categoria}::${descricao}`;
      const current = map.get(key) || { id: key, categoria, descricao, quantidade: 0, previsto: 0, pago: 0 };
      map.set(key, {
        ...current,
        quantidade: current.quantidade + ocorrencias,
        previsto: current.previsto + previsto,
        pago: current.pago + pago
      });
    });

    const rows = Array.from(map.values()).map((row) => ({ ...row, emAberto: row.previsto - row.pago }));
    const totalPrevisto = rows.reduce((acc, row) => acc + row.previsto, 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalPrevisto > 0 ? (row.previsto / totalPrevisto) * 100 : 0
    })).sort((a, b) => b.previsto - a.previsto);
  }, [despesasOperacionais, countOcorrencias, mesesSelecionadosSet, getCategoriaNome]);

  const categoriasDespesasResumo = useMemo(() => {
    const map = new Map();
    categoriasDespesasDetalhadas.forEach((row) => {
      const current = map.get(row.categoria) || { id: row.categoria, categoria: row.categoria, quantidade: 0, descricoes: 0, previsto: 0, pago: 0 };
      map.set(row.categoria, {
        ...current,
        quantidade: current.quantidade + row.quantidade,
        descricoes: current.descricoes + 1,
        previsto: current.previsto + row.previsto,
        pago: current.pago + row.pago
      });
    });

    const rows = Array.from(map.values()).map((row) => ({ ...row, emAberto: row.previsto - row.pago }));
    const totalPrevisto = rows.reduce((acc, row) => acc + row.previsto, 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalPrevisto > 0 ? (row.previsto / totalPrevisto) * 100 : 0
    })).sort((a, b) => b.previsto - a.previsto);
  }, [categoriasDespesasDetalhadas]);

  const categoriasFinanceirasDetalhadas = useMemo(() => {
    const map = new Map();
    despesasFinanceiras.forEach((despesa) => {
      const ocorrencias = countOcorrencias(despesa, mesesSelecionadosSet);
      if (ocorrencias === 0) return;
      const categoria = getCategoriaNome(despesa);
      const descricao = despesa.complemento ? `${despesa.descricao} - ${despesa.complemento}` : despesa.descricao || "Sem descricao";
      const valor = Number(despesa.valor) || 0;
      const previsto = valor * ocorrencias;
      const pago = despesa.status === "Pago" ? previsto : 0;
      const key = `${categoria}::${descricao}`;
      const current = map.get(key) || { id: key, categoria, descricao, quantidade: 0, previsto: 0, pago: 0 };
      map.set(key, {
        ...current,
        quantidade: current.quantidade + ocorrencias,
        previsto: current.previsto + previsto,
        pago: current.pago + pago
      });
    });

    const rows = Array.from(map.values()).map((row) => ({ ...row, emAberto: row.previsto - row.pago }));
    const totalPrevisto = rows.reduce((acc, row) => acc + row.previsto, 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalPrevisto > 0 ? (row.previsto / totalPrevisto) * 100 : 0
    })).sort((a, b) => b.previsto - a.previsto);
  }, [despesasFinanceiras, countOcorrencias, mesesSelecionadosSet, getCategoriaNome]);

  const categoriasCartaoDetalhadas = useMemo(() => {
    const map = new Map();
    lancamentosDebito.forEach((lancamento) => {
      const mesesAtivos = getMesesItem(lancamento).filter((mes) => mesesSelecionadosSet.has(mes));
      if (mesesAtivos.length === 0) return;
      const categoria = getCategoriaNome(lancamento);
      const descricaoBase = stripCreditoTag(lancamento.descricao) || "Sem descricao";
      const descricao = lancamento.complemento ? `${descricaoBase} - ${lancamento.complemento}` : descricaoBase;
      const valor = Math.abs(Number(lancamento.valor) || 0);
      const cartao = cartoesMap.get(String(lancamento.cartaoId));
      const fechadas = cartao?.faturasFechadas || [];
      const key = `${categoria}::${descricao}`;
      const current = map.get(key) || { id: key, categoria, descricao, quantidade: 0, consumo: 0, faturaFechada: 0, faturaAberta: 0 };
      const quantidadeFechada = mesesAtivos.filter((mes) => fechadas.includes(mes)).length;
      const quantidadeAberta = mesesAtivos.length - quantidadeFechada;
      map.set(key, {
        ...current,
        quantidade: current.quantidade + mesesAtivos.length,
        consumo: current.consumo + (valor * mesesAtivos.length),
        faturaFechada: current.faturaFechada + (valor * quantidadeFechada),
        faturaAberta: current.faturaAberta + (valor * quantidadeAberta)
      });
    });

    const rows = Array.from(map.values());
    const totalConsumo = rows.reduce((acc, row) => acc + row.consumo, 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalConsumo > 0 ? (row.consumo / totalConsumo) * 100 : 0
    })).sort((a, b) => b.consumo - a.consumo);
  }, [lancamentosDebito, getMesesItem, mesesSelecionadosSet, getCategoriaNome, cartoesMap]);

  const categoriasCartaoResumo = useMemo(() => {
    const map = new Map();
    categoriasCartaoDetalhadas.forEach((row) => {
      const current = map.get(row.categoria) || { id: row.categoria, categoria: row.categoria, quantidade: 0, descricoes: 0, consumo: 0, faturaFechada: 0, faturaAberta: 0 };
      map.set(row.categoria, {
        ...current,
        quantidade: current.quantidade + row.quantidade,
        descricoes: current.descricoes + 1,
        consumo: current.consumo + row.consumo,
        faturaFechada: current.faturaFechada + row.faturaFechada,
        faturaAberta: current.faturaAberta + row.faturaAberta
      });
    });

    const rows = Array.from(map.values());
    const totalConsumo = rows.reduce((acc, row) => acc + row.consumo, 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalConsumo > 0 ? (row.consumo / totalConsumo) * 100 : 0
    })).sort((a, b) => b.consumo - a.consumo);
  }, [categoriasCartaoDetalhadas]);

  const categoriasReceitasDetalhadas = useMemo(() => {
    const map = new Map();
    receitasOrcamento.forEach((receita) => {
      const ocorrencias = countOcorrencias(receita, mesesSelecionadosSet);
      if (ocorrencias === 0) return;
      const categoria = getCategoriaNome(receita);
      const descricao = receita.complemento ? `${receita.descricao} - ${receita.complemento}` : receita.descricao || "Sem descricao";
      const valor = Number(receita.valor) || 0;
      const previsto = valor * ocorrencias;
      const recebido = receita.status === "Recebido" ? previsto : 0;
      const key = `${categoria}::${descricao}`;
      const current = map.get(key) || { id: key, categoria, descricao, quantidade: 0, previsto: 0, recebido: 0 };
      map.set(key, {
        ...current,
        quantidade: current.quantidade + ocorrencias,
        previsto: current.previsto + previsto,
        recebido: current.recebido + recebido
      });
    });

    const rows = Array.from(map.values()).map((row) => ({ ...row, emAberto: row.previsto - row.recebido }));
    const totalPrevisto = rows.reduce((acc, row) => acc + row.previsto, 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalPrevisto > 0 ? (row.previsto / totalPrevisto) * 100 : 0
    })).sort((a, b) => b.previsto - a.previsto);
  }, [receitasOrcamento, countOcorrencias, mesesSelecionadosSet, getCategoriaNome]);

  const categoriasReceitasResumo = useMemo(() => {
    const map = new Map();
    categoriasReceitasDetalhadas.forEach((row) => {
      const current = map.get(row.categoria) || { id: row.categoria, categoria: row.categoria, quantidade: 0, descricoes: 0, previsto: 0, recebido: 0 };
      map.set(row.categoria, {
        ...current,
        quantidade: current.quantidade + row.quantidade,
        descricoes: current.descricoes + 1,
        previsto: current.previsto + row.previsto,
        recebido: current.recebido + row.recebido
      });
    });

    const rows = Array.from(map.values()).map((row) => ({ ...row, emAberto: row.previsto - row.recebido }));
    const totalPrevisto = rows.reduce((acc, row) => acc + row.previsto, 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalPrevisto > 0 ? (row.previsto / totalPrevisto) * 100 : 0
    })).sort((a, b) => b.previsto - a.previsto);
  }, [categoriasReceitasDetalhadas]);

  const categoriasTecnicasDetalhadas = useMemo(() => {
    const map = new Map();
    despesasTecnicas.forEach((despesa) => {
      const ocorrencias = countOcorrencias(despesa, mesesSelecionadosSet);
      if (ocorrencias === 0) return;
      const descricao = despesa.descricao || "Fatura tecnica";
      const valor = Number(despesa.valor) || 0;
      const previsto = valor * ocorrencias;
      const pago = despesa.status === "Pago" ? previsto : 0;
      const current = map.get(descricao) || { id: descricao, descricao, quantidade: 0, previsto: 0, pago: 0 };
      map.set(descricao, {
        ...current,
        quantidade: current.quantidade + ocorrencias,
        previsto: current.previsto + previsto,
        pago: current.pago + pago
      });
    });
    return Array.from(map.values()).map((row) => ({ ...row, emAberto: row.previsto - row.pago })).sort((a, b) => b.previsto - a.previsto);
  }, [despesasTecnicas, countOcorrencias, mesesSelecionadosSet]);

  const cartoesResumo = useMemo(() => {
    const rows = [];
    (cartoes || []).forEach((cartao) => {
      mesesSelecionados.forEach((mes) => {
        const lancamentosMes = lancamentosPeriodo.filter((lancamento) => {
          if (String(lancamento.cartaoId) !== String(cartao.id)) return false;
          return getMesesItem(lancamento).includes(mes);
        });
        const creditos = lancamentosMes.filter((lancamento) => isCreditoLancamento(lancamento)).reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);
        const debitos = lancamentosMes.filter((lancamento) => !isCreditoLancamento(lancamento)).reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);
        const fixo = lancamentosMes.filter((lancamento) => lancamento.tipoRecorrencia === "FIXO" && !isCreditoLancamento(lancamento)).reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);
        const parcelado = lancamentosMes.filter((lancamento) => lancamento.tipoRecorrencia === "PARCELADO" && !isCreditoLancamento(lancamento)).reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);
        const eventual = Math.max(debitos - fixo - parcelado, 0);
        const liquido = Math.max(debitos - creditos, 0);
        const limiteMensal = cartao.limitesMensais || {};
        const limite = limiteMensal[mes] !== undefined && limiteMensal[mes] !== null && limiteMensal[mes] !== ""
          ? Number(limiteMensal[mes]) || 0
          : Number(cartao.limite) || 0;
        const utilizacao = limite > 0 ? (liquido / limite) * 100 : 0;
        const fechada = cartao.faturasFechadas?.includes(mes) || false;
        if (lancamentosMes.length > 0 || limite > 0 || fechada) {
          rows.push({
            id: `${cartao.id}-${mes}`,
            cartao: cartao.nome,
            mes,
            limite,
            fixo,
            parcelado,
            eventual,
            creditos,
            liquido,
            utilizacao,
            situacao: fechada ? "Fechada" : "Aberta"
          });
        }
      });
    });
    return rows;
  }, [cartoes, mesesSelecionados, lancamentosPeriodo, getMesesItem]);

  const topCategoriaDespesa = categoriasDespesasResumo[0] || null;
  const topCategoriaReceita = categoriasReceitasResumo[0] || null;
  const topCategoriaCartao = categoriasCartaoResumo[0] || null;

  const despesasAnaliticas = useMemo(
    () => [
      ...categoriasDespesasDetalhadas.map((row) => ({
        id: `desp-${row.id}`,
        categoria: row.categoria,
        descricao: row.descricao,
        origem: "Despesa",
        quantidade: row.quantidade,
        referencia: row.previsto,
        realizado: row.pago,
        aberto: row.emAberto,
        participacao: row.participacao
      })),
      ...categoriasFinanceirasDetalhadas.map((row) => ({
        id: `fin-${row.id}`,
        categoria: row.categoria,
        descricao: row.descricao,
        origem: "Financeiro",
        quantidade: row.quantidade,
        referencia: row.previsto,
        realizado: row.pago,
        aberto: row.emAberto,
        participacao: row.participacao
      })),
      ...categoriasCartaoDetalhadas.map((row) => ({
        id: `cart-${row.id}`,
        categoria: row.categoria,
        descricao: row.descricao,
        origem: "Cartao",
        quantidade: row.quantidade,
        referencia: row.consumo,
        realizado: row.faturaFechada,
        aberto: row.faturaAberta,
        participacao: row.participacao
      }))
    ].sort((a, b) => b.referencia - a.referencia),
    [categoriasDespesasDetalhadas, categoriasFinanceirasDetalhadas, categoriasCartaoDetalhadas]
  );

  const periodoSelecionadoLabel = useMemo(() => {
    if (mesesSelecionados.length === 0) return "Nenhum mes selecionado";
    if (mesesSelecionados.length === 1) return mesesSelecionados[0];
    return `${mesInicio} a ${mesFim}`;
  }, [mesesSelecionados, mesInicio, mesFim]);

  const tabs = useMemo(
    () => [
      { id: "visao-geral", label: "Visao Geral", icon: "\uD83D\uDCCA" },
      { id: "fluxo", label: "Fluxo", icon: "\uD83D\uDCC8" },
      { id: "categorias", label: "Categorias", icon: "\uD83C\uDFF7\uFE0F" },
      { id: "cartoes", label: "Cartoes", icon: "\uD83D\uDCB3" }
    ],
    []
  );

  const columnsFluxo = useMemo(
    () => [
      { key: "mes", label: "Mes" },
      { key: "receitasPrevistas", label: "Receita prevista", render: (row) => formatCurrency(row.receitasPrevistas) },
      { key: "receitasRecebidas", label: "Receita recebida", render: (row) => formatCurrency(row.receitasRecebidas) },
      { key: "despesasPrevistas", label: "Despesa prevista", render: (row) => formatCurrency(row.despesasPrevistas) },
      { key: "despesasPagas", label: "Despesa paga", render: (row) => formatCurrency(row.despesasPagas) },
      {
        key: "saldoMes",
        label: "Saldo do mes",
        render: (row) => <span className={row.saldoMes >= 0 ? "reports-value-positive" : "reports-value-negative"}>{formatCurrency(row.saldoMes)}</span>
      },
      {
        key: "saldoAcumulado",
        label: "Saldo acumulado",
        render: (row) => <span className={row.saldoAcumulado >= 0 ? "reports-value-positive" : "reports-value-negative"}>{formatCurrency(row.saldoAcumulado)}</span>
      }
    ],
    []
  );

  const columnsDespesasAnaliticas = useMemo(
    () => [
      { key: "categoria", label: "Categoria" },
      { key: "descricao", label: "Descricao" },
      { key: "origem", label: "Origem" },
      { key: "quantidade", label: "Qtd." },
      { key: "referencia", label: "Referencia", render: (row) => formatCurrency(row.referencia) },
      { key: "realizado", label: "Realizado", render: (row) => formatCurrency(row.realizado) },
      {
        key: "aberto",
        label: "Em aberto",
        render: (row) => <span className={row.aberto > 0 ? "reports-value-warning" : "reports-value-positive"}>{formatCurrency(row.aberto)}</span>
      },
      { key: "participacao", label: "% do total", render: (row) => formatPercent(row.participacao) }
    ],
    []
  );

  const columnsReceitasDetalhe = useMemo(
    () => [
      { key: "categoria", label: "Categoria" },
      { key: "descricao", label: "Descricao" },
      { key: "quantidade", label: "Qtd." },
      { key: "previsto", label: "Previsto", render: (row) => formatCurrency(row.previsto) },
      { key: "recebido", label: "Recebido", render: (row) => formatCurrency(row.recebido) },
      {
        key: "emAberto",
        label: "Em aberto",
        render: (row) => <span className={row.emAberto > 0 ? "reports-value-warning" : "reports-value-positive"}>{formatCurrency(row.emAberto)}</span>
      },
      { key: "participacao", label: "% do total", render: (row) => formatPercent(row.participacao) }
    ],
    []
  );

  const columnsTecnicas = useMemo(
    () => [
      { key: "descricao", label: "Descricao" },
      { key: "quantidade", label: "Qtd." },
      { key: "previsto", label: "Valor da fatura", render: (row) => formatCurrency(row.previsto) },
      { key: "pago", label: "Pago", render: (row) => formatCurrency(row.pago) },
      {
        key: "emAberto",
        label: "Em aberto",
        render: (row) => <span className={row.emAberto > 0 ? "reports-value-warning" : "reports-value-positive"}>{formatCurrency(row.emAberto)}</span>
      }
    ],
    []
  );

  const columnsCartoesResumo = useMemo(
    () => [
      { key: "cartao", label: "Cartao" },
      { key: "mes", label: "Mes" },
      { key: "limite", label: "Limite", render: (row) => formatCurrency(row.limite) },
      { key: "fixo", label: "Fixo", render: (row) => formatCurrency(row.fixo) },
      { key: "parcelado", label: "Parcelado", render: (row) => formatCurrency(row.parcelado) },
      { key: "eventual", label: "Eventual", render: (row) => formatCurrency(row.eventual) },
      { key: "creditos", label: "Creditos", render: (row) => formatCurrency(row.creditos) },
      { key: "liquido", label: "Liquido", render: (row) => formatCurrency(row.liquido) },
      {
        key: "utilizacao",
        label: "Utilizacao",
        render: (row) => <span className={row.utilizacao > 90 ? "reports-value-danger" : "reports-value-neutral"}>{formatPercent(row.utilizacao)}</span>
      },
      {
        key: "situacao",
        label: "Situacao",
        render: (row) => <span className={`reports-pill reports-pill--${row.situacao === "Fechada" ? "closed" : "open"}`}>{row.situacao}</span>
      }
    ],
    []
  );

  return (
    <div className="page-grid reports-page reports-page--reimagined">
      <section className="panel reports-header">
        <div className="reports-header__content">
          <div className="reports-header__intro">
            <h2 className="reports-header__title">Relatorios do periodo</h2>
            <p className="reports-header__subtitle">
              Visao executiva do caixa, das categorias e dos cartoes, com separacao clara entre consumo, pagamento e pendencias.
            </p>
          </div>

          <form className="form-inline reports-filters" onSubmit={(event) => event.preventDefault()}>
            <label className="field">
              Orcamento
              <select value={effectiveOrcamentoId} onChange={(event) => setFilters((prev) => ({ ...prev, orcamentoId: event.target.value }))}>
                {orcamentos.length === 0 ? <option value="">Sem orcamentos</option> : orcamentos.map((orcamento) => (
                  <option key={orcamento.id} value={orcamento.id}>{orcamento.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Inicio
              <select value={mesInicio || ""} onChange={(event) => setFilters((prev) => ({ ...prev, mesInicio: event.target.value }))}>
                {mesesOrcamento.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
              </select>
            </label>
            <label className="field">
              Fim
              <select value={mesFim || ""} onChange={(event) => setFilters((prev) => ({ ...prev, mesFim: event.target.value }))}>
                {mesesOrcamento.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
              </select>
            </label>
            <label className="field">
              Visao
              <select value={filters.visao} onChange={(event) => setFilters((prev) => ({ ...prev, visao: event.target.value }))}>
                <option value="Mensal">Mensal</option>
                <option value="Acumulada">Acumulada</option>
              </select>
            </label>
          </form>
        </div>

        <div className="reports-period-strip">
          <div className="reports-period-chip">
            <span className="reports-period-chip__label">Periodo</span>
            <strong>{periodoSelecionadoLabel}</strong>
          </div>
          <div className="reports-period-chip">
            <span className="reports-period-chip__label">Meses analisados</span>
            <strong>{mesesSelecionados.length}</strong>
          </div>
          <div className="reports-period-chip">
            <span className="reports-period-chip__label">Orcamento</span>
            <strong>{currentOrcamento?.label || "-"}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </section>

      <div className="tab-content">
        {activeTab === "visao-geral" && (
          <>
            <section className="panel reports-hero">
              <KPICard
                title="Saldo realizado no periodo"
                value={formatCurrency(saldoRealizado)}
                subtitle={`Previsto ${formatCurrency(saldoPrevisto)} | Recebido ${formatCurrency(fluxoConsolidado.receitasRecebidas)} | Pago ${formatCurrency(fluxoConsolidado.despesasPagas)}`}
                color={saldoRealizado >= 0 ? "positive" : "negative"}
              >
                <div className="kpi-card__details">
                  <div className="kpi-card__detail-row"><span>Receitas recebidas x previsto</span><strong>{formatPercent(desvioReceitas)}</strong></div>
                  <div className="kpi-card__detail-row"><span>Despesas pagas x previsto</span><strong>{formatPercent(desvioDespesas)}</strong></div>
                  <div className="kpi-card__detail-row"><span>Faturas tecnicas em aberto</span><strong>{formatCurrency(totaisTecnicos.aberto)}</strong></div>
                </div>
              </KPICard>
            </section>

            <section className="reports-metrics-grid">
              <MetricCard title="Receitas recebidas" value={formatCurrency(fluxoConsolidado.receitasRecebidas)} subtitle={`Previsto ${formatCurrency(fluxoConsolidado.receitasPrevistas)}`} tone="positive" />
              <MetricCard title="Despesas pagas" value={formatCurrency(fluxoConsolidado.despesasPagas)} subtitle={`Previsto ${formatCurrency(fluxoConsolidado.despesasPrevistas)}`} tone="negative" />
              <MetricCard title="Saldo do periodo" value={formatCurrency(saldoRealizado)} subtitle={`Desvio de receitas ${formatPercent(desvioReceitas)}`} tone="neutral" />
              <MetricCard title="Faturas em aberto" value={formatCurrency(totaisTecnicos.aberto)} subtitle={`Consumo no cartao ${formatCurrency(totaisCartao.consumo)}`} tone="warning" />
            </section>

            <section className="reports-grid reports-grid--two">
              <div className="panel reports-panel-card">
                <div className="reports-section-head">
                  <div>
                    <h3 className="panel-title">Onde prestar atencao</h3>
                    <p className="reports-section-head__subtitle">Os tres pontos que mais influenciam a leitura deste periodo.</p>
                  </div>
                </div>
                <div className="reports-mini-stack">
                  <MetricCard title="Maior despesa" value={topCategoriaDespesa?.categoria || "-"} subtitle={topCategoriaDespesa ? formatCurrency(topCategoriaDespesa.previsto) : "Sem dados"} tone="negative" />
                  <MetricCard title="Maior receita" value={topCategoriaReceita?.categoria || "-"} subtitle={topCategoriaReceita ? formatCurrency(topCategoriaReceita.previsto) : "Sem dados"} tone="positive" />
                  <MetricCard title="Categoria dominante no cartao" value={topCategoriaCartao?.categoria || "-"} subtitle={topCategoriaCartao ? formatCurrency(topCategoriaCartao.consumo) : "Sem dados"} tone="highlight" />
                </div>
              </div>

              <div className="panel reports-panel-card">
                <div className="reports-section-head">
                  <div>
                    <h3 className="panel-title">Comparativo do periodo</h3>
                    <p className="reports-section-head__subtitle">Planejado e realizado lado a lado para facilitar a leitura executiva.</p>
                  </div>
                </div>
                <HorizontalBar
                  data={[
                    { name: "Receita prevista", value: fluxoConsolidado.receitasPrevistas },
                    { name: "Receita recebida", value: fluxoConsolidado.receitasRecebidas },
                    { name: "Despesa prevista", value: fluxoConsolidado.despesasPrevistas },
                    { name: "Despesa paga", value: fluxoConsolidado.despesasPagas }
                  ]}
                  height={300}
                  colors={["#0f766e", "#14b8a6", "#b45309", "#ea580c"]}
                  showGrid={true}
                />
              </div>
            </section>
          </>
        )}

        {activeTab === "fluxo" && (
          <>
            <section className="panel">
              <div className="reports-section-head">
                <div>
                  <h3 className="panel-title">Fluxo mensal do caixa</h3>
                  <p className="reports-section-head__subtitle">Acompanhamento de receitas recebidas, despesas pagas e saldo acumulado oficial.</p>
                </div>
              </div>
              <AreaChart data={fluxoChartData} series={fluxoSeries} height={320} showGrid={true} showLegend={true} />
            </section>

            <section className="panel">
              <div className="reports-section-head">
                <div>
                  <h3 className="panel-title">Tabela mensal consolidada</h3>
                  <p className="reports-section-head__subtitle">Resumo do desempenho mes a mes, sem misturar leitura de categoria com leitura de caixa.</p>
                </div>
              </div>
              <DataTable columns={columnsFluxo} rows={fluxoMensal} emptyMessage="Sem dados para o periodo selecionado." />
            </section>
          </>
        )}

        {activeTab === "categorias" && (
          <>
            <section className="reports-metrics-grid">
              <MetricCard title="Despesas do orcamento" value={formatCurrency(totaisOperacionais.previsto)} subtitle={`Realizado ${formatCurrency(totaisOperacionais.pago)}`} tone="negative" />
              <MetricCard title="Despesas financeiras" value={formatCurrency(totaisFinanceiros.previsto)} subtitle={`Pago ${formatCurrency(totaisFinanceiros.pago)}`} tone="warning" />
              <MetricCard title="Consumo no cartao" value={formatCurrency(totaisCartao.consumo)} subtitle={`Ja fechado ${formatCurrency(totaisCartao.faturaFechada)}`} tone="highlight" />
              <MetricCard title="Faturas em aberto" value={formatCurrency(totaisTecnicos.aberto + totaisCartao.faturaAberta)} subtitle="Soma de faturas tecnicas e consumo ainda nao fechado" tone="warning" />
            </section>

            <section className="reports-grid reports-grid--two">
              <div className="panel report-card">
                <div className="reports-section-head"><div><h4 className="report-card__title">Despesas por categoria</h4><p className="reports-section-head__subtitle">Participacao das despesas do orcamento no total analisado.</p></div></div>
                <PieChart data={categoriasDespesasResumo.slice(0, 6).map((row) => ({ name: row.categoria, value: row.previsto }))} height={280} showLegend={true} />
              </div>
              <div className="panel report-card">
                <div className="reports-section-head"><div><h4 className="report-card__title">Receitas por categoria</h4><p className="reports-section-head__subtitle">Participacao das receitas previstas para o periodo selecionado.</p></div></div>
                <PieChart data={categoriasReceitasResumo.slice(0, 6).map((row) => ({ name: row.categoria, value: row.previsto }))} height={280} showLegend={true} colors={["#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#84cc16"]} />
              </div>
            </section>

            <section className="panel">
              <div className="reports-section-head"><div><h3 className="panel-title">Categorias com detalhamento por descricao</h3><p className="reports-section-head__subtitle">Referencia mostra o valor planejado ou lancado. Realizado mostra o que ja foi pago ou ja virou fatura fechada.</p></div></div>
              <DataTable columns={columnsDespesasAnaliticas} rows={despesasAnaliticas} emptyMessage="Sem despesas ou consumo no cartao no periodo." />
            </section>

            <section className="reports-grid reports-grid--two">
              <div className="panel">
                <div className="reports-section-head"><div><h3 className="panel-title">Receitas detalhadas</h3><p className="reports-section-head__subtitle">De onde vem a receita e o que ainda falta receber.</p></div></div>
                <DataTable columns={columnsReceitasDetalhe} rows={categoriasReceitasDetalhadas} emptyMessage="Sem receitas no periodo." />
              </div>
              <div className="panel">
                <div className="reports-section-head"><div><h3 className="panel-title">Faturas tecnicas separadas</h3><p className="reports-section-head__subtitle">Estas linhas mostram a obrigacao financeira da fatura sem duplicar a leitura do consumo.</p></div></div>
                <DataTable columns={columnsTecnicas} rows={categoriasTecnicasDetalhadas} emptyMessage="Sem faturas tecnicas no periodo." />
              </div>
            </section>
          </>
        )}

        {activeTab === "cartoes" && (
          <>
            <section className="reports-metrics-grid">
              <MetricCard title="Consumo liquido em cartao" value={formatCurrency(cartoesResumo.reduce((acc, row) => acc + row.liquido, 0))} subtitle={`Creditos ${formatCurrency(cartoesResumo.reduce((acc, row) => acc + row.creditos, 0))}`} tone="highlight" />
              <MetricCard title="Limite observado" value={formatCurrency(cartoesResumo.reduce((acc, row) => acc + row.limite, 0))} subtitle="Soma dos limites considerados no periodo" tone="neutral" />
              <MetricCard title="Faturas ainda abertas" value={String(cartoesResumo.filter((row) => row.situacao === "Aberta").length)} subtitle="Combina cartao e mes ainda nao fechados" tone="warning" />
            </section>

            <section className="panel">
              <div className="reports-section-head"><div><h3 className="panel-title">Painel analitico de cartoes</h3><p className="reports-section-head__subtitle">Limite, composicao da fatura e nivel de utilizacao por cartao e por mes.</p></div></div>
              <DataTable columns={columnsCartoesResumo} rows={cartoesResumo} emptyMessage="Sem movimentacao de cartao no periodo." />
            </section>

            <section className="panel">
              <div className="reports-section-head"><div><h3 className="panel-title">Categorias que mais puxam a fatura</h3><p className="reports-section-head__subtitle">Ranking das categorias de consumo no cartao para apoiar decisoes rapidas.</p></div></div>
              <HorizontalBar data={categoriasCartaoResumo.slice(0, 8).map((row) => ({ name: row.categoria, value: row.consumo }))} height={300} colors={["#7c3aed", "#8b5cf6", "#a855f7", "#06b6d4", "#0ea5e9", "#2563eb"]} showGrid={true} />
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export { RelatoriosPage };
