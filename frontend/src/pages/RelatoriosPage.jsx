import { useCallback, useMemo, useState } from "react";
import useRelatorios from "../hooks/useRelatorios";
import useSaldoAcumulado from "../hooks/useSaldoAcumulado";
import { formatCurrency } from "../utils/appUtils";
import { TabNavigation } from "../components/reports";
import { AreaChart, HorizontalBar, PieChart } from "../components/charts";
import { KPICard } from "../components/dashboard";
import Modal from "../components/Modal";

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

const resolveLimiteCartao = (cartao, orcamentoId, mes) => {
  const limitesMensais = cartao?.limitesMensais || {};

  const nestedValue = limitesMensais?.[String(orcamentoId)]?.[mes];
  if (nestedValue !== undefined && nestedValue !== null && nestedValue !== "") {
    return Number(nestedValue) || 0;
  }

  // Compatibilidade com payload legado (flat).
  const flatValue = limitesMensais?.[mes];
  if (flatValue !== undefined && flatValue !== null && flatValue !== "") {
    return Number(flatValue) || 0;
  }

  return 0;
};

const getSignedLancamentoValor = (lancamento) => {
  const valor = Math.abs(Number(lancamento?.valor) || 0);
  return isCreditoLancamento(lancamento) ? -valor : valor;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const MetricCard = ({ title, value, subtitle, tone = "neutral" }) => (
  <div className={`reports-metric-card reports-metric-card--${tone}`}>
    <span className="reports-metric-card__label">{title}</span>
    <strong className="reports-metric-card__value">{value}</strong>
    {subtitle ? <span className="reports-metric-card__subtitle">{subtitle}</span> : null}
  </div>
);

const DataTable = ({ columns, rows, emptyMessage, className = "", onRowClick }) => (
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
            <tr
              key={row.id || `${row.categoria || row.mes || "row"}-${index}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
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
  selectedOrcamentoId,
  setSelectedOrcamentoId,
  receitas,
  despesas,
  cartoes,
  lancamentosCartao,
  categorias
}) => {
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [selectedGastoGrupo, setSelectedGastoGrupo] = useState(null);

  const {
    filters,
    setFilters,
    effectiveOrcamentoId,
    mesesOrcamento,
    mesInicio,
    mesFim,
    mesesSelecionados
  } = useRelatorios(orcamentos, selectedOrcamentoId);

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

  const getTipoGasto = useCallback((item) => {
    if (item.tipoRecorrencia === "FIXO") return "Fixo";
    if (item.tipoRecorrencia === "PARCELADO") return "Parcelado";
    return "Eventual";
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
        categoria === "emprestimos" ||
        categoria === "financiamentos" ||
        categoria === "juros" ||
        categoria === "tarifas" ||
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
    () => lancamentosCartao.filter((lancamento) =>
      String(lancamento.orcamentoId) === String(effectiveOrcamentoId) &&
      countOcorrencias(lancamento, mesesSelecionadosSet) > 0
    ),
    [lancamentosCartao, effectiveOrcamentoId, countOcorrencias, mesesSelecionadosSet]
  );

  const resumoCartoesMensal = useMemo(() => {
    const rows = [];

    (cartoes || []).forEach((cartao) => {
      mesesSelecionados.forEach((mes) => {
        const lancamentosMes = lancamentosPeriodo.filter((lancamento) => {
          if (String(lancamento.cartaoId) !== String(cartao.id)) return false;
          return getMesesItem(lancamento).includes(mes);
        });

        const creditos = lancamentosMes
          .filter((lancamento) => isCreditoLancamento(lancamento))
          .reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);

        const debitos = lancamentosMes
          .filter((lancamento) => !isCreditoLancamento(lancamento))
          .reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);

        const fixo = lancamentosMes
          .filter((lancamento) => lancamento.tipoRecorrencia === "FIXO" && !isCreditoLancamento(lancamento))
          .reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);

        const parcelado = lancamentosMes
          .filter((lancamento) => lancamento.tipoRecorrencia === "PARCELADO" && !isCreditoLancamento(lancamento))
          .reduce((acc, lancamento) => acc + Math.abs(Number(lancamento.valor) || 0), 0);

        const eventual = Math.max(debitos - fixo - parcelado, 0);
        const liquido = Math.max(debitos - creditos, 0);
        const limite = resolveLimiteCartao(cartao, effectiveOrcamentoId, mes);
        const utilizacao = limite > 0 ? (liquido / limite) * 100 : 0;
        const fechada = cartao.faturasFechadas?.includes(mes) || false;

        if (lancamentosMes.length > 0 || limite > 0 || fechada) {
          rows.push({
            id: `${cartao.id}-${mes}`,
            cartaoId: cartao.id,
            cartao: cartao.nome,
            mes,
            limite,
            fixo,
            parcelado,
            eventual,
            creditos,
            debitos,
            liquido,
            utilizacao,
            situacao: fechada ? "Fechada" : "Aberta"
          });
        }
      });
    });

    return rows;
  }, [cartoes, mesesSelecionados, lancamentosPeriodo, getMesesItem, effectiveOrcamentoId]);

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
    lancamentosPeriodo.forEach((lancamento) => {
      const mesesAtivos = getMesesItem(lancamento).filter((mes) => mesesSelecionadosSet.has(mes));
      if (mesesAtivos.length === 0) return;
      const categoria = getCategoriaNome(lancamento);
      const descricaoBase = stripCreditoTag(lancamento.descricao) || "Sem descricao";
      const descricao = lancamento.complemento ? `${descricaoBase} - ${lancamento.complemento}` : descricaoBase;
      const valorAssinado = getSignedLancamentoValor(lancamento);
      const cartao = cartoesMap.get(String(lancamento.cartaoId));
      const fechadas = cartao?.faturasFechadas || [];
      const key = `${categoria}::${descricao}`;
      const current = map.get(key) || { id: key, categoria, descricao, quantidade: 0, consumo: 0, faturaFechada: 0, faturaAberta: 0 };
      const quantidadeFechada = mesesAtivos.filter((mes) => fechadas.includes(mes)).length;
      const quantidadeAberta = mesesAtivos.length - quantidadeFechada;
      map.set(key, {
        ...current,
        quantidade: current.quantidade + mesesAtivos.length,
        consumo: current.consumo + (valorAssinado * mesesAtivos.length),
        faturaFechada: current.faturaFechada + (valorAssinado * quantidadeFechada),
        faturaAberta: current.faturaAberta + (valorAssinado * quantidadeAberta)
      });
    });

    const rows = Array.from(map.values()).filter((row) => row.consumo !== 0 || row.faturaFechada !== 0 || row.faturaAberta !== 0);
    const totalConsumo = rows.reduce((acc, row) => acc + Math.max(row.consumo, 0), 0);
    return rows.map((row) => ({
      ...row,
      participacao: totalConsumo > 0 ? (Math.max(row.consumo, 0) / totalConsumo) * 100 : 0
    })).sort((a, b) => b.consumo - a.consumo);
  }, [lancamentosPeriodo, getMesesItem, mesesSelecionadosSet, getCategoriaNome, cartoesMap]);

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

  const categoriasDespesasGerenciaisResumo = useMemo(() => {
    const map = new Map();

    const appendRow = (categoria, valores) => {
      const current = map.get(categoria) || {
        id: categoria,
        categoria,
        quantidade: 0,
        descricoes: 0,
        total: 0,
        realizado: 0,
        aberto: 0
      };

      map.set(categoria, {
        ...current,
        quantidade: current.quantidade + (valores.quantidade || 0),
        descricoes: current.descricoes + (valores.descricoes || 0),
        total: current.total + (valores.total || 0),
        realizado: current.realizado + (valores.realizado || 0),
        aberto: current.aberto + (valores.aberto || 0)
      });
    };

    categoriasDespesasResumo.forEach((row) => {
      appendRow(row.categoria, {
        quantidade: row.quantidade,
        descricoes: row.descricoes,
        total: row.previsto,
        realizado: row.pago,
        aberto: row.emAberto
      });
    });

    categoriasFinanceirasDetalhadas.forEach((row) => {
      appendRow(row.categoria, {
        quantidade: row.quantidade,
        descricoes: 1,
        total: row.previsto,
        realizado: row.pago,
        aberto: row.emAberto
      });
    });

    categoriasCartaoResumo.forEach((row) => {
      appendRow(row.categoria, {
        quantidade: row.quantidade,
        descricoes: row.descricoes,
        total: Math.max(row.consumo, 0),
        realizado: Math.max(row.faturaFechada, 0),
        aberto: Math.max(row.faturaAberta, 0)
      });
    });

    const rows = Array.from(map.values()).filter((row) => row.total > 0);
    const totalGeral = rows.reduce((acc, row) => acc + row.total, 0);

    return rows
      .map((row) => ({
        ...row,
        participacao: totalGeral > 0 ? (row.total / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [categoriasDespesasResumo, categoriasFinanceirasDetalhadas, categoriasCartaoResumo]);

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

  const cartoesResumo = useMemo(() => resumoCartoesMensal, [resumoCartoesMensal]);

  const topCategoriaDespesa = categoriasDespesasGerenciaisResumo[0] || null;
  const topCategoriaReceita = categoriasReceitasResumo[0] || null;
  const topCategoriaAberta = useMemo(
    () => [...categoriasDespesasGerenciaisResumo]
      .filter((row) => row.aberto > 0)
      .sort((a, b) => b.aberto - a.aberto)[0] || null,
    [categoriasDespesasGerenciaisResumo]
  );

  const despesasAnaliticas = useMemo(() => {
    const rows = [
      ...categoriasDespesasDetalhadas.map((row) => ({
        id: `desp-${row.id}`,
        categoria: row.categoria,
        descricao: row.descricao,
        origem: "Despesa",
        quantidade: row.quantidade,
        referencia: row.previsto,
        realizado: row.pago,
        aberto: row.emAberto
      })),
      ...categoriasFinanceirasDetalhadas.map((row) => ({
        id: `fin-${row.id}`,
        categoria: row.categoria,
        descricao: row.descricao,
        origem: "Financeiro",
        quantidade: row.quantidade,
        referencia: row.previsto,
        realizado: row.pago,
        aberto: row.emAberto
      })),
      ...categoriasCartaoDetalhadas.map((row) => ({
        id: `cart-${row.id}`,
        categoria: row.categoria,
        descricao: row.descricao,
        origem: "Cartao",
        quantidade: row.quantidade,
        referencia: row.consumo,
        realizado: row.faturaFechada,
        aberto: row.faturaAberta
      }))
    ];

    const totalReferencia = rows.reduce((acc, row) => acc + Math.max(Number(row.referencia) || 0, 0), 0);

    return rows
      .map((row) => ({
        ...row,
        participacao: totalReferencia > 0 ? (Math.max(Number(row.referencia) || 0, 0) / totalReferencia) * 100 : 0
      }))
      .sort((a, b) => b.referencia - a.referencia);
  }, [categoriasDespesasDetalhadas, categoriasFinanceirasDetalhadas, categoriasCartaoDetalhadas]);

  const gastosDetalhados = useMemo(() => {
    const rows = [];
    const faturaPrefixes = [
      "fatura do cartao ",
      "pagamento da fatura do cartao ",
      "fatura cartao "
    ];

    const getCartaoDaFatura = (despesa) => {
      const descricaoNormalizada = normalizeText(despesa.descricao);
      const prefix = faturaPrefixes.find((item) => descricaoNormalizada.startsWith(item));
      if (!prefix) return null;
      const nomeCartaoNormalizado = descricaoNormalizada.slice(prefix.length).trim();
      return (cartoes || []).find((cartao) => normalizeText(cartao.nome) === nomeCartaoNormalizado) || null;
    };

    const pushRow = (row) => {
      rows.push({
        valorOriginal: row.valorOriginal ?? row.valor,
        ...row
      });
    };

    despesasOrcamento.forEach((despesa) => {
      const mesesAtivos = getMesesItem(despesa).filter((mes) => mesesSelecionadosSet.has(mes));
      if (mesesAtivos.length === 0) return;

      const origemBase = isFaturaTecnica(despesa)
        ? "Fatura"
        : isDespesaFinanceira(despesa)
          ? "Financeiro"
          : "Despesa";

      mesesAtivos.forEach((mes, index) => {
        const valorOficial = Math.abs(Number(despesa.valor) || 0);
        const realizadoOficial = despesa.status === "Pago" ? valorOficial : 0;
        const cartaoFatura = isFaturaTecnica(despesa) ? getCartaoDaFatura(despesa) : null;
        const lancamentosFatura = cartaoFatura
          ? lancamentosPeriodo.filter((lancamento) =>
            String(lancamento.cartaoId) === String(cartaoFatura.id) &&
            getMesesItem(lancamento).includes(mes)
          )
          : [];
        const totalLancamentosAssinado = lancamentosFatura.reduce(
          (acc, lancamento) => acc + getSignedLancamentoValor(lancamento),
          0
        );

        if (origemBase === "Fatura" && lancamentosFatura.length > 0 && totalLancamentosAssinado !== 0) {
          lancamentosFatura.forEach((lancamento, lancamentoIndex) => {
            const valorOriginal = getSignedLancamentoValor(lancamento);
            if (valorOriginal === 0) return;
            const proporcao = valorOriginal / totalLancamentosAssinado;
            const valorRateado = valorOficial * proporcao;
            const realizado = despesa.status === "Pago" ? valorRateado : 0;

            pushRow({
              id: `fatura-${despesa.id || despesa.descricao || "item"}-${mes}-${lancamento.id || lancamentoIndex}`,
              categoria: getCategoriaNome(lancamento),
              tipoGasto: getTipoGasto(lancamento),
              origem: "Cartao",
              descricao: stripCreditoTag(lancamento.descricao) || despesa.descricao || "Sem descricao",
              complemento: lancamento.complemento || despesa.complemento || "-",
              mes,
              data: lancamento.data || despesa.data || "",
              valor: valorRateado,
              valorOriginal,
              realizado,
              aberto: valorRateado - realizado,
              status: despesa.status || "-",
              cartao: cartaoFatura?.nome || "-",
              tipoRecorrencia: lancamento.tipoRecorrencia || despesa.tipoRecorrencia || "EVENTUAL",
              parcela: lancamento.parcela ?? despesa.parcela ?? "-",
              totalParcelas: lancamento.totalParcelas ?? lancamento.qtdParcelas ?? despesa.totalParcelas ?? despesa.qtdParcelas ?? "-",
              orcamento: currentOrcamento?.label || "-",
              referenciaId: despesa.id || "-",
              referenciaDescricao: despesa.descricao || "-",
              observacao: "Rateado a partir da despesa oficial da fatura"
            });
          });
          return;
        }

        pushRow({
          id: `${origemBase.toLowerCase()}-${despesa.id || despesa.descricao || "item"}-${mes}-${index}`,
          categoria: getCategoriaNome(despesa),
          tipoGasto: getTipoGasto(despesa),
          origem: origemBase,
          descricao: despesa.descricao || "Sem descricao",
          complemento: despesa.complemento || "-",
          mes,
          data: despesa.data || "",
          valor: valorOficial,
          realizado: realizadoOficial,
          aberto: valorOficial - realizadoOficial,
          status: despesa.status || "-",
          cartao: cartaoFatura?.nome || "-",
          tipoRecorrencia: despesa.tipoRecorrencia || "EVENTUAL",
          parcela: despesa.parcela ?? "-",
          totalParcelas: despesa.totalParcelas ?? despesa.qtdParcelas ?? "-",
          orcamento: currentOrcamento?.label || "-",
          referenciaId: despesa.id || "-",
          referenciaDescricao: despesa.descricao || "-",
          observacao: origemBase === "Fatura" ? "Sem composicao encontrada no cartao para o periodo" : "-"
        });
      });
    });

    return rows.sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
  }, [
    despesasOrcamento,
    getMesesItem,
    mesesSelecionadosSet,
    isFaturaTecnica,
    isDespesaFinanceira,
    cartoes,
    lancamentosPeriodo,
    getCategoriaNome,
    getTipoGasto,
    currentOrcamento
  ]);

  const gastosResumo = useMemo(() => {
    const map = new Map();

    gastosDetalhados.forEach((row) => {
      const key = `${row.categoria}::${row.descricao}`;
      const current = map.get(key) || {
        id: key,
        categoria: row.categoria,
        descricao: row.descricao,
        tipoGasto: row.tipoGasto,
        quantidade: 0,
        referencia: 0,
        realizado: 0,
        aberto: 0,
        tiposGasto: new Set(),
        lancamentos: []
      };

      const tiposGasto = new Set(current.tiposGasto);
      tiposGasto.add(row.tipoGasto);

      map.set(key, {
        ...current,
        descricao: row.descricao,
        tipoGasto: Array.from(tiposGasto).sort().join(" / "),
        quantidade: current.quantidade + 1,
        referencia: current.referencia + row.valor,
        realizado: current.realizado + row.realizado,
        aberto: current.aberto + row.aberto,
        tiposGasto,
        lancamentos: [...current.lancamentos, row]
      });
    });

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        lancamentos: [...row.lancamentos].sort((a, b) => {
          const mesCompare = String(a.mes || "").localeCompare(String(b.mes || ""));
          if (mesCompare !== 0) return mesCompare;
          return String(a.data || "").localeCompare(String(b.data || ""));
        })
      }))
      .sort((a, b) => Math.abs(b.referencia) - Math.abs(a.referencia));
  }, [gastosDetalhados]);

  const gastosTotais = useMemo(
    () => gastosResumo.reduce(
      (acc, row) => ({
        referencia: acc.referencia + row.referencia,
        realizado: acc.realizado + row.realizado,
        aberto: acc.aberto + row.aberto,
        quantidade: acc.quantidade + row.quantidade
      }),
      { referencia: 0, realizado: 0, aberto: 0, quantidade: 0 }
    ),
    [gastosResumo]
  );

  const tabs = useMemo(
    () => [
      { id: "visao-geral", label: "Visao Geral", icon: "\uD83D\uDCCA" },
      { id: "fluxo", label: "Fluxo", icon: "\uD83D\uDCC8" },
      { id: "categorias", label: "Categorias", icon: "\uD83C\uDFF7\uFE0F" },
      { id: "gastos", label: "Gastos", icon: "\uD83D\uDCCB" },
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

  const columnsGastosResumo = useMemo(
    () => [
      { key: "categoria", label: "Categoria" },
      { key: "descricao", label: "Descricao" },
      { key: "tipoGasto", label: "Tipo de Gasto" },
      { key: "quantidade", label: "Qtd. Lancamentos" },
      { key: "referencia", label: "Total", render: (row) => formatCurrency(row.referencia) },
      { key: "realizado", label: "Realizado", render: (row) => formatCurrency(row.realizado) },
      {
        key: "aberto",
        label: "Em aberto",
        render: (row) => <span className={row.aberto > 0 ? "reports-value-warning" : "reports-value-positive"}>{formatCurrency(row.aberto)}</span>
      }
    ],
    []
  );

  const columnsGastosDetalhados = useMemo(
    () => [
      { key: "mes", label: "Mes" },
      { key: "data", label: "Data", render: (row) => formatDate(row.data) },
      { key: "origem", label: "Origem" },
      { key: "tipoGasto", label: "Tipo" },
      { key: "descricao", label: "Descricao" },
      { key: "complemento", label: "Complemento" },
      { key: "cartao", label: "Cartao" },
      { key: "valor", label: "Valor oficial", render: (row) => formatCurrency(row.valor) },
      { key: "realizado", label: "Realizado", render: (row) => formatCurrency(row.realizado) },
      { key: "aberto", label: "Em aberto", render: (row) => formatCurrency(row.aberto) },
      { key: "status", label: "Status" }
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
            <label className="field reports-filters__field reports-filters__field--orcamento">
              Orcamento
              <select
                value={effectiveOrcamentoId}
                onChange={(event) => {
                  const nextId = orcamentos.find((orcamento) => String(orcamento.id) === event.target.value)?.id ?? "";
                  setSelectedOrcamentoId(nextId);
                }}
              >
                {orcamentos.length === 0 ? <option value="">Sem orcamentos</option> : orcamentos.map((orcamento) => (
                  <option key={orcamento.id} value={orcamento.id}>{orcamento.label}</option>
                ))}
              </select>
            </label>
            <label className="field reports-filters__field reports-filters__field--inicio">
              Inicio
              <select value={mesInicio || ""} onChange={(event) => setFilters((prev) => ({ ...prev, mesInicio: event.target.value }))}>
                {mesesOrcamento.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
              </select>
            </label>
            <label className="field reports-filters__field reports-filters__field--fim">
              Fim
              <select value={mesFim || ""} onChange={(event) => setFilters((prev) => ({ ...prev, mesFim: event.target.value }))}>
                {mesesOrcamento.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
              </select>
            </label>
            <label className="field reports-filters__field reports-filters__field--visao">
              Visao
              <select value={filters.visao} onChange={(event) => setFilters((prev) => ({ ...prev, visao: event.target.value }))}>
                <option value="Mensal">Mensal</option>
                <option value="Acumulada">Acumulada</option>
              </select>
            </label>
          </form>
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

            <section className="reports-grid reports-grid--two">
              <div className="panel reports-panel-card">
                <div className="reports-section-head">
                  <div>
                    <h3 className="panel-title">Onde prestar atencao</h3>
                    <p className="reports-section-head__subtitle">Os tres pontos que mais influenciam a leitura deste periodo.</p>
                  </div>
                </div>
                <div className="reports-mini-stack">
                  <MetricCard title="Maior despesa" value={topCategoriaDespesa?.categoria || "-"} subtitle={topCategoriaDespesa ? formatCurrency(topCategoriaDespesa.total) : "Sem dados"} tone="negative" />
                  <MetricCard title="Maior receita" value={topCategoriaReceita?.categoria || "-"} subtitle={topCategoriaReceita ? formatCurrency(topCategoriaReceita.previsto) : "Sem dados"} tone="positive" />
                  <MetricCard title="Maior aberto" value={topCategoriaAberta?.categoria || "-"} subtitle={topCategoriaAberta ? formatCurrency(topCategoriaAberta.aberto) : "Sem dados"} tone="warning" />
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
              <MetricCard title="Total analisado" value={formatCurrency(gastosTotais.referencia)} subtitle="Base oficial da tela Despesas no periodo" tone="negative" />
              <MetricCard title="Ja realizado" value={formatCurrency(gastosTotais.realizado)} subtitle="Soma oficial das despesas pagas" tone="highlight" />
              <MetricCard title="Em aberto" value={formatCurrency(gastosTotais.aberto)} subtitle="Parte oficial ainda pendente nas despesas" tone="warning" />
            </section>

            <section className="reports-grid reports-grid--two">
              <div className="panel report-card">
                <div className="reports-section-head"><div><h4 className="report-card__title">Despesas por categoria</h4><p className="reports-section-head__subtitle">Participacao total das categorias considerando despesas do orcamento, financeiras e consumo no cartao, sem duplicar fatura tecnica.</p></div></div>
                <PieChart data={categoriasDespesasGerenciaisResumo.slice(0, 6).map((row) => ({ name: row.categoria, value: row.total }))} height={280} showLegend={true} />
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

        {activeTab === "gastos" && (
          <>
            <section className="reports-metrics-grid">
              <MetricCard title="Grupos de gastos" value={String(gastosResumo.length)} subtitle="Linhas agrupadas por categoria e descricao" tone="neutral" />
              <MetricCard title="Despesa total" value={formatCurrency(gastosTotais.referencia)} subtitle="Base oficial da tela Despesas no periodo" tone="negative" />
              <MetricCard title="Despesa paga" value={formatCurrency(gastosTotais.realizado)} subtitle={`Em aberto ${formatCurrency(gastosTotais.aberto)}`} tone="highlight" />
            </section>

            <section className="panel">
              <div className="reports-section-head">
                <div>
                  <h3 className="panel-title">Gastos agrupados</h3>
                  <p className="reports-section-head__subtitle">Cada linha totaliza a despesa oficial por categoria e descricao. O tipo de gasto continua visivel para contexto, mas nao define mais o agrupamento principal.</p>
                </div>
              </div>
              <DataTable
                columns={columnsGastosResumo}
                rows={gastosResumo}
                emptyMessage="Sem gastos no periodo."
                onRowClick={setSelectedGastoGrupo}
              />
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

      <Modal
        open={Boolean(selectedGastoGrupo)}
        title={selectedGastoGrupo ? `Detalhamento de gastos - ${selectedGastoGrupo.categoria} / ${selectedGastoGrupo.descricao}` : "Detalhamento de gastos"}
        onClose={() => setSelectedGastoGrupo(null)}
        footer={<button type="button" className="ghost" onClick={() => setSelectedGastoGrupo(null)}>Fechar</button>}
        className="reports-gastos-modal"
      >
        <div className="reports-gastos-modal__content">
          <div className="reports-gastos-modal__summary">
            <div className="reports-gastos-modal__stat">
              <span className="reports-gastos-modal__stat-label">Categoria</span>
              <strong className="reports-gastos-modal__stat-value">{selectedGastoGrupo?.categoria || "-"}</strong>
            </div>
            <div className="reports-gastos-modal__stat">
              <span className="reports-gastos-modal__stat-label">Descricao</span>
              <strong className="reports-gastos-modal__stat-value">{selectedGastoGrupo?.descricao || "-"}</strong>
            </div>
            <div className="reports-gastos-modal__stat">
              <span className="reports-gastos-modal__stat-label">Total</span>
              <strong className="reports-gastos-modal__stat-value">{formatCurrency(selectedGastoGrupo?.referencia || 0)}</strong>
            </div>
            <div className="reports-gastos-modal__stat">
              <span className="reports-gastos-modal__stat-label">Realizado / Em aberto</span>
              <strong className="reports-gastos-modal__stat-value">
                {`${formatCurrency(selectedGastoGrupo?.realizado || 0)} / ${formatCurrency(selectedGastoGrupo?.aberto || 0)}`}
              </strong>
            </div>
          </div>

          <div className="reports-section-head reports-gastos-modal__head">
            <div>
              <h4 className="report-card__title">Lancamentos do grupo</h4>
              <p className="reports-section-head__subtitle">
                {selectedGastoGrupo
                  ? `Tipo ${selectedGastoGrupo.tipoGasto} | ${selectedGastoGrupo.quantidade} lancamento(s) no agrupamento`
                  : "Detalhamento dos lancamentos que compoem a linha selecionada."}
              </p>
            </div>
          </div>
          <DataTable
            columns={columnsGastosDetalhados}
            rows={selectedGastoGrupo?.lancamentos || []}
            emptyMessage="Sem lancamentos para este grupo."
            className="reports-table--compact reports-gastos-modal__table"
          />
        </div>
      </Modal>
    </div>
  );
};

export { RelatoriosPage };
