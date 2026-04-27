import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { NumericFormat } from "react-number-format";
import "react-datepicker/dist/react-datepicker.css";
import { AlertDialog, ConfirmDialog } from "../components/Dialogs";
import { IconEdit, IconTrash } from "../components/Icons";
import Modal from "../components/Modal";
import TableFilter from "../components/TableFilter";
import useTableFilters from "../hooks/useTableFilters";
import { persistPartialConfigToApi } from "../services/configApi";
import { createDespesa, deleteDespesa, loadDespesasFromApi, updateDespesa } from "../services/despesasApi";
import { createLancamentoCartao, createLancamentosCartaoBatch, deleteLancamentoCartao, loadLancamentosCartaoFromApi, updateLancamentoCartao } from "../services/lancamentosCartaoApi";
import { createId, formatCurrency, getCurrentMonthName, calculateDateForMonth } from "../utils/appUtils";

registerLocale("pt-BR", ptBR);

const normalizeCategoriaNome = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const CREDITO_TAG = "[CREDITO]";
const stripCreditoTag = (descricao) => {
  const text = String(descricao || "").trim();
  if (text === CREDITO_TAG) return "";
  if (text.startsWith(`${CREDITO_TAG} `)) return text.slice(CREDITO_TAG.length).trim();
  return text;
};
const isCreditoLancamento = (lancamento) =>
  Number(lancamento?.valor) < 0 || String(lancamento?.descricao || "").startsWith(CREDITO_TAG);
const toCreditoDescricao = (descricao, isCredito) => {
  const base = stripCreditoTag(descricao);
  return isCredito ? `${CREDITO_TAG} ${base}`.trim() : base;
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MonthlySummaryCard = ({ summary, isCurrentMonth }) => {
  const {
    mes,
    limite,
    fixoMes,
    parceladoMes,
    eventualMes,
    creditoMes,
    totalFatura,
    saldo,
    isFechada
  } = summary;

  // Calcular porcentagem de utilização
  const utilizacaoPercent = limite > 0 ? Math.min((totalFatura / limite) * 100, 100) : 0;
  
  // Determinar cor da barra de progresso
  const getProgressClass = () => {
    if (utilizacaoPercent < 50) return 'safe';
    if (utilizacaoPercent < 80) return 'warning';
    return 'danger';
  };

  return (
    <div className={`monthly-summary-card ${isCurrentMonth ? "current-month" : ""}`}>
      <div className="monthly-summary-card__header">
        <h4 className="monthly-summary-card__title">Fatura de {mes}</h4>
        <div className="monthly-summary-card__badges">
          {isCurrentMonth && (
            <span className="monthly-summary-card__badge current">Atual</span>
          )}
          {isFechada && (
            <span className="monthly-summary-card__badge closed">Fechada</span>
          )}
        </div>
      </div>

      <div className="monthly-summary-card__content">
        <div className="monthly-summary-card__row">
          <span className="label">Limite:</span>
          <span className="value">{formatCurrency(limite)}</span>
        </div>

        <div className="monthly-summary-card__row">
          <span className="label">Fixo:</span>
          <span className="value">{formatCurrency(fixoMes)}</span>
        </div>

        <div className="monthly-summary-card__row">
          <span className="label">Parcelado:</span>
          <span className="value">{formatCurrency(parceladoMes)}</span>
        </div>

        <div className="monthly-summary-card__row">
          <span className="label">Eventual:</span>
          <span className="value">{formatCurrency(eventualMes)}</span>
        </div>
        <div className="monthly-summary-card__row">
          <span className="label">Créditos:</span>
          <span className="value positive">{formatCurrency(creditoMes)}</span>
        </div>

        <div className="monthly-summary-card__row">
          <span className="label">Saldo:</span>
          <span className={`value ${saldo >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(saldo)}
          </span>
        </div>

        <div className="monthly-summary-card__row total">
          <span className="label">Valor Fatura:</span>
          <span className="value">{formatCurrency(totalFatura)}</span>
        </div>
      </div>

      {/* Barra de Progresso Visual */}
      <div className="monthly-summary-card__progress">
        <div className="monthly-summary-card__progress-bar">
          <div 
            className={`monthly-summary-card__progress-fill ${getProgressClass()}`}
            style={{ width: `${utilizacaoPercent}%` }}
          />
        </div>
        <div className="monthly-summary-card__progress-text">
          <span>Utilização</span>
          <span>{utilizacaoPercent.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

const CartaoPage = ({
  cartoes,
  setCartoes,
  lancamentosCartao,
  setLancamentosCartao,
  orcamentos,
  despesas,
  setDespesas,
  categorias,
  gastosPredefinidos
}) => {
  const [selectedCartaoId, setSelectedCartaoId] = useState("");
  const [selectedMes, setSelectedMes] = useState(getCurrentMonthName());
  const previousCartaoIdRef = useRef("");
  const [isManualDescricao, setIsManualDescricao] = useState(false);
  const effectiveCartaoId = selectedCartaoId || cartoes[0]?.id || "";
  const despesasCategorias = useMemo(
    () => categorias.filter((categoria) => categoria.tipo === "DESPESA"),
    [categorias]
  );

  // Configuração de colunas para a tabela de cartões
  const cartaoColumnConfigs = {
    data: {
      key: 'data',
      type: 'date',
      label: 'Data',
      sortable: true,
      filterable: true
    },
    descricao: {
      key: 'descricao',
      type: 'text',
      label: 'Descrição',
      sortable: true,
      filterable: true
    },
    categoria: {
      key: 'categoria',
      type: 'select',
      label: 'Categoria',
      sortable: true,
      filterable: true,
      options: despesasCategorias.map((categoria) => categoria.nome)
    },
    valor: {
      key: 'valor',
      type: 'number',
      label: 'Valor',
      sortable: true,
      filterable: true
    },
    tipoRecorrencia: {
      key: 'tipoRecorrencia',
      type: 'select',
      label: 'Tipo de Gasto',
      sortable: true,
      filterable: true,
      options: ['Fixo', 'Parcelado', 'Eventual'],
      transformValue: (value) => {
        if (value === 'FIXO') return 'Fixo';
        if (value === 'PARCELADO') return 'Parcelado';
        return 'Eventual';
      }
    }
  };

  const months = MONTHS;

  /**
   * Determina qual mês deve ser carregado inicialmente na tela Cartões.
   * Se a fatura do mês atual está fechada, busca a próxima fatura aberta.
   */
  const determineInitialMonth = useCallback((cartoesList, cartaoId, orcamentosList) => {
    const currentMonth = getCurrentMonthName();
    
    // Se não há cartão selecionado, retorna mês atual
    if (!cartaoId) {
      return currentMonth;
    }
    
    const cartao = cartoesList.find((c) => String(c.id) === String(cartaoId));
    if (!cartao) {
      return currentMonth;
    }
    
    // Verifica se a fatura do mês atual está fechada
    const isCurrentMonthFechada = cartao.faturasFechadas?.includes(currentMonth) || false;
    
    // Se a fatura do mês atual está aberta, retorna mês atual
    if (!isCurrentMonthFechada) {
      return currentMonth;
    }
    
    // Fatura do mês atual está fechada - buscar próxima fatura aberta
    const currentMonthIndex = months.indexOf(currentMonth);
    
    // Determina o orçamento ativo (que contém o mês atual)
    const activeOrcamento = orcamentosList.find((o) => o.meses && o.meses.includes(currentMonth));
    if (!activeOrcamento || !activeOrcamento.meses) {
      return currentMonth;
    }
    
    // Filtra os meses do orçamento a partir do mês atual e ordena
    const mesesSeguintes = activeOrcamento.meses
      .filter((mes) => months.indexOf(mes) >= currentMonthIndex)
      .sort((a, b) => months.indexOf(a) - months.indexOf(b));
    
    // Busca a primeira fatura aberta
    for (const mes of mesesSeguintes) {
      const isFechada = cartao.faturasFechadas?.includes(mes) || false;
      if (!isFechada) {
        return mes;
      }
    }
    
    // Se todas as faturas subsequentes estão fechadas, retorna o próximo mês
    return months[(currentMonthIndex + 1) % 12];
  }, [months]);

  // Efeito para determinar o mês inicial baseado no status da fatura
  useEffect(() => {
    const initialMonth = determineInitialMonth(cartoes, effectiveCartaoId, orcamentos);
    const cardChanged = previousCartaoIdRef.current !== effectiveCartaoId;

    setSelectedMes((prevSelectedMes) => {
      if (!initialMonth) return prevSelectedMes;
      if (cardChanged || !prevSelectedMes || !months.includes(prevSelectedMes)) {
        return initialMonth;
      }
      return prevSelectedMes;
    });

    previousCartaoIdRef.current = effectiveCartaoId;
  }, [cartoes, determineInitialMonth, effectiveCartaoId, months, orcamentos]);

  const selectedCartao = useMemo(() => cartoes.find((c) => String(c.id) === String(effectiveCartaoId)) || {}, [cartoes, effectiveCartaoId]);

  const effectiveOrcamento = useMemo(() => {
    return orcamentos.find((o) => o.meses && o.meses.includes(selectedMes));
  }, [orcamentos, selectedMes]);

  const effectiveOrcamentoId = effectiveOrcamento?.id || orcamentos[0]?.id || "";

  const resolveLimiteCartao = useCallback((cartao, orcamentoId, mes) => {
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
  }, []);

  const filteredLancamentos = useMemo(() => {
    if (!effectiveCartaoId) return [];
    return lancamentosCartao.filter((l) =>
      String(l.orcamentoId) === String(effectiveOrcamentoId) &&
      String(l.cartaoId) === String(effectiveCartaoId) &&
      (l.mesReferencia === selectedMes || (l.meses && l.meses.includes(selectedMes))))
    ;
  }, [lancamentosCartao, effectiveOrcamentoId, effectiveCartaoId, selectedMes]);

  const filteredLancamentosWithCategoria = useMemo(
    () =>
      filteredLancamentos.map((lancamento) => ({
        ...lancamento,
        categoria:
          despesasCategorias.find((categoria) => String(categoria.id) === String(lancamento.categoriaId))?.nome || "\u2014"
      })),
    [filteredLancamentos, despesasCategorias]
  );

  // Hook para gerenciar filtros e ordenação na tabela
  const {
    filteredAndSortedItems,
    filters,
    sortConfig,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    toggleSort,
    setSortDirection,
    hasActiveFilters,
    activeFiltersCount
  } = useTableFilters(filteredLancamentosWithCategoria, cartaoColumnConfigs, {
    column: "id",
    direction: "desc"
  });

  const { fixoMes, parceladoMes, eventualMes, creditoMes, totalMes } = useMemo(() => {
    let fixo = 0;
    let parcelado = 0;
    let eventual = 0;
    let credito = 0;
    filteredLancamentos.forEach((l) => {
      const val = Math.abs(parseFloat(l.valor) || 0);
      if (isCreditoLancamento(l)) {
        credito += val;
        return;
      }
      if (l.tipoRecorrencia === "FIXO") {
        fixo += val;
      } else if (l.tipoRecorrencia === "PARCELADO") {
        parcelado += val;
      } else {
        eventual += val;
      }
    });
    const totalDebitos = fixo + parcelado + eventual;
    const totalLiquido = Math.max(totalDebitos - credito, 0);
    return {
      fixoMes: fixo,
      parceladoMes: parcelado,
      eventualMes: eventual,
      creditoMes: credito,
      totalMes: totalLiquido
    };
  }, [filteredLancamentos]);

  const valorAlocado = useMemo(() => {
    if (!selectedCartao) return 0;
    return resolveLimiteCartao(selectedCartao, effectiveOrcamentoId, selectedMes);
  }, [selectedCartao, effectiveOrcamentoId, selectedMes, resolveLimiteCartao]);

  const saldoMes = valorAlocado - totalMes;

  const calculateMonthSummary = useCallback((cartaoId, orcamentoId, mes) => {
    const cartao = cartoes.find((c) => String(c.id) === String(cartaoId));
    if (!cartao) return null;

    const lancamentosDoMes = lancamentosCartao.filter((l) =>
      String(l.orcamentoId) === String(orcamentoId) &&
      String(l.cartaoId) === String(cartaoId) &&
      (l.mesReferencia === mes || (l.meses && l.meses.includes(mes)))
    );

    let fixoMes = 0;
    let parceladoMes = 0;
    let eventualMes = 0;
    let creditoMes = 0;

    lancamentosDoMes.forEach((l) => {
      const val = Math.abs(parseFloat(l.valor) || 0);
      if (isCreditoLancamento(l)) {
        creditoMes += val;
        return;
      }
      if (l.tipoRecorrencia === "FIXO") {
        fixoMes += val;
      } else if (l.tipoRecorrencia === "PARCELADO") {
        parceladoMes += val;
      } else {
        eventualMes += val;
      }
    });

    const limite = resolveLimiteCartao(cartao, orcamentoId, mes);

    const totalFatura = Math.max((fixoMes + parceladoMes + eventualMes) - creditoMes, 0);
    const saldo = limite - totalFatura;
    const isFechada = cartao.faturasFechadas?.includes(mes) || false;

    return {
      mes,
      limite,
      fixoMes,
      parceladoMes,
      eventualMes,
      creditoMes,
      totalFatura,
      saldo,
      isFechada
    };
  }, [cartoes, lancamentosCartao, resolveLimiteCartao]);

  const allMonthsSummary = useMemo(() => {
    if (!effectiveCartaoId || !effectiveOrcamentoId) return [];

    const orcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
    if (!orcamento || !orcamento.meses) return [];

    return orcamento.meses
      .map((mes) => calculateMonthSummary(effectiveCartaoId, effectiveOrcamentoId, mes))
      .filter((summary) => summary !== null);
  }, [effectiveCartaoId, effectiveOrcamentoId, orcamentos, calculateMonthSummary]);

  const [limiteModalOpen, setLimiteModalOpen] = useState(false);
  const [limiteEditValue, setLimiteEditValue] = useState("");

  const isFaturaFechada = useMemo(() => {
    return selectedCartao.faturasFechadas?.includes(selectedMes) || false;
  }, [selectedCartao, selectedMes]);

  const [modalOpen, setModalOpen] = useState(false);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("warning");
  const [alertTitle, setAlertTitle] = useState("Atenção");
  const [alertPrimaryLabel, setAlertPrimaryLabel] = useState("OK");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => async () => false);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);
  const confirmTitle = "Confirmação";
  const confirmVariant = "danger";
  const confirmPrimaryLabel = isConfirmProcessing ? "Excluindo..." : "Excluir";
  const confirmSecondaryLabel = "Cancelar";

  const showAlert = useCallback((message, options = {}) => {
    setAlertMessage(message);
    setAlertVariant(options.variant || "warning");
    setAlertTitle(options.title || "Atenção");
    setAlertPrimaryLabel(options.primaryLabel || "OK");
    setAlertModalOpen(true);
  }, [setAlertMessage, setAlertModalOpen, setAlertPrimaryLabel, setAlertTitle, setAlertVariant]);

  const showConfirm = (message, action) => {
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setConfirmModalOpen(true);
  };

  const [editId, setEditId] = useState(null);
  const dataPickerRef = useRef(null);
  const [form, setForm] = useState({
    descricao: "",
    complemento: "",
    valor: "",
    tipoMovimento: "DEBITO",
    data: new Date().toLocaleDateString('en-CA'),
    mesReferencia: "",
    categoriaId: "",
    tipoRecorrencia: "EVENTUAL",
    qtdParcelas: "",
    parcela: null,
    totalParcelas: null,
    meses: []
  });

  const resolveOrcamentoIdForLancamento = useCallback((lancamento) => {
    const mes = lancamento?.mesReferencia;
    const data = String(lancamento?.data || "");
    const ano = Number.parseInt(data.slice(0, 4), 10);
    if (!mes || Number.isNaN(ano)) return null;

    const match = orcamentos.find((orcamento) => {
      const anoOrcamento = Number.parseInt(String(orcamento?.label || ""), 10);
      return (
        anoOrcamento === ano &&
        Array.isArray(orcamento?.meses) &&
        orcamento.meses.includes(mes)
      );
    });

    return match?.id || null;
  }, [orcamentos]);

  const toApiPayload = useCallback((lancamento) => ({
    orcamentoId: resolveOrcamentoIdForLancamento(lancamento),
    cartaoId: lancamento.cartaoId,
    categoriaId: lancamento.categoriaId,
    descricao: lancamento.descricao,
    complemento: lancamento.complemento || "",
    valor: lancamento.valor,
    data: lancamento.data,
    mesReferencia: lancamento.mesReferencia,
    tipoRecorrencia: lancamento.tipoRecorrencia,
    qtdParcelas: lancamento.qtdParcelas,
    totalParcelas: lancamento.totalParcelas,
    parcela: lancamento.parcela,
    meses: Array.isArray(lancamento.meses) ? lancamento.meses : []
  }), [resolveOrcamentoIdForLancamento]);

  const toggleMesLancamento = (mes) => {
    setForm((prev) => {
      const currentMeses = prev.meses || [];
      if (currentMeses.includes(mes)) {
        return { ...prev, meses: currentMeses.filter((m) => m !== mes) };
      } else {
        return { ...prev, meses: [...currentMeses, mes].sort((a, b) => {
          return months.indexOf(a) - months.indexOf(b);
        }) };
      }
    });
  };

  const openModal = async (lancamento = null) => {
    if (isFaturaFechada) {
      showAlert("Fatura do mês está fechada.\nPara lançar ou editar itens, necessário reabrir a fatura.");
      return;
    }
    // Resetando estado de salvamento ao abrir modal
    setIsSaving(false);

    if (lancamento) {
      setEditId(lancamento.id);

      const descricaoSemTag = stripCreditoTag(lancamento.descricao);
      const matchPredef = gastosPredefinidos && gastosPredefinidos.some((g) => g.descricao === descricaoSemTag);
      setIsManualDescricao(!matchPredef);

      setForm({
        descricao: descricaoSemTag,
        complemento: lancamento.complemento || "",
        valor: Math.abs(lancamento.valor),
        tipoMovimento: isCreditoLancamento(lancamento) ? "CREDITO" : "DEBITO",
        data: lancamento.data,
        mesReferencia: lancamento.mesReferencia,
        categoriaId: lancamento.categoriaId || "",
        tipoRecorrencia: lancamento.tipoRecorrencia || "EVENTUAL",
        qtdParcelas: lancamento.qtdParcelas || lancamento.totalParcelas || "",
        parcela: lancamento.parcela ?? null,
        totalParcelas: lancamento.totalParcelas ?? null,
        meses: lancamento.meses || []
      });
    } else {
      setEditId(null);

      const temPredefinidos = gastosPredefinidos && gastosPredefinidos.length > 0;
      setIsManualDescricao(!temPredefinidos);

      setForm({
        descricao: "",
        complemento: "",
        valor: "",
        tipoMovimento: "DEBITO",
        data: new Date().toLocaleDateString('en-CA'),
        mesReferencia: selectedMes,
        categoriaId: "",
        tipoRecorrencia: "EVENTUAL",
        qtdParcelas: "",
        parcela: null,
        totalParcelas: null,
        meses: []
      });
    }
    setModalOpen(true);
  };

  const toggleFaturaStatus = async () => {
    if (!effectiveCartaoId || !selectedMes) return;
    const currentFechadas = selectedCartao.faturasFechadas || [];
    let newFechadas;
    const isClosing = !currentFechadas.includes(selectedMes);

    // Regra de negócio: não permitir reabrir fatura se a despesa vinculada já foi paga.
    if (!isClosing) {
      const cartaoAtual = cartoes.find((c) => String(c.id) === String(effectiveCartaoId));
      const orcamentoAtual = orcamentos.find((o) => o.meses && o.meses.includes(selectedMes));
      const descricaoEsperada = cartaoAtual ? `Fatura do cartão ${cartaoAtual.nome}` : "";

      const despesaFaturaPaga = despesas.find((d) => {
        if (!descricaoEsperada || !orcamentoAtual) return false;
        const sameDescription =
          normalizeCategoriaNome(d.descricao) === normalizeCategoriaNome(descricaoEsperada);
        return (
          sameDescription &&
          String(d.orcamentoId) === String(orcamentoAtual.id) &&
          d.mes === selectedMes &&
          d.status === "Pago"
        );
      });

      if (despesaFaturaPaga) {
        showAlert("Não é possível reabrir a fatura enquanto o lançamento correspondente em Despesas estiver como Pago.");
        return;
      }
    }

    if (!isClosing) {
      newFechadas = currentFechadas.filter((m) => m !== selectedMes);
    } else {
      newFechadas = [...currentFechadas, selectedMes];
    }

    const updatedCartoes = cartoes.map((c) =>
      String(c.id) === String(effectiveCartaoId) ? { ...c, faturasFechadas: newFechadas } : c
    );
    setCartoes(updatedCartoes);
    persistPartialConfigToApi({ cartoes: updatedCartoes });

    await syncDespesa(selectedMes, effectiveCartaoId, lancamentosCartao, updatedCartoes, { updateDate: isClosing });
  };

  // Calcula os dados de sincronização para um mês específico (sem chamar setDespesas)
  const calculateSyncData = (mes, cartaoId, currentLancamentos, cartoesList) => {
    const cartao = cartoesList.find((c) => String(c.id) === String(cartaoId));
    if (!cartao) return null;

    const totalGastos = currentLancamentos
      .filter((l) => String(l.cartaoId) === String(cartaoId) && (l.mesReferencia === mes || (l.meses && l.meses.includes(mes))))
      .reduce((acc, l) => {
        const val = Math.abs(parseFloat(l.valor) || 0);
        return acc + (isCreditoLancamento(l) ? -val : val);
      }, 0);
    const totalLiquido = Math.max(totalGastos, 0);

    const isFechada = cartao.faturasFechadas?.includes(mes);

    let valorFinal = totalLiquido;
    if (!isFechada) {
      const orcamentoMes = orcamentos.find((o) => o.meses && o.meses.includes(mes));
      let limite = resolveLimiteCartao(cartao, orcamentoMes?.id, mes);

      if (!isNaN(limite) && limite > 0) {
        valorFinal = totalLiquido > limite ? totalLiquido : limite;
      }
    }

    let catId = "";
    let catNome = "Bancos/Cartões";

    const existingCat = categorias.find(
      (c) => c.tipo === "DESPESA" && normalizeCategoriaNome(c.nome) === normalizeCategoriaNome(catNome)
    );

    if (existingCat) {
      catId = existingCat.id;
    } else {
      const fallbackCat = categorias.find((c) => c.tipo === "DESPESA");
      catId = fallbackCat ? fallbackCat.id : "";
    }

    const orcamento = orcamentos.find((o) => o.meses && o.meses.includes(mes));
    if (!orcamento) return null;

    const despesaDescricao = `Fatura do cartão ${cartao.nome}`;

    return {
      mes,
      orcamentoId: orcamento.id,
      despesaDescricao,
      valorFinal,
      catId,
      catNome,
      isFechada
    };
  };

  const toDespesaPayload = (despesa, defaults = {}) => ({
    orcamentoId: despesa.orcamentoId || defaults.orcamentoId,
    mes: despesa.mes || defaults.mes,
    data: despesa.data || defaults.data || new Date().toLocaleDateString("en-CA"),
    categoriaId: despesa.categoriaId || defaults.categoriaId,
    descricao: despesa.descricao || defaults.descricao,
    complemento: despesa.complemento || "",
    valor: Number(despesa.valor) || 0,
    tipoRecorrencia: despesa.tipoRecorrencia || "EVENTUAL",
    qtdParcelas: despesa.qtdParcelas || "",
    totalParcelas: despesa.totalParcelas ?? null,
    parcela: despesa.parcela ?? null,
    meses: Array.isArray(despesa.meses) ? despesa.meses : [],
    status: despesa.status || "Pendente"
  });

  const syncDespesasBatched = async (
    meses,
    cartaoId,
    currentLancamentos,
    cartoesList = cartoes,
    options = {}
  ) => {
    const syncDataList = [];
    for (const mes of meses) {
      const data = calculateSyncData(mes, cartaoId, currentLancamentos, cartoesList);
      if (data) {
        syncDataList.push(data);
      }
    }

    if (syncDataList.length === 0) return;

    try {
      const despesasAtuais = await loadDespesasFromApi();
      const today = new Date().toLocaleDateString("en-CA");

      for (const { mes, orcamentoId, despesaDescricao, valorFinal, catId, catNome, isFechada } of syncDataList) {
        const existingDespesa = despesasAtuais.find((d) =>
          d.descricao === despesaDescricao &&
          d.mes === mes &&
          d.orcamentoId === orcamentoId
        );

        if (valorFinal > 0) {
          const dataReferencia = options.updateDate && isFechada
            ? today
            : (existingDespesa?.data || today);

          if (existingDespesa) {
            const payload = toDespesaPayload(
              { ...existingDespesa, valor: valorFinal, data: dataReferencia },
              { orcamentoId, mes, categoriaId: catId, descricao: despesaDescricao, data: dataReferencia }
            );
            await updateDespesa(existingDespesa.id, payload);
            Object.assign(existingDespesa, { valor: valorFinal, data: dataReferencia });
          } else {
            const payload = toDespesaPayload({
              orcamentoId,
              mes: mes,
              data: dataReferencia,
              categoriaId: catId,
              descricao: despesaDescricao,
              valor: valorFinal,
              status: "Pendente",
              categoria: catNome
            });
            await createDespesa(payload);
            despesasAtuais.push({ ...payload, id: createId("desp-sync-temp"), categoria: catNome });
          }
        } else {
          if (existingDespesa) {
            await deleteDespesa(existingDespesa.id);
            const idx = despesasAtuais.findIndex((d) => d.id === existingDespesa.id);
            if (idx >= 0) despesasAtuais.splice(idx, 1);
          }
        }
      }

      const refreshedDespesas = await loadDespesasFromApi();
      setDespesas(refreshedDespesas);
    } catch (err) {
      console.error(err);
      showAlert("Ocorreu um erro ao sincronizar a fatura com Despesas. Tente novamente.");
    }
  };

  const syncDespesa = async (mes, cartaoId, currentLancamentos, cartoesList = cartoes, options = {}) => {
    await syncDespesasBatched([mes], cartaoId, currentLancamentos, cartoesList, options);
  };

  const handleUpdateLimite = async (e) => {
    e.preventDefault();
    const novoLimite = parseFloat(limiteEditValue);
    if (isNaN(novoLimite) || novoLimite < 0) return;
    if (!effectiveOrcamentoId) return;

    const updatedCartoes = cartoes.map((c) => {
      if (String(c.id) === String(effectiveCartaoId)) {
        const limites = c.limitesMensais || {};
        const limitesDoOrcamento = limites[String(effectiveOrcamentoId)] || {};
        return {
          ...c,
          limitesMensais: {
            ...limites,
            [String(effectiveOrcamentoId)]: {
              ...limitesDoOrcamento,
              [selectedMes]: novoLimite
            }
          }
        };
      }
      return c;
    });

    setCartoes(updatedCartoes);
    persistPartialConfigToApi({ cartoes: updatedCartoes });
    setLimiteModalOpen(false);
    await syncDespesa(selectedMes, effectiveCartaoId, lancamentosCartao, updatedCartoes);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!effectiveCartaoId) return;
    if (isFaturaFechada) {
      showAlert("Fatura do mês está fechada.\nPara lançar ou editar itens, necessário reabrir a fatura.");
      return;
    }

    const val = Math.abs(parseFloat(form.valor));
    if (isNaN(val) || val <= 0) return;
    const isCredito = form.tipoMovimento === "CREDITO";
    const valorPersistido = val;
    const descricaoPersistida = toCreditoDescricao(form.descricao, isCredito);
    const tipoRecorrenciaFinal = isCredito ? "EVENTUAL" : form.tipoRecorrencia;
    
    setIsSaving(true);
    try {
      const getNextMonth = (current, offset) => {
        const idx = months.indexOf(current);
        if (idx === -1) return current;
        return months[(idx + offset) % 12];
      };

      let newEntries = [];

      // PARCELADO - Cria entradas separadas para cada parcela
      if (!editId && tipoRecorrenciaFinal === "PARCELADO" && parseInt(form.qtdParcelas) > 1) {
        const qtd = parseInt(form.qtdParcelas);
        const parcValue = val / qtd;

        for (let i = 0; i < qtd; i++) {
          const parcelaMes = getNextMonth(form.mesReferencia, i);
          newEntries.push({
            id: createId("lanc-card-parc"),
            cartaoId: effectiveCartaoId,
            descricao: `${form.descricao} (${i + 1}/${qtd})`,
            complemento: form.complemento || "",
            valor: parcValue,
            data: calculateDateForMonth(parcelaMes, form.data),
            mesReferencia: parcelaMes,
            categoriaId: form.categoriaId,
            tipoRecorrencia: "PARCELADO",
            parcela: i + 1,
            totalParcelas: qtd,
            meses: []
          });
        }
      }
      // FIXO com múltiplos meses - Cria entradas separadas para cada mês (como em Receitas/Despesas)
      else if (!editId && tipoRecorrenciaFinal === "FIXO" && form.meses && form.meses.length > 0) {
        for (const mes of form.meses) {
          newEntries.push({
            id: createId("lanc-card-fixo"),
            cartaoId: effectiveCartaoId,
            descricao: descricaoPersistida,
            complemento: form.complemento || "",
            valor: valorPersistido,
            data: calculateDateForMonth(mes, form.data),
            mesReferencia: mes,
            categoriaId: form.categoriaId,
            tipoRecorrencia: "FIXO",
            qtdParcelas: "",
            meses: []
          });
        }
      }
      // EVENTUAL ou edição ou FIXO com mês único
      else {
        let lancamento = {
          id: editId || createId("lanc-card"),
          cartaoId: effectiveCartaoId,
          descricao: descricaoPersistida,
          complemento: form.complemento || "",
          valor: valorPersistido,
          data: form.data,
          mesReferencia: form.mesReferencia,
          categoriaId: form.categoriaId,
          tipoRecorrencia: tipoRecorrenciaFinal,
          qtdParcelas: form.qtdParcelas,
          parcela: form.parcela ?? null,
          totalParcelas: form.totalParcelas ?? (form.qtdParcelas ? Number(form.qtdParcelas) : null),
          meses: tipoRecorrenciaFinal === "FIXO" ? (form.meses || []) : []
        };

        if (tipoRecorrenciaFinal === "FIXO") {
          if (selectedMes && form.meses && form.meses.includes(selectedMes)) {
            lancamento.mesReferencia = selectedMes;
          } else if (form.meses && form.meses.length > 0 && !form.meses.includes(form.mesReferencia)) {
            lancamento.mesReferencia = form.meses[0];
          }
        }
        if (tipoRecorrenciaFinal !== "PARCELADO") {
          lancamento.parcela = null;
          lancamento.totalParcelas = null;
        }
        newEntries.push(lancamento);
      }

      let affectedMonths = new Set();
      newEntries.forEach((e) => {
        affectedMonths.add(e.mesReferencia);
        if (e.meses) e.meses.forEach((m) => affectedMonths.add(m));
      });

      const isBatchCreateMode =
        !editId &&
        (
          (tipoRecorrenciaFinal === "PARCELADO" && parseInt(form.qtdParcelas) > 1) ||
          (tipoRecorrenciaFinal === "FIXO" && form.meses && form.meses.length > 0)
        );

      const apiPayloads = newEntries.map((entry) => toApiPayload(entry));
      const invalidPayload = apiPayloads.find((payload) => !payload.orcamentoId);
      if (invalidPayload) {
        showAlert(
          "Não foi possível identificar o orçamento do lançamento pelo Ano da data e Mês de referência. Ajuste a data ou o mês antes de salvar."
        );
        return;
      }

      if (isBatchCreateMode) {
        await createLancamentosCartaoBatch(apiPayloads);
        const refreshedLancamentos = await loadLancamentosCartaoFromApi();
        setLancamentosCartao(refreshedLancamentos);
        setModalOpen(false);
        await syncDespesasBatched(Array.from(affectedMonths), effectiveCartaoId, refreshedLancamentos);
        return;
      }

      if (editId) {
        await updateLancamentoCartao(editId, apiPayloads[0]);
      } else {
        await createLancamentoCartao(apiPayloads[0]);
      }

      const refreshedLancamentos = await loadLancamentosCartaoFromApi();
      setLancamentosCartao(refreshedLancamentos);
      setModalOpen(false);

      if (editId) {
        const oldLancamento = lancamentosCartao.find((l) => l.id === editId);
        if (oldLancamento) {
          affectedMonths.add(oldLancamento.mesReferencia);
          if (oldLancamento.meses) oldLancamento.meses.forEach((m) => affectedMonths.add(m));
        }
      }

      // Sincroniza despesas de todos os meses afetados com dados recarregados do banco
      await syncDespesasBatched(Array.from(affectedMonths), effectiveCartaoId, refreshedLancamentos);
    } catch (err) {
      console.error(err);
      showAlert("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (isFaturaFechada) {
      showAlert("Fatura do mês está fechada.\nPara lançar ou editar itens, necessário reabrir a fatura.");
      return;
    }
    showConfirm("Tem certeza que deseja excluir este lançamento?", async () => {
      try {
        const lancamento = lancamentosCartao.find((l) => l.id === id);
        if (!lancamento) return false;

        await deleteLancamentoCartao(id);
        const refreshedLancamentos = await loadLancamentosCartaoFromApi();
        setLancamentosCartao(refreshedLancamentos);

        // Sincroniza o mês afetado com dados recarregados do banco
        const monthsToSync = new Set();
        monthsToSync.add(lancamento.mesReferencia);
        if (lancamento.meses) lancamento.meses.forEach((m) => monthsToSync.add(m));

        await syncDespesasBatched(Array.from(monthsToSync), lancamento.cartaoId, refreshedLancamentos);
        return true;
      } catch (err) {
        console.error(err);
        showAlert("Ocorreu um erro ao excluir o lançamento. Tente novamente.");
        return false;
      }
    });
  };

  return (
    <div className="page-grid page-grid--cartao">
      <section className="panel filters-panel">
        <div className="panel-header">
          <div><h2>Fatura do Cartão</h2></div>
          <div className="actions">
            <button type="button" className="primary" onClick={() => openModal()} disabled={isSaving}>+ Novo lançamento</button>
          </div>
        </div>
        <form className="form-inline" onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            Cartão
            <select value={effectiveCartaoId} onChange={(e) => setSelectedCartaoId(e.target.value)}>
              {cartoes.length === 0 && <option value="">Nenhum cartão cadastrado</option>}
              {cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label className="field">
            Mês
            <select value={selectedMes} onChange={(e) => setSelectedMes(e.target.value)}>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </form>

        <div className="dashboard-grid">
          <div className="summary-card">
            <div className="summary-card-header">
              <h4 className="summary-card-title">Limite do Cartão</h4>
              <button
                type="button"
                className="icon-button info"
                onClick={() => {
                  setLimiteEditValue(valorAlocado);
                  setLimiteModalOpen(true);
                }}
                title="Editar limite deste mês"
              >
                <IconEdit />
              </button>
            </div>
            <strong className="summary-card-value">{formatCurrency(valorAlocado)}</strong>
          </div>

          <div className="summary-card summary-card--fatura-atual">
            <h4 className="summary-card-title">Fatura Atual</h4>
            <strong className="summary-card-value summary-card-value--negative">{formatCurrency(totalMes)}</strong>
            <div className="summary-card-breakdown summary-card-breakdown--cartao">
              <span>Fixo: {formatCurrency(fixoMes)}</span>
              <span>Parcelado: {formatCurrency(parceladoMes)}</span>
              <span>Eventual: {formatCurrency(eventualMes)}</span>
              <span>Créditos: {formatCurrency(creditoMes)}</span>
            </div>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Disponível</h4>
            <strong className={`summary-card-value ${saldoMes >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}`}>{formatCurrency(saldoMes)}</strong>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <h4 className="summary-card-title">Status</h4>
              <span className={`status-pill ${isFaturaFechada ? "status-pill--closed" : "status-pill--open"}`}>
                {isFaturaFechada ? "Fechada" : "Aberta"}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleFaturaStatus}
              className={`status-action ${isFaturaFechada ? "status-action--closed" : "status-action--open"}`}
            >
              {isFaturaFechada ? "Reabrir Fatura" : "Fechar Fatura"}
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">
          Lançamentos de <span className="badge-month">{selectedMes}</span>
        </h3>

        {hasActiveFilters && (
          <div className="filters-bar">
            <span className="filters-bar__label">
              Filtros ativos: <span className="active-filters-badge__count">{activeFiltersCount}</span>
            </span>
            <button
              type="button"
              className="filters-bar__clear-btn ghost"
              onClick={clearAllFilters}
            >
              Limpar todos
            </button>
          </div>
        )}

        <div className="table list-table-wrapper">
          <table className="list-table list-table--cartao" aria-label="Lançamentos do cartão">
            <colgroup>
              <col className="list-table__col list-table__col--date" />
              <col className="list-table__col list-table__col--desc" />
              <col className="list-table__col list-table__col--categoria" />
              <col className="list-table__col list-table__col--valor" />
              <col className="list-table__col list-table__col--tipo" />
              <col className="list-table__col list-table__col--acoes" />
            </colgroup>
            <thead className="list-table__head">
              <tr>
                {Object.values(cartaoColumnConfigs).map((config) => (
                  <th key={config.key} scope="col">
                    <TableFilter
                      columnConfig={config}
                      filterValue={filters[config.key]}
                      onFilterChange={(value) => setColumnFilter(config.key, value)}
                      onClearFilter={() => clearColumnFilter(config.key)}
                      sortConfig={sortConfig}
                      onSortToggle={() => toggleSort(config.key)}
                      onSortDirectionChange={setSortDirection}
                    />
                  </th>
                ))}
                <th scope="col" className="list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedItems.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={6}>Nenhum lançamento nesta fatura.</td>
                </tr>
              ) : (
                filteredAndSortedItems.map((l) => (
                  <tr className="list-table__row" key={l.id}>
                    <td>{new Date(l.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                    <td>{l.complemento ? `${stripCreditoTag(l.descricao)} - ${l.complemento}` : stripCreditoTag(l.descricao)}</td>
                    <td>{l.categoria}</td>
                    <td className={isCreditoLancamento(l) ? "summary-card-value--positive" : ""}>
                      {formatCurrency(isCreditoLancamento(l) ? -(Math.abs(Number(l.valor) || 0)) : Math.abs(Number(l.valor) || 0))}
                    </td>
                    <td>{l.tipoRecorrencia === "FIXO" ? "Fixo" : l.tipoRecorrencia === "PARCELADO" ? "Parcelado" : "Eventual"}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button className="icon-button info" onClick={() => openModal(l)} title="Editar" disabled={isSaving}><IconEdit /></button>
                        <button className="icon-button delete" onClick={() => handleDelete(l.id)} title="Excluir" disabled={isSaving}><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel monthly-summary-section">
        <h3 className="panel-title">
          Resumo Mensal das Faturas - Orçamento <span className="badge-year">{effectiveOrcamento?.label || "Orçamento"}</span>
        </h3>

        {allMonthsSummary.length === 0 ? (
          <p className="empty-message">Nenhum mês disponível no orçamento selecionado.</p>
        ) : (
          <div className="monthly-summary-grid">
            {allMonthsSummary.map((summary) => (
              <MonthlySummaryCard
                key={summary.mes}
                summary={summary}
                isCurrentMonth={summary.mes === selectedMes}
              />
            ))}
          </div>
        )}
      </section>

      <Modal open={modalOpen} title={editId ? "Editar lançamento" : "Novo lançamento"} onClose={() => !isSaving && setModalOpen(false)} isSaving={isSaving}>
        <form className="modal-grid" onSubmit={handleSave}>
          <fieldset disabled={isSaving} style={{ border: "none", padding: 0, margin: 0 }}>
          <div className="modal-grid-row">
            <label className="field">
              Categoria
              <select 
                value={form.categoriaId} 
                onChange={(e) => {
                  const newCategoriaId = e.target.value;
                  setForm((prev) => {
                    const gastosDaCategoria = (gastosPredefinidos || []).filter(
                      (g) => g.categoriaId === newCategoriaId
                    );
                    const descricaoStillValid = gastosDaCategoria.some(
                      (g) => g.descricao === prev.descricao
                    );
                    return {
                      ...prev,
                      categoriaId: newCategoriaId,
                      descricao: descricaoStillValid ? prev.descricao : ""
                    };
                  });
                }}
              >
                <option value="">Selecione a Categoria</option>
                {despesasCategorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Descrição
              {!isManualDescricao && gastosPredefinidos && gastosPredefinidos.length > 0 ? (
                <select
                  value={form.descricao}
                  onChange={(e) => {
                    const desc = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      descricao: desc
                    }));
                  }}
                  disabled={!form.categoriaId}
                >
                  <option value="">
                    {form.categoriaId ? "Selecione..." : "Selecione uma categoria primeiro"}
                  </option>
                  {gastosPredefinidos
                    .filter((g) => g.categoriaId === form.categoriaId)
                    .map((g) => (
                      <option key={g.id} value={g.descricao}>{g.descricao}</option>
                    ))}
                </select>
              ) : (
                <input
                  required
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              )}
              <label className="manual-toggle">
                <input
                  type="checkbox"
                  checked={isManualDescricao}
                  onChange={(e) => setIsManualDescricao(e.target.checked)}
                />
                Informar manualmente
              </label>
            </label>
          </div>
          <label className="field">
            Complemento
            <input
              type="text"
              value={form.complemento}
              placeholder="Opcional"
              onChange={(e) => setForm({ ...form, complemento: e.target.value })}
            />
          </label>
          <div className="modal-grid-row">
            <label className="field">
              Movimento
              <select
                value={form.tipoMovimento}
                onChange={(e) => {
                  const nextMovimento = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    tipoMovimento: nextMovimento,
                    ...(nextMovimento === "CREDITO" ? { tipoRecorrencia: "EVENTUAL", qtdParcelas: "", meses: [] } : {})
                  }));
                }}
              >
                <option value="DEBITO">Débito (compra)</option>
                <option value="CREDITO">Crédito (estorno/reembolso)</option>
              </select>
            </label>
            <label className="field">
              Valor (R$)
              <NumericFormat
                value={form.valor}
                onValueChange={(values) => {
                  setForm({ ...form, valor: values.value });
                }}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                placeholder="0,00"
              />
            </label>
            <label className="field">
              Data
              <DatePicker
                ref={dataPickerRef}
                selected={form.data ? new Date(form.data + "T00:00:00") : null}
                onChange={(date) => {
                  const formattedDate = date ? date.toISOString().split("T")[0] : "";
                  setForm({ ...form, data: formattedDate });
                  setTimeout(() => dataPickerRef.current?.setOpen?.(false), 0);
                }}
                onSelect={() => {
                  setTimeout(() => dataPickerRef.current?.setOpen?.(false), 0);
                }}
                shouldCloseOnSelect
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                placeholderText="DD/MM/AAAA"
              />
            </label>
          </div>
          <div className="modal-grid-row">
            <label className="field">
              Tipo de gasto
              <select
                value={form.tipoRecorrencia}
                disabled={form.tipoMovimento === "CREDITO"}
                onChange={(e) => {
                  const nextTipo = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    tipoRecorrencia: nextTipo,
                    ...(nextTipo !== "PARCELADO" ? { parcela: null, totalParcelas: null } : {})
                  }));
                }}
              >
                <option value="EVENTUAL">Eventual</option>
                <option value="FIXO">Fixo</option>
                <option value="PARCELADO">Parcelado</option>
              </select>
            </label>
            <label className="field">
              Mês da fatura
              <select value={form.mesReferencia} onChange={(e) => setForm({ ...form, mesReferencia: e.target.value })}>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          {form.tipoMovimento !== "CREDITO" && form.tipoRecorrencia === "PARCELADO" && (
            <label className="field">
              Nº Parcelas
              <input type="number" min="2" value={form.qtdParcelas} onChange={(e) => setForm({ ...form, qtdParcelas: e.target.value })} />
            </label>
          )}
          {form.tipoMovimento !== "CREDITO" && form.tipoRecorrencia === "FIXO" && (
            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 500 }}>Meses Recorrentes</span>
                <label className="select-all" style={{ fontSize: "0.9em", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.meses.length === months.length && months.length > 0}
                    onChange={() => {
                      const allSelected = form.meses.length === months.length;
                      setForm((prev) => ({
                        ...prev,
                        meses: allSelected ? [] : [...months]
                      }));
                    }}
                  />
                  Selecionar todos
                </label>
              </div>
              <div className="months-grid-mini">
                {months.map((mes) => (
                  <label key={mes} className="checkbox-card small">
                    <input
                      type="checkbox"
                      checked={form.meses.includes(mes)}
                      onChange={() => toggleMesLancamento(mes)}
                    />
                    <span>{mes}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="modal-actions modal-actions--form">
            <button type="button" className="ghost" onClick={() => !isSaving && setModalOpen(false)} disabled={isSaving}>Cancelar</button>
            <button type="submit" className="primary" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
          </fieldset>
        </form>
      </Modal>

      <Modal open={limiteModalOpen} title={`Limite de ${selectedMes}`} onClose={() => setLimiteModalOpen(false)}>
        <form className="modal-grid" onSubmit={handleUpdateLimite}>
          <p style={{ gridColumn: "1 / -1", marginBottom: "1rem", color: "#64748b" }}>
            Defina o limite do cartão especificamente para o mês de <strong>{selectedMes}</strong>.
            Isso não afetará o limite padrão dos outros meses.
          </p>
          <label className="field">
            Valor do Limite
            <NumericFormat
              value={limiteEditValue}
              onValueChange={(values) => {
                setLimiteEditValue(values.value);
              }}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              placeholder="0,00"
              autoFocus
            />
          </label>
          <div className="modal-actions modal-actions--form">
            <button type="button" className="ghost" onClick={() => setLimiteModalOpen(false)}>Cancelar</button>
            <button type="submit" className="primary">Salvar Limite</button>
          </div>
        </form>
      </Modal>

      <AlertDialog
        open={alertModalOpen}
        title={alertTitle}
        message={alertMessage}
        variant={alertVariant}
        primaryLabel={alertPrimaryLabel}
        onClose={() => setAlertModalOpen(false)}
      />

      <ConfirmDialog
        open={confirmModalOpen}
        title={confirmTitle}
        message={confirmMessage}
        variant={confirmVariant}
        primaryLabel={confirmPrimaryLabel}
        secondaryLabel={confirmSecondaryLabel}
        onClose={() => {
          if (!isConfirmProcessing) setConfirmModalOpen(false);
        }}
        onConfirm={async () => {
          if (isConfirmProcessing) return;
          setIsConfirmProcessing(true);
          const ok = await onConfirmAction();
          setIsConfirmProcessing(false);
          if (ok) setConfirmModalOpen(false);
        }}
      />
    </div>
  );
};

export { CartaoPage };
