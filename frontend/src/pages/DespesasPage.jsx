import { useCallback, useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { NumericFormat } from "react-number-format";
import "react-datepicker/dist/react-datepicker.css";
import { AlertDialog, ConfirmDialog } from "../components/Dialogs";
import { IconCheck, IconEdit, IconTrash, IconX } from "../components/Icons";
import Modal from "../components/Modal";
import TableFilter from "../components/TableFilter";
import useTableFilters from "../hooks/useTableFilters";
import { createCategoria } from "../services/configApi";
import { createDespesa, createDespesasBatch, deleteDespesa, loadDespesasFromApi, updateDespesa, updateDespesaStatus } from "../services/despesasApi";
import { MONTHS_ORDER, createId, formatCurrency, getCurrentMonthName, calculateDateForMonth } from "../utils/appUtils";

registerLocale("pt-BR", ptBR);

const normalizeCategoriaNome = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

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

const DespesasPage = ({
  categorias,
  setCategorias,
  gastosPredefinidos,
  orcamentos,
  selectedOrcamentoId,
  setSelectedOrcamentoId,
  despesas,
  setDespesas,
  cartoes,
  lancamentosCartao
}) => {
  const despesasCategorias = categorias.filter((categoria) => categoria.tipo === "DESPESA");
  const [filters, setFilters] = useState({
    mes: ""
  });

  const effectiveOrcamentoId = resolveEffectiveOrcamentoId(orcamentos, selectedOrcamentoId);
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
  const effectiveMes = filters.mes && mesesDisponiveis.includes(filters.mes) ? filters.mes : defaultMes;

  const filteredDespesas = useMemo(() => {
    return despesas.filter((d) => {
      if (d.orcamentoId !== effectiveOrcamentoId) return false;
      if (d.mes === effectiveMes) return true;
      if (d.meses && d.meses.includes(effectiveMes)) return true;
      return false;
    });
  }, [despesas, effectiveOrcamentoId, effectiveMes]);

  // Configuração de colunas para filtros e ordenação
  const despesasColumnConfigs = useMemo(() => ({
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
      options: despesasCategorias.map(c => c.nome)
    },
    valor: {
      key: 'valor',
      type: 'number',
      label: 'Valor',
      sortable: true,
      filterable: true
    },
    status: {
      key: 'status',
      type: 'select',
      label: 'Status',
      sortable: true,
      filterable: true,
      options: ['Pendente', 'Pago']
    }
  }), [despesasCategorias]);

  // Hook para gerenciar filtros e ordenação
  const {
    filteredAndSortedItems: filteredSortedDespesas,
    filters: tableFilters,
    sortConfig,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    toggleSort,
    hasActiveFilters,
    activeFiltersCount
  } = useTableFilters(filteredDespesas, despesasColumnConfigs, {
    column: "id",
    direction: "desc"
  });

  const totals = useMemo(() => {
    let lancado = 0;
    let pago = 0;
    filteredSortedDespesas.forEach((d) => {
      const val = parseFloat(d.valor) || 0;
      lancado += val;
      if (d.status === "Pago") pago += val;
    });
    const pendente = Math.max(lancado - pago, 0);
    return {
      lancado: formatCurrency(lancado),
      pago: formatCurrency(pago),
      pendente: formatCurrency(pendente),
      pendenteNum: pendente
    };
  }, [filteredSortedDespesas]);

  const [manualOpen, setManualOpen] = useState(false);
  const [isManualDescricao, setIsManualDescricao] = useState(false);
  const [manualForm, setManualForm] = useState({
    categoriaId: despesasCategorias[0]?.id ?? "",
    descricao: "",
    complemento: "",
    valor: "",
    tipoRecorrencia: "EVENTUAL",
    qtdParcelas: "",
    data: "",
    mesInicial: "",
    meses: [],
    status: "Pendente"
  });

  const [despesaEditId, setDespesaEditId] = useState(null);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("warning");
  const [alertTitle, setAlertTitle] = useState("Atenção");
  const [alertPrimaryLabel, setAlertPrimaryLabel] = useState("OK");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => async () => false);
  const confirmTitle = "Confirmação";
  const confirmVariant = "danger";
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);
  const confirmPrimaryLabel = isConfirmProcessing ? "Excluindo..." : "Excluir";
  const confirmSecondaryLabel = "Cancelar";
  const [operationState, setOperationState] = useState({ inProgress: false, label: "" });

  const showAlert = useCallback((message, options = {}) => {
    setAlertMessage(message);
    setAlertVariant(options.variant || "warning");
    setAlertTitle(options.title || "Atenção");
    setAlertPrimaryLabel(options.primaryLabel || "OK");
    setAlertModalOpen(true);
  }, [setAlertMessage, setAlertModalOpen, setAlertPrimaryLabel, setAlertTitle, setAlertVariant]);

  const refreshDespesas = useCallback(async () => {
    const updated = await loadDespesasFromApi();
    setDespesas(updated);
  }, [setDespesas]);

  const toApiPayload = useCallback((despesa) => ({
    orcamentoId: despesa.orcamentoId,
    mes: despesa.mes,
    data: despesa.data,
    categoriaId: despesa.categoriaId,
    descricao: despesa.descricao,
    complemento: despesa.complemento || "",
    valor: despesa.valor,
    tipoRecorrencia: despesa.tipoRecorrencia,
    qtdParcelas: despesa.qtdParcelas,
    totalParcelas: despesa.totalParcelas,
    parcela: despesa.parcela,
    meses: Array.isArray(despesa.meses) ? despesa.meses : [],
    status: despesa.status || "Pendente"
  }), []);

  const runDespesasOperation = useCallback(async ({ label, execute, onSuccess }) => {
    setOperationState({ inProgress: true, label });
    try {
      await execute();
      await refreshDespesas();
      onSuccess?.();
      return true;
    } catch (error) {
      const detail =
        error?.message && error.message !== "UNAUTHORIZED"
          ? `\nDetalhe técnico: ${error.message}`
          : "";
      showAlert(
        `A operação não foi concluída. Nenhuma alteração será considerada final até nova confirmação do servidor.${detail}`,
        { title: "Falha ao persistir dados", variant: "danger" }
      );
      return false;
    } finally {
      setOperationState({ inProgress: false, label: "" });
    }
  }, [refreshDespesas, showAlert]);

  const ensureBancosCartoesCategoria = useCallback(async () => {
    const targetName = "Bancos/Cartões";
    const targetKey = normalizeCategoriaNome(targetName);
    const existing = categorias.find(
      (c) => c.tipo === "DESPESA" && normalizeCategoriaNome(c.nome) === targetKey
    );
    if (existing) return existing;
    try {
      const created = await createCategoria({ nome: targetName, tipo: "DESPESA" });
      setCategorias((prev) => {
        if (!created) return prev;
        const createdKey = normalizeCategoriaNome(created.nome);
        const alreadyExists = prev.some(
          (categoria) =>
            categoria.id === created.id ||
            (categoria.tipo === created.tipo &&
              normalizeCategoriaNome(categoria.nome) === createdKey)
        );
        if (alreadyExists) return prev;
        return [...prev, created];
      });
      return created;
    } catch (error) {
      showAlert(error?.message || "Falha ao criar categoria Bancos/Cartões.");
    }
    return categorias.find((c) => c.tipo === "DESPESA") || null;
  }, [categorias, setCategorias, showAlert]);

  const showConfirm = (message, action) => {
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setConfirmModalOpen(true);
  };

  const getCartaoVinculado = (despesa) => {
    const prefix = "Fatura do cartão ";
    if (!despesa?.descricao || !despesa.descricao.startsWith(prefix)) return null;
    const nomeCartao = despesa.descricao.slice(prefix.length);
    return cartoes.find((cartao) => cartao.nome === nomeCartao) || null;
  };

  const temLancamentosNoCartao = (cartaoId) =>
    lancamentosCartao.some((lancamento) => lancamento.cartaoId === cartaoId);

  const toggleMesDespesa = (mes) => {
    setManualForm((prev) => {
      const currentMeses = prev.meses || [];
      if (currentMeses.includes(mes)) {
        return { ...prev, meses: currentMeses.filter((m) => m !== mes) };
      } else {
        return {
          ...prev,
          meses: [...currentMeses, mes].sort((a, b) => {
            const monthsOrder = [
              "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
              "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
            ];
            return monthsOrder.indexOf(a) - monthsOrder.indexOf(b);
          })
        };
      }
    });
  };

  const openManualModal = () => {
    setDespesaEditId(null);
    const temPredefinidos = gastosPredefinidos.length > 0;
    setIsManualDescricao(!temPredefinidos);
    setManualForm({
      categoriaId: "",
      descricao: "",
      complemento: "",
      valor: "",
      tipoRecorrencia: "EVENTUAL",
      qtdParcelas: "",
      data: new Date().toLocaleDateString('en-CA'),
      mesInicial: effectiveMes || mesesDisponiveis[0] || "",
      meses: [],
      status: "Pendente"
    });
    setManualOpen(true);
  };

  const toggleStatus = async (id) => {
    if (operationState.inProgress) return;
    const target = despesas.find((d) => d.id === id);
    if (!target) return;
    const nextStatus = target.status === "Pago" ? "Pendente" : "Pago";
    if (nextStatus === "Pago") {
      const cartaoVinculado = getCartaoVinculado(target);
      const faturaFechada = cartaoVinculado?.faturasFechadas?.includes(target.mes);
      if (cartaoVinculado && !faturaFechada) {
        showAlert("A fatura está aberta. Feche a fatura para permitir o pagamento.");
        return;
      }
    }
    await runDespesasOperation({
      label: "Atualizando...",
      execute: () => updateDespesaStatus(id, nextStatus)
    });
  };

  const excluirDespesa = (id) => {
    const item = despesas.find((d) => d.id === id);
    const cartaoVinculado = item ? getCartaoVinculado(item) : null;

    if (cartaoVinculado && temLancamentosNoCartao(cartaoVinculado.id)) {
      showAlert(
        "Não é possível excluir esta despesa.\nO cartão de crédito possui lançamentos de despesas nessa fatura.\nPara excluir essa despesa, remova todos os lançamentos no cartão."
      );
      return;
    }

    showConfirm("Tem certeza que deseja excluir esta despesa?", async () => {
      return runDespesasOperation({
        label: "Excluindo...",
        execute: () => deleteDespesa(id)
      });
    });
  };

  const editarDespesa = async (despesa) => {
    setDespesaEditId(despesa.id);
    const matchPredef = gastosPredefinidos.some((g) => g.descricao === despesa.descricao);
    setIsManualDescricao(!matchPredef);
    const isFaturaCartao = Boolean(getCartaoVinculado(despesa));
    const targetCategoria = isFaturaCartao ? await ensureBancosCartoesCategoria() : null;
    setManualForm({
      categoriaId: isFaturaCartao
        ? (targetCategoria?.id || despesa.categoriaId || despesasCategorias[0]?.id || "")
        : (despesa.categoriaId || despesasCategorias[0]?.id || ""),
      descricao: despesa.descricao,
      complemento: despesa.complemento || "",
      valor: despesa.valor,
      tipoRecorrencia: despesa.tipoRecorrencia || "EVENTUAL",
      qtdParcelas: despesa.qtdParcelas || "",
      data: despesa.data,
      mesInicial: despesa.mes || effectiveMes || "",
      meses: [],
      status: despesa.status || "Pendente"
    });
    setManualOpen(true);
  };

  const handleSaveManual = async (event) => {
    event.preventDefault();
    const isFaturaCartao = manualForm.descricao?.startsWith("Fatura do cartão ");
    const targetCategoria = isFaturaCartao ? await ensureBancosCartoesCategoria() : null;
    const categoriaId = isFaturaCartao
      ? (targetCategoria?.id || manualForm.categoriaId)
      : manualForm.categoriaId;
    const categoriaNome = isFaturaCartao
      ? (targetCategoria?.nome || "Bancos/Cartões")
      : (despesasCategorias.find((c) => c.id === manualForm.categoriaId)?.nome || "—");

    if (!despesaEditId && manualForm.tipoRecorrencia === "PARCELADO" && parseInt(manualForm.qtdParcelas) > 1) {
      const qtd = parseInt(manualForm.qtdParcelas);
      const val = parseFloat(manualForm.valor);
      const parcValue = val / qtd;

      const getNextMonth = (current, offset) => {
        const idx = MONTHS_ORDER.indexOf(current);
        if (idx === -1) return current;
        return MONTHS_ORDER[(idx + offset) % 12];
      };

      let newEntries = [];
      for (let i = 0; i < qtd; i++) {
        newEntries.push({
          id: createId("desp-parc"),
          orcamentoId: effectiveOrcamentoId,
          mes: getNextMonth(manualForm.mesInicial, i),
          data: manualForm.data,
          categoriaId,
          descricao: `${manualForm.descricao} (${i + 1}/${qtd})`,
          complemento: manualForm.complemento || "",
          valor: parcValue,
          tipoRecorrencia: "PARCELADO",
          parcela: i + 1,
          totalParcelas: qtd,
          qtdParcelas: qtd,
          meses: [],
          status: "Pendente",
          categoria: categoriaNome
        });
      }
      const ok = await runDespesasOperation({
        label: "Salvando...",
        execute: () => createDespesasBatch(newEntries.map((entry) => toApiPayload(entry)))
      });
      if (ok) setManualOpen(false);
      return;
    }

    if (!despesaEditId && manualForm.tipoRecorrencia === "FIXO" && manualForm.meses?.length > 0) {
      let newEntries = [];
      for (const mes of manualForm.meses) {
        newEntries.push({
          id: createId("desp-fixo"),
          orcamentoId: effectiveOrcamentoId,
          mes: mes,
          data: calculateDateForMonth(mes, manualForm.data),
          categoriaId,
          descricao: manualForm.descricao,
          complemento: manualForm.complemento || "",
          valor: manualForm.valor,
          tipoRecorrencia: "FIXO",
          meses: [],
          status: "Pendente",
          categoria: categoriaNome
        });
      }
      const ok = await runDespesasOperation({
        label: "Salvando...",
        execute: () => createDespesasBatch(newEntries.map((entry) => toApiPayload(entry)))
      });
      if (ok) setManualOpen(false);
      return;
    }

    let novaDespesa = {
      id: despesaEditId || createId("desp"),
      orcamentoId: effectiveOrcamentoId,
      mes: manualForm.mesInicial,
      data: manualForm.data,
      categoriaId,
      descricao: manualForm.descricao,
      complemento: manualForm.complemento || "",
      valor: manualForm.valor,
      tipoRecorrencia: manualForm.tipoRecorrencia,
      qtdParcelas: manualForm.qtdParcelas,
      meses: manualForm.meses,
      status: manualForm.status,
      categoria: categoriaNome
    };

    if (effectiveMes && novaDespesa.meses && novaDespesa.meses.includes(effectiveMes)) {
      novaDespesa.mes = effectiveMes;
    } else if (novaDespesa.meses && novaDespesa.meses.length > 0 && !novaDespesa.meses.includes(novaDespesa.mes)) {
      novaDespesa.mes = novaDespesa.meses[0];
    }

    if (despesaEditId) {
      const original = despesas.find((d) => d.id === despesaEditId);
      const ok = await runDespesasOperation({
        label: "Atualizando...",
        execute: async () => {
          await updateDespesa(despesaEditId, toApiPayload(novaDespesa));
          if (original && original.meses && original.meses.length > 0) {
            const removedMonths = original.meses.filter((m) => !novaDespesa.meses.includes(m));
            if (removedMonths.length > 0) {
              const preservedEntry = {
                ...original,
                meses: removedMonths,
                mes: removedMonths.includes(original.mes) ? original.mes : removedMonths[0]
              };
              await createDespesa(toApiPayload(preservedEntry));
            }
          }
        }
      });
      if (ok) setManualOpen(false);
    } else {
      const ok = await runDespesasOperation({
        label: "Salvando...",
        execute: () => createDespesa(toApiPayload(novaDespesa))
      });
      if (ok) setManualOpen(false);
    }
  };

  useEffect(() => {
    const syncFaturaCategorias = async () => {
      const targetDespesas = despesas.filter((d) => d.descricao?.startsWith("Fatura do cartão "));
      if (targetDespesas.length === 0) return;
      const categoria = await ensureBancosCartoesCategoria();
      if (!categoria) return;
      setDespesas((prev) => {
        let changed = false;
        const next = prev.map((d) => {
          if (!d.descricao?.startsWith("Fatura do cartão ")) return d;
          if (d.categoriaId === categoria.id && d.categoria === categoria.nome) return d;
          changed = true;
          return { ...d, categoriaId: categoria.id, categoria: categoria.nome };
        });
        return changed ? next : prev;
      });
    };
    syncFaturaCategorias();
  }, [despesas, ensureBancosCartoesCategoria, setDespesas]);

  return (
    <div className="page-grid">
      <section className="panel filters-panel">
        <div className="panel-header">
          <div>
            <h2>Selecione orçamento e mês para consultar as despesas.</h2>
            {operationState.inProgress && (
              <p style={{ margin: "6px 0 0", color: "#64748b", fontWeight: 600 }}>{operationState.label}</p>
            )}
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={openManualModal} title="Cadastrar uma nova despesa" disabled={operationState.inProgress}>
              + Nova despesa
            </button>
          </div>
        </div>
        <form className="form-inline form-inline--orcamento-mes-mobile" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            Orçamento
            <select
              value={effectiveOrcamentoId}
              onChange={(event) => {
                const nextId = orcamentos.find((orcamento) => String(orcamento.id) === event.target.value)?.id ?? "";
                setSelectedOrcamentoId(nextId);
              }}
            >
              {orcamentos.map((orcamento) => (
                <option key={orcamento.id} value={orcamento.id}>
                  {orcamento.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Mês
            <select
              value={effectiveMes}
              onChange={(event) => setFilters((prev) => ({ ...prev, mes: event.target.value }))}
            >
              {mesesDisponiveis.length === 0 ? (
                <option value="">Sem meses configurados</option>
              ) : (
                mesesDisponiveis.map((mes) => (
                  <option key={mes} value={mes}>
                    Mês {mes}
                  </option>
                ))
              )}
            </select>
          </label>
        </form>

        <div className="dashboard-grid">
          <div className="summary-card">
            <h4 className="summary-card-title">Total Lançado</h4>
            <strong className="summary-card-value">{totals.lancado}</strong>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Total Pago</h4>
            <strong className="summary-card-value summary-card-value--positive">{totals.pago}</strong>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Pendentes de Pagamento</h4>
            <strong className={`summary-card-value ${totals.pendenteNum > 0 ? "summary-card-value--warning" : "summary-card-value--neutral"}`}>
              {totals.pendente}
            </strong>
          </div>
        </div>
      </section>
      <section className="panel">
        <h2>Lista de Despesas</h2>
        {hasActiveFilters && (
          <div className="filters-bar">
            <span className="filters-bar__label">Filtros ativos:</span>
            <div className="active-filters-badge">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
            </div>
            <button
              type="button"
              className="ghost filters-bar__clear-btn"
              onClick={clearAllFilters}
            >
              Limpar todos
            </button>
          </div>
        )}
        <div className="table list-table-wrapper">
          <table className="list-table" aria-label="Lista de Despesas">
            <colgroup>
              <col className="list-table__col list-table__col--date" />
              <col className="list-table__col list-table__col--desc" />
              <col className="list-table__col list-table__col--cat" />
              <col className="list-table__col list-table__col--valor" />
              <col className="list-table__col list-table__col--status" />
              <col className="list-table__col list-table__col--acoes" />
            </colgroup>
            <thead className="list-table__head">
              <tr>
                {Object.values(despesasColumnConfigs).map(config => (
                  <th key={config.key} scope="col">
                    <TableFilter
                      columnConfig={config}
                      filterValue={tableFilters[config.key]}
                      onFilterChange={(value) => setColumnFilter(config.key, value)}
                      onClearFilter={() => clearColumnFilter(config.key)}
                      sortConfig={sortConfig}
                      onSortToggle={toggleSort}
                      onSortDirectionChange={() => toggleSort(config.key)}
                    />
                  </th>
                ))}
                <th scope="col" className="list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSortedDespesas.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={6}>{hasActiveFilters ? 'Nenhuma despesa encontrada com os filtros ativos.' : 'Sem despesas para o mês selecionado.'}</td>
                </tr>
              ) : (
                filteredSortedDespesas.map((despesa) => (
                  <tr className="list-table__row" key={despesa.id}>
                    <td>{new Date(despesa.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                    <td>{despesa.complemento ? `${despesa.descricao} - ${despesa.complemento}` : despesa.descricao}</td>
                    <td>{despesa.categoria}</td>
                    <td>{formatCurrency(despesa.valor)}</td>
                    <td>{despesa.status}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button
                          type="button"
                          className={`icon-button ${despesa.status === "Pago" ? "danger" : "success"}`}
                          onClick={() => { void toggleStatus(despesa.id); }}
                          title={despesa.status === "Pago" ? "Cancelar pagamento" : "Marcar como pago"}
                          aria-label={despesa.status === "Pago" ? "Cancelar pagamento" : "Marcar como pago"}
                          disabled={operationState.inProgress}
                        >
                          {despesa.status === "Pago" ? <IconX /> : <IconCheck />}
                        </button>
                        <button
                          type="button"
                          className="icon-button info"
                          onClick={() => editarDespesa(despesa)}
                          title="Editar esta despesa"
                          aria-label="Editar esta despesa"
                          disabled={operationState.inProgress}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-button delete"
                          onClick={() => excluirDespesa(despesa.id)}
                          title="Excluir esta despesa"
                          aria-label="Excluir esta despesa"
                          disabled={operationState.inProgress}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Modal open={manualOpen} title={despesaEditId ? "Editar despesa" : "Nova despesa"} onClose={() => setManualOpen(false)}>
        <form
          className="modal-grid"
          onSubmit={handleSaveManual}
        >
          <div className="modal-grid-row">
            <label className="field">
              Categoria
              <select
                value={manualForm.categoriaId}
                onChange={(event) => {
                  const newCategoriaId = event.target.value;
                  setManualForm((prev) => {
                    const gastosDaCategoria = gastosPredefinidos.filter(
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
                {despesasCategorias.length === 0 ? (
                  <option value="">Sem categorias disponíveis</option>
                ) : (
                  <>
                    <option value="">Selecione a Categoria</option>
                    {despesasCategorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>
            <label className="field">
              Descrição
              {!isManualDescricao && gastosPredefinidos.length > 0 ? (
                <select
                  value={manualForm.descricao}
                  onChange={(event) => {
                    const desc = event.target.value;
                    setManualForm((prev) => ({
                      ...prev,
                      descricao: desc
                    }));
                  }}
                  disabled={!manualForm.categoriaId}
                >
                  <option value="">
                    {manualForm.categoriaId ? "Selecione..." : "Selecione uma categoria primeiro"}
                  </option>
                  {gastosPredefinidos
                    .filter((gasto) => gasto.categoriaId === manualForm.categoriaId)
                    .map((gasto) => (
                      <option key={gasto.id} value={gasto.descricao}>
                        {gasto.descricao}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={manualForm.descricao}
                  onChange={(event) =>
                    setManualForm((prev) => ({ ...prev, descricao: event.target.value }))
                  }
                />
              )}
              <label className="manual-toggle">
                <input
                  type="checkbox"
                  checked={isManualDescricao}
                  onChange={(e) => setIsManualDescricao(e.target.checked)}
                  disabled={operationState.inProgress}
                />
                Informar manualmente
              </label>
            </label>
          </div>
          <label className="field">
            Complemento
              <input
                type="text"
                value={manualForm.complemento}
                placeholder="Opcional"
                onChange={(event) =>
                  setManualForm((prev) => ({ ...prev, complemento: event.target.value }))
                }
                disabled={operationState.inProgress}
              />
          </label>
          <div className="modal-grid-row">
            <label className="field">
              Valor (R$)
              <NumericFormat
                value={manualForm.valor}
                onValueChange={(values) => {
                  setManualForm((prev) => ({ ...prev, valor: values.value }));
                }}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                placeholder="0,00"
                disabled={operationState.inProgress}
              />
            </label>
            <label className="field">
              Data
              <DatePicker
                selected={manualForm.data ? new Date(manualForm.data + "T00:00:00") : null}
                onChange={(date) => {
                  const formattedDate = date ? date.toISOString().split("T")[0] : "";
                  setManualForm((prev) => ({ ...prev, data: formattedDate }));
                }}
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                placeholderText="DD/MM/AAAA"
                disabled={operationState.inProgress}
              />
            </label>
          </div>
          <div className="modal-grid-row">
            <label className="field">
              Tipo de gasto
              <select
                value={manualForm.tipoRecorrencia}
                onChange={(event) =>
                  setManualForm((prev) => ({ ...prev, tipoRecorrencia: event.target.value }))
                }
              >
                <option value="EVENTUAL">Eventual</option>
                <option value="FIXO">Fixo</option>
                <option value="PARCELADO">Parcelado</option>
              </select>
            </label>
            <label className="field">
              Mês inicial
              <select
                value={manualForm.mesInicial || manualForm.meses[0] || ""}
                onChange={(event) => {
                  const mes = event.target.value;
                  setManualForm((prev) => ({
                    ...prev,
                    mesInicial: mes,
                    meses: mes ? [mes] : []
                  }));
                }}
              >
                <option value="">Selecione...</option>
                {mesesDisponiveis.map((mes) => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </label>
          </div>
          {manualForm.tipoRecorrencia === "PARCELADO" ? (
            <label className="field">
              Nº de parcelas
              <input
                type="number"
                value={manualForm.qtdParcelas}
                onChange={(event) =>
                  setManualForm((prev) => ({ ...prev, qtdParcelas: event.target.value }))
                }
                disabled={operationState.inProgress}
              />
            </label>
          ) : null}
          {manualForm.tipoRecorrencia === "FIXO" ? (
            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 500 }}>Meses Recorrentes</span>
                <label className="select-all" style={{ fontSize: "0.9em", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={manualForm.meses.length === mesesDisponiveis.length && mesesDisponiveis.length > 0}
                    onChange={() => {
                      const allSelected = manualForm.meses.length === mesesDisponiveis.length;
                      setManualForm((prev) => ({
                        ...prev,
                        meses: allSelected ? [] : [...mesesDisponiveis]
                      }));
                      }}
                      disabled={operationState.inProgress}
                    />
                  Selecionar todos
                </label>
              </div>
              <div className="months-grid-mini">
                {mesesDisponiveis.map((mes) => (
                  <label key={mes} className="checkbox-card small">
                    <input
                      type="checkbox"
                      checked={manualForm.meses.includes(mes)}
                      onChange={() => toggleMesDespesa(mes, "manual")}
                      disabled={operationState.inProgress}
                    />
                    <span>{mes}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <label className="field">
            Status
            <select
              value={manualForm.status}
              onChange={(event) =>
                setManualForm((prev) => ({ ...prev, status: event.target.value }))
              }
              disabled={operationState.inProgress}
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setManualOpen(false)} disabled={operationState.inProgress}>
              {operationState.inProgress ? "Aguarde..." : "Cancelar"}
            </button>
            <button type="submit" className="primary" disabled={operationState.inProgress}>
              {operationState.inProgress ? operationState.label : "Salvar"}
            </button>
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

export { DespesasPage };
