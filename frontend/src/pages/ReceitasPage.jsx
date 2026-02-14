import { useMemo, useState } from "react";
import { AlertDialog, ConfirmDialog } from "../components/Dialogs";
import { IconCheck, IconEdit, IconTrash, IconX } from "../components/Icons";
import Modal from "../components/Modal";
import { MONTHS_ORDER, createId, formatCurrency, getCurrentMonthName } from "../utils/appUtils";

const ReceitasPage = ({ categorias, tiposReceita, orcamentos, receitas, setReceitas }) => {
  const receitasCategorias = categorias.filter((categoria) => categoria.tipo === "RECEITA");
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

  const filteredReceitas = useMemo(() => {
    return receitas.filter((r) => {
      if (r.orcamentoId !== effectiveOrcamentoId) return false;
      if (r.mes === effectiveMes) return true;
      if (r.meses && r.meses.includes(effectiveMes)) return true;
      return false;
    });
  }, [receitas, effectiveOrcamentoId, effectiveMes]);

  const totals = useMemo(() => {
    let lancado = 0;
    let recebido = 0;
    filteredReceitas.forEach((r) => {
      const val = parseFloat(r.valor) || 0;
      lancado += val;
      if (r.status === "Recebido") recebido += val;
    });
    const pendente = lancado - recebido;
    return {
      lancado: formatCurrency(lancado),
      recebido: formatCurrency(recebido),
      lancadoNum: lancado,
      recebidoNum: recebido,
      pendente: formatCurrency(pendente),
      pendenteNum: pendente,
      tudoRecebido: pendente === 0
    };
  }, [filteredReceitas]);

  const [manualOpen, setManualOpen] = useState(false);
  const [isManualDescricao, setIsManualDescricao] = useState(false);
  const [manualForm, setManualForm] = useState({
    categoriaId: receitasCategorias[0]?.id ?? "",
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

  const [receitaEditId, setReceitaEditId] = useState(null);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, _setAlertMessage] = useState("");
  const alertTitle = "Atenção";
  const alertVariant = "info";
  const alertPrimaryLabel = "OK";
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});
  const confirmTitle = "Confirmação";
  const confirmVariant = "danger";
  const confirmPrimaryLabel = "Excluir";
  const confirmSecondaryLabel = "Cancelar";

  const showConfirm = (message, action) => {
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setConfirmModalOpen(true);
  };

  const openManualModal = () => {
    setReceitaEditId(null);
    const temPredefinidos = tiposReceita.length > 0;
    setIsManualDescricao(!temPredefinidos);
    setManualForm({
      categoriaId: receitasCategorias[0]?.id ?? "",
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

  const toggleStatus = (id) => {
    setReceitas((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "Recebido" ? "Pendente" : "Recebido" }
          : r
      )
    );
  };

  const excluirReceita = (id) => {
    showConfirm("Tem certeza que deseja excluir esta receita?", () => {
      setReceitas((prev) => {
        const item = prev.find((r) => r.id === id);
        if (!item) return prev;

        if (effectiveMes && item.meses && item.meses.includes(effectiveMes)) {
          const newMeses = item.meses.filter((m) => m !== effectiveMes);
          if (newMeses.length === 0) {
            return prev.filter((r) => r.id !== id);
          }
          return prev.map((r) => {
            if (r.id === id) {
              return {
                ...r,
                meses: newMeses,
                mes: (r.mes === effectiveMes) ? newMeses[0] : r.mes
              };
            }
            return r;
          });
        }

        return prev.filter((r) => r.id !== id);
      });
    });
  };

  const editarReceita = (receita) => {
    setReceitaEditId(receita.id);
    const matchPredef = tiposReceita.some((t) => t.descricao === receita.descricao);
    setIsManualDescricao(!matchPredef);
    setManualForm({
      categoriaId: receita.categoriaId || receitasCategorias[0]?.id || "",
      descricao: receita.descricao,
      complemento: receita.complemento || "",
      valor: receita.valor,
      tipoRecorrencia: receita.tipoRecorrencia || "EVENTUAL",
      qtdParcelas: receita.qtdParcelas || "",
      data: receita.data,
      mesInicial: effectiveMes || receita.mes || "",
      meses: effectiveMes ? [effectiveMes] : (receita.meses || []),
      status: receita.status || "Pendente"
    });
    setManualOpen(true);
  };

  const toggleMesReceita = (mes) => {
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

  const handleSaveManual = (event) => {
    event.preventDefault();

    if (!receitaEditId && manualForm.tipoRecorrencia === "PARCELADO" && parseInt(manualForm.qtdParcelas) > 1) {
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
          id: createId("rec-parc"),
          orcamentoId: effectiveOrcamentoId,
          mes: getNextMonth(manualForm.mesInicial, i),
          data: manualForm.data,
          categoriaId: manualForm.categoriaId,
          descricao: `${manualForm.descricao} (${i + 1}/${qtd})`,
          complemento: manualForm.complemento || "",
          valor: parcValue,
          tipoRecorrencia: "PARCELADO",
          parcela: i + 1,
          totalParcelas: qtd,
          meses: [],
          status: "Pendente",
          categoria: receitasCategorias.find((c) => c.id === manualForm.categoriaId)?.nome || "—"
        });
      }
      setReceitas((prev) => [...prev, ...newEntries]);
      setManualOpen(false);
      return;
    }

    let novaReceita = {
      id: receitaEditId || createId("rec"),
      orcamentoId: effectiveOrcamentoId,
      mes: manualForm.mesInicial,
      data: manualForm.data,
      categoriaId: manualForm.categoriaId,
      descricao: manualForm.descricao,
      complemento: manualForm.complemento || "",
      valor: manualForm.valor,
      tipoRecorrencia: manualForm.tipoRecorrencia,
      qtdParcelas: manualForm.qtdParcelas,
      meses: manualForm.meses,
      status: manualForm.status,
      categoria: receitasCategorias.find((c) => c.id === manualForm.categoriaId)?.nome || "—"
    };

    if (effectiveMes && novaReceita.meses && novaReceita.meses.includes(effectiveMes)) {
      novaReceita.mes = effectiveMes;
    } else if (novaReceita.meses && novaReceita.meses.length > 0 && !novaReceita.meses.includes(novaReceita.mes)) {
      novaReceita.mes = novaReceita.meses[0];
    }

    if (receitaEditId) {
      setReceitas((prev) => {
        const original = prev.find((r) => r.id === receitaEditId);
        if (original) {
          const originalMeses = original.meses || [];
          if (originalMeses.length > 0) {
            const removedMonths = originalMeses.filter((m) => !novaReceita.meses.includes(m));
            if (removedMonths.length > 0) {
              const preservedEntry = {
                ...original,
                id: createId("rec-preserved"),
                meses: removedMonths,
                mes: removedMonths.includes(original.mes) ? original.mes : removedMonths[0]
              };
              return [...prev.map((r) => r.id === receitaEditId ? novaReceita : r), preservedEntry];
            }
          }
        }
        return prev.map((r) => r.id === receitaEditId ? novaReceita : r);
      });
    } else {
      setReceitas((prev) => [...prev, novaReceita]);
    }
    setManualOpen(false);
  };

  return (
    <div className="page-grid">
      <section className="panel filters-panel">
        <div className="panel-header">
          <div>
            <h2>Selecione orçamento e mês para consultar as receitas.</h2>
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={openManualModal} title="Cadastrar uma nova receita">
              + Nova receita
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
        <h2>Lista de Receitas</h2>
        <div className="table list-table-wrapper">
          <table className="list-table" aria-label="Lista de Receitas">
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
              {filteredReceitas.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={6}>Sem receitas para o mês selecionado.</td>
                </tr>
              ) : (
                filteredReceitas.map((receita) => (
                  <tr className="list-table__row" key={receita.id}>
                    <td>{new Date(receita.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                    <td>{receita.complemento ? `${receita.descricao} - ${receita.complemento}` : receita.descricao}</td>
                    <td>{receita.categoria}</td>
                    <td>{formatCurrency(receita.valor)}</td>
                    <td>{receita.status}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button
                          type="button"
                          className={`icon-button ${receita.status === "Recebido" ? "danger" : "success"}`}
                          onClick={() => toggleStatus(receita.id)}
                          title={receita.status === "Recebido" ? "Cancelar recebimento" : "Marcar como recebido"}
                          aria-label={receita.status === "Recebido" ? "Cancelar recebimento" : "Marcar como recebido"}
                        >
                          {receita.status === "Recebido" ? <IconX /> : <IconCheck />}
                        </button>
                        <button
                          type="button"
                          className="icon-button info"
                          onClick={() => editarReceita(receita)}
                          title="Editar esta receita"
                          aria-label="Editar esta receita"
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-button delete"
                          onClick={() => excluirReceita(receita.id)}
                          title="Excluir esta receita"
                          aria-label="Excluir esta receita"
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
            <strong className="summary-value" style={{ fontSize: "1.1rem", fontWeight: "700" }}>{totals.lancado}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-title">Total recebido</span>
            <strong
              className="summary-value"
              style={{
                color: totals.tudoRecebido ? "#15803d" : "#059669",
                fontSize: "1.1rem",
                fontWeight: totals.tudoRecebido ? "700" : "600"
              }}
            >
              {totals.recebido}
            </strong>
          </div>
          <div className="summary-card">
            <span className="summary-title">Pendente de recebimento</span>
            <strong
              className="summary-value"
              style={{
                color: totals.pendenteNum === 0 ? "#64748b" : "#ea580c",
                fontSize: "1.1rem",
                fontWeight: totals.pendenteNum !== 0 ? "700" : "600"
              }}
            >
              {totals.pendente}
            </strong>
          </div>
        </div>
      </section>
      <Modal open={manualOpen} title={receitaEditId ? "Editar receita" : "Nova receita"} onClose={() => setManualOpen(false)}>
        <form
          className="modal-grid"
          onSubmit={handleSaveManual}
        >
          <div className="modal-grid-row">
            <label className="field">
              Categoria
              <select
                value={manualForm.categoriaId}
                onChange={(event) =>
                  setManualForm((prev) => ({ ...prev, categoriaId: event.target.value }))
                }
              >
                {receitasCategorias.length === 0 ? (
                  <option value="">Sem categorias disponíveis</option>
                ) : (
                  receitasCategorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="field">
              Descrição
              {!isManualDescricao && tiposReceita.length > 0 ? (
                <select
                  value={manualForm.descricao}
                  onChange={(event) =>
                    setManualForm((prev) => ({ ...prev, descricao: event.target.value }))
                  }
                >
                  <option value="">Selecione...</option>
                  {tiposReceita.map((tipo) => (
                    <option key={tipo.id} value={tipo.descricao}>
                      {tipo.descricao}
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
            />
          </label>
          <div className="modal-grid-row">
            <label className="field">
              Valor (R$)
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
          </div>
          <div className="modal-grid-row">
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
                      onChange={() => toggleMesReceita(mes, "manual")}
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
            >
              <option value="Pendente">Pendente</option>
              <option value="Recebido">Recebido</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setManualOpen(false)} title="Fechar sem salvar">
              Cancelar
            </button>
            <button type="submit" className="primary" title="Confirmar e salvar dados">Salvar</button>
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

export { ReceitasPage };
