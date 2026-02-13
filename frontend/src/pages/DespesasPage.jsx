import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertDialog, ConfirmDialog } from "../components/Dialogs";
import { IconCheck, IconEdit, IconTrash, IconX } from "../components/Icons";
import Modal from "../components/Modal";
import { createCategoria } from "../services/configApi";
import { MONTHS_ORDER, createId, formatCurrency, getCurrentMonthName } from "../utils/appUtils";

const normalizeCategoriaNome = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const DespesasPage = ({
  categorias,
  setCategorias,
  gastosPredefinidos,
  orcamentos,
  despesas,
  setDespesas,
  cartoes,
  lancamentosCartao
}) => {
  const despesasCategorias = categorias.filter((categoria) => categoria.tipo === "DESPESA");
  const initialOrcamentoId = orcamentos[0]?.id ?? "";
  const [filters, setFilters] = useState({
    orcamentoId: initialOrcamentoId,
    mes: ""
  });

  const effectiveOrcamentoId = filters.orcamentoId || initialOrcamentoId;
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

  const totals = useMemo(() => {
    let lancado = 0;
    let pago = 0;
    filteredDespesas.forEach((d) => {
      const val = parseFloat(d.valor) || 0;
      lancado += val;
      if (d.status === "Pago") pago += val;
    });
    return {
      lancado: formatCurrency(lancado),
      pago: formatCurrency(pago)
    };
  }, [filteredDespesas]);

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
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});
  const confirmTitle = "Confirmação";
  const confirmVariant = "danger";
  const confirmPrimaryLabel = "Excluir";
  const confirmSecondaryLabel = "Cancelar";

  const showAlert = useCallback((message, options = {}) => {
    setAlertMessage(message);
    setAlertVariant(options.variant || "warning");
    setAlertTitle(options.title || "Atenção");
    setAlertPrimaryLabel(options.primaryLabel || "OK");
    setAlertModalOpen(true);
  }, [setAlertMessage, setAlertModalOpen, setAlertPrimaryLabel, setAlertTitle, setAlertVariant]);

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
      categoriaId: despesasCategorias[0]?.id ?? "",
      descricao: "",
      complemento: "",
      valor: "",
      tipoRecorrencia: "EVENTUAL",
      qtdParcelas: "",
      data: new Date().toISOString().split("T")[0],
      mesInicial: effectiveMes || mesesDisponiveis[0] || "",
      meses: [],
      status: "Pendente"
    });
    setManualOpen(true);
  };

  const toggleStatus = (id) => {
    setDespesas((prev) => {
      const target = prev.find((d) => d.id === id);
      if (!target) return prev;
      const nextStatus = target.status === "Pago" ? "Pendente" : "Pago";
      if (nextStatus === "Pago") {
        const cartaoVinculado = getCartaoVinculado(target);
        const faturaFechada = cartaoVinculado?.faturasFechadas?.includes(target.mes);
        if (cartaoVinculado && !faturaFechada) {
          showAlert("A fatura está aberta. Feche a fatura para permitir o pagamento.");
          return prev;
        }
      }
      return prev.map((d) =>
        d.id === id ? { ...d, status: nextStatus } : d
      );
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

    showConfirm("Tem certeza que deseja excluir esta despesa?", () => {
      setDespesas((prev) => {
        const item = prev.find((d) => d.id === id);
        if (!item) return prev;

        if (effectiveMes && item.meses && item.meses.includes(effectiveMes)) {
          const newMeses = item.meses.filter((m) => m !== effectiveMes);
          if (newMeses.length === 0) {
            return prev.filter((d) => d.id !== id);
          }
          return prev.map((d) => {
            if (d.id === id) {
              return {
                ...d,
                meses: newMeses,
                mes: (d.mes === effectiveMes) ? newMeses[0] : d.mes
              };
            }
            return d;
          });
        }

        return prev.filter((d) => d.id !== id);
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
      mesInicial: effectiveMes || despesa.mes || "",
      meses: effectiveMes ? [effectiveMes] : (despesa.meses || []),
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
      setDespesas((prev) => [...prev, ...newEntries]);
      setManualOpen(false);
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
      setDespesas((prev) => {
        const original = prev.find((d) => d.id === despesaEditId);
        if (original && original.meses && original.meses.length > 0) {
          const removedMonths = original.meses.filter((m) => !novaDespesa.meses.includes(m));
          if (removedMonths.length > 0) {
            const preservedEntry = {
              ...original,
              id: createId("desp-preserved"),
              meses: removedMonths,
              mes: removedMonths.includes(original.mes) ? original.mes : removedMonths[0]
            };
            return [...prev.map((d) => d.id === despesaEditId ? novaDespesa : d), preservedEntry];
          }
        }
        return prev.map((d) => d.id === despesaEditId ? novaDespesa : d);
      });
    } else {
      setDespesas((prev) => [...prev, novaDespesa]);
    }
    setManualOpen(false);
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
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={openManualModal} title="Cadastrar uma nova despesa">
              + Nova despesa
            </button>
          </div>
        </div>
        <form className="form-inline" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            Orçamento
            <select
              value={effectiveOrcamentoId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, orcamentoId: event.target.value }))
              }
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
      </section>
      <section className="panel">
        <h2>Lista de Despesas</h2>
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
                <th scope="col">Data</th>
                <th scope="col">Descrição</th>
                <th scope="col">Categoria</th>
                <th scope="col">Valor</th>
                <th scope="col">Status</th>
                <th scope="col" className="list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDespesas.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={6}>Sem despesas para o mês selecionado.</td>
                </tr>
              ) : (
                filteredDespesas.map((despesa) => (
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
                          onClick={() => toggleStatus(despesa.id)}
                          title={despesa.status === "Pago" ? "Cancelar pagamento" : "Marcar como pago"}
                          aria-label={despesa.status === "Pago" ? "Cancelar pagamento" : "Marcar como pago"}
                        >
                          {despesa.status === "Pago" ? <IconX /> : <IconCheck />}
                        </button>
                        <button
                          type="button"
                          className="icon-button info"
                          onClick={() => editarDespesa(despesa)}
                          title="Editar esta despesa"
                          aria-label="Editar esta despesa"
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => excluirDespesa(despesa.id)}
                          title="Excluir esta despesa"
                          aria-label="Excluir esta despesa"
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
        <div className="summary">
          <div className="summary-card">
            <span className="summary-title">Total lançado</span>
            <strong className="summary-value">{totals.lancado}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-title">Total pago</span>
            <strong className="summary-value">{totals.pago}</strong>
          </div>
        </div>
      </section>
      <Modal open={manualOpen} title={despesaEditId ? "Editar despesa" : "Nova despesa"} onClose={() => setManualOpen(false)}>
        <form
          className="modal-grid"
          onSubmit={handleSaveManual}
        >
          <label className="field">
            Categoria
            <select
              value={manualForm.categoriaId}
              onChange={(event) =>
                setManualForm((prev) => ({ ...prev, categoriaId: event.target.value }))
              }
            >
              {despesasCategorias.length === 0 ? (
                <option value="">Sem categorias disponíveis</option>
              ) : (
                despesasCategorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))
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
                  const gasto = gastosPredefinidos.find((g) => g.descricao === desc);
                  setManualForm((prev) => ({
                    ...prev,
                    descricao: desc,
                    categoriaId: gasto?.categoriaId || prev.categoriaId
                  }));
                }}
              >
                <option value="">Selecione...</option>
                {gastosPredefinidos.map((gasto) => (
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
              />
              Informar manualmente
            </label>
          </label>
          <label className="field">
            Complemento
            <input
              type="text"
              value={manualForm.complemento}
              placeholder="Opcional"
              onChange={(event) =>
                setManualForm((prev) => ({ ...prev, complemento: event.target.value }))
              }
            />
          </label>
          <label className="field">
            Valor
            <input
              type="number"
              step="0.01"
              value={manualForm.valor}
              onChange={(event) =>
                setManualForm((prev) => ({ ...prev, valor: event.target.value }))
              }
            />
          </label>
          <label className="field">
            Data
            <input
              type="date"
              value={manualForm.data}
              onChange={(event) =>
                setManualForm((prev) => ({ ...prev, data: event.target.value }))
              }
            />
          </label>
          <label className="field">
            Tipo
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
          {manualForm.tipoRecorrencia === "PARCELADO" ? (
            <label className="field">
              Nº de parcelas
              <input
                type="number"
                value={manualForm.qtdParcelas}
                onChange={(event) =>
                  setManualForm((prev) => ({ ...prev, qtdParcelas: event.target.value }))
                }
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
                    />
                    <span>{mes}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <label className="field">
            Mês inicial
            <select
              value={manualForm.mesInicial}
              onChange={(event) =>
                setManualForm((prev) => ({ ...prev, mesInicial: event.target.value }))
              }
            >
              {mesesDisponiveis.map((mes) => (
                <option key={mes} value={mes}>
                  Mês {mes}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Status
            <select
              value={manualForm.status}
              onChange={(event) =>
                setManualForm((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setManualOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="primary">Salvar</button>
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
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          onConfirmAction();
          setConfirmModalOpen(false);
        }}
      />
    </div>
  );
};

export { DespesasPage };
