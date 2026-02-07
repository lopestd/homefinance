import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const MONTHS_ORDER = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const getCurrentMonthName = () => {
  return MONTHS_ORDER[new Date().getMonth()];
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

let idSeed = 0;
const createId = (prefix) => {
  idSeed += 1;
  return `${prefix}-${idSeed}`;
};

const Modal = ({ open, title, children }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const IconCheck = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path fill="currentColor" d="M7.5 13.5 3.5 9.5l1.4-1.4 2.6 2.6 7.6-7.6 1.4 1.4z" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path fill="currentColor" d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4 1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4 1.4-7.6 7.6z" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l9.06-9.06.92.92L5.92 19.58zM20.71 7.04a1 1 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v8h-2v-8zm4 0h2v8h-2v-8zM7 10h2v8H7v-8z" />
  </svg>
);

const DashboardPage = ({ receitas, despesas, orcamentos }) => {
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

  const resumoMensal = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes) {
      return { recLancadas: 0, recRecebidas: 0, despLancadas: 0, despPagas: 0, saldo: 0 };
    }

    let recLancadas = 0;
    let recRecebidas = 0;
    let despLancadas = 0;
    let despPagas = 0;

    receitas.forEach(r => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = r.mes === effectiveMes || (r.meses && r.meses.includes(effectiveMes));
      if (isActive) {
        const val = parseFloat(r.valor) || 0;
        recLancadas += val;
        if (r.status === "Recebido") recRecebidas += val;
      }
    });

    despesas.forEach(d => {
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

    receitas.forEach(r => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const val = parseFloat(r.valor) || 0;
      const occurrences = (r.meses && r.meses.length > 0) ? r.meses.length : (r.mes ? 1 : 0);
      recPrevisto += val * occurrences;
      if (r.status === "Recebido") {
        recRecebido += val * occurrences;
      }
    });

    despesas.forEach(d => {
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

  return (
    <div className="page-grid">
      <section className="panel filters-panel">
        <div className="panel-header">
          <div>
            <h2>Resumo Financeiro</h2>
          </div>
        </div>
        <form className="form-inline" onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            Orçamento
            <select value={effectiveOrcamentoId} onChange={(e) => setSelectedOrcamentoId(e.target.value)}>
              {orcamentos.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <label className="field">
            Mês
            <select value={effectiveMes} onChange={(e) => setSelectedMes(e.target.value)}>
              {mesesDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </form>
      </section>

      {/* Bloco 1: Resumo Mensal */}
      <section className="panel">
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          Resumo financeiro do mês de <span className="badge-month">{effectiveMes}</span>
        </h3>
        <div className="dashboard-grid">
          <div className="summary-card" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: '-16px', marginBottom: '8px', color: '#64748b' }}>Receitas</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Previsto:</span>
              <strong>{formatCurrency(resumoMensal.recLancadas)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Recebido:</span>
              <strong style={{ color: "#059669" }}>{formatCurrency(resumoMensal.recRecebidas)}</strong>
            </div>
          </div>

          <div className="summary-card" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: '-16px', marginBottom: '8px', color: '#64748b' }}>Despesas</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Previsto:</span>
              <strong>{formatCurrency(resumoMensal.despLancadas)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Pago:</span>
              <strong style={{ color: "#dc2626" }}>{formatCurrency(resumoMensal.despPagas)}</strong>
            </div>
          </div>

          <div className="summary-card saldo-mes-card" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: '-16px', marginBottom: '2px', color: '#64748b' }}>Saldo do Mês</h4>
            <div className="saldo-row">
              <span style={{ color: '#64748b' }}>Saldo do Mês (Previsto):</span>
              <strong>{formatCurrency(resumoMensal.recLancadas - resumoMensal.despLancadas)}</strong>
            </div>
            <div className="saldo-row">
              <span style={{ color: '#64748b' }}>Saldo em Conta (Mês):</span>
              <strong style={{ color: resumoMensal.saldo >= 0 ? "#059669" : "#dc2626" }}>
                {formatCurrency(resumoMensal.saldo)}
              </strong>
            </div>
            <div className="saldo-row">
              <span style={{ color: '#64748b' }}>Saldo Acumulado (Mês):</span>
              <strong style={{ color: (resumoMensal.recLancadas - resumoMensal.despLancadas) >= 0 ? "#2563eb" : "#dc2626" }}>
                {formatCurrency(resumoMensal.recLancadas - resumoMensal.despLancadas)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco 2: Resumo Anual */}
      <section className="panel">
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          Resumo financeiro do orçamento anual <span className="badge-year">{currentOrcamento?.label}</span>
        </h3>
        <div className="dashboard-grid">
          <div className="summary-card" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0, marginBottom: '8px', color: '#64748b' }}>Receitas do Ano</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Previsto:</span>
              <strong>{formatCurrency(resumoAnual.recPrevisto)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Recebido:</span>
              <strong style={{ color: "#059669" }}>{formatCurrency(resumoAnual.recRecebido)}</strong>
            </div>
          </div>

          <div className="summary-card" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0, marginBottom: '8px', color: '#64748b' }}>Despesas do Ano</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Previsto:</span>
              <strong>{formatCurrency(resumoAnual.despPrevisto)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Pago:</span>
              <strong style={{ color: "#dc2626" }}>{formatCurrency(resumoAnual.despPago)}</strong>
            </div>
          </div>

          <div className="summary-card" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0, marginBottom: '8px', color: '#64748b' }}>Saldo Anual</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Saldo Anual (Previsão):</span>
              <strong>{formatCurrency(resumoAnual.saldoPrevisto)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Saldo Acumulado (Previsão):</span>
              <strong style={{ color: resumoAnual.saldoRealizado >= 0 ? "#059669" : "#dc2626" }}>
                {formatCurrency(resumoAnual.saldoRealizado)}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

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
        const item = prev.find(r => r.id === id);
        if (!item) return prev;

        if (effectiveMes && item.meses && item.meses.includes(effectiveMes)) {
          const newMeses = item.meses.filter(m => m !== effectiveMes);
          if (newMeses.length === 0) {
            return prev.filter(r => r.id !== id);
          }
          return prev.map(r => {
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
    const matchPredef = tiposReceita.some(t => t.descricao === receita.descricao);
    setIsManualDescricao(!matchPredef);
    setManualForm({
      categoriaId: receita.categoriaId || receitasCategorias[0]?.id || "",
      descricao: receita.descricao,
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
        return { ...prev, meses: [...currentMeses, mes].sort((a, b) => {
          const monthsOrder = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ];
          return monthsOrder.indexOf(a) - monthsOrder.indexOf(b);
        }) };
      }
    });
  };

  const handleSaveManual = (event) => {
    event.preventDefault();
    let novaReceita = {
      id: receitaEditId || createId("rec"),
      orcamentoId: effectiveOrcamentoId,
      mes: manualForm.mesInicial,
      data: manualForm.data,
      categoriaId: manualForm.categoriaId,
      descricao: manualForm.descricao,
      valor: manualForm.valor,
      tipoRecorrencia: manualForm.tipoRecorrencia,
      qtdParcelas: manualForm.qtdParcelas,
      meses: manualForm.meses,
      status: manualForm.status,
      categoria: receitasCategorias.find(c => c.id === manualForm.categoriaId)?.nome || "—"
    };

    if (effectiveMes && novaReceita.meses && novaReceita.meses.includes(effectiveMes)) {
      novaReceita.mes = effectiveMes;
    } else if (novaReceita.meses && novaReceita.meses.length > 0 && !novaReceita.meses.includes(novaReceita.mes)) {
      novaReceita.mes = novaReceita.meses[0];
    }

    if (receitaEditId) {
      setReceitas(prev => {
        const original = prev.find(r => r.id === receitaEditId);
        if (original) {
          const originalMeses = original.meses || [];
          if (originalMeses.length > 0) {
            const removedMonths = originalMeses.filter(m => !novaReceita.meses.includes(m));
            if (removedMonths.length > 0) {
              const preservedEntry = {
                ...original,
                id: createId("rec-preserved"),
                meses: removedMonths,
                mes: removedMonths.includes(original.mes) ? original.mes : removedMonths[0]
              };
              return [...prev.map(r => r.id === receitaEditId ? novaReceita : r), preservedEntry];
            }
          }
        }
        return prev.map(r => r.id === receitaEditId ? novaReceita : r);
      });
    } else {
      setReceitas(prev => [...prev, novaReceita]);
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
                    <td>{new Date(receita.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td>{receita.descricao}</td>
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
                          className="icon-button danger"
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
            <strong className="summary-value" style={{ fontSize: '1.1rem', fontWeight: '700' }}>{totals.lancado}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-title">Total recebido</span>
            <strong 
              className="summary-value" 
              style={{ 
                color: totals.tudoRecebido ? '#15803d' : '#059669',
                fontSize: '1.1rem',
                fontWeight: totals.tudoRecebido ? '700' : '600'
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
                color: totals.pendenteNum === 0 ? '#64748b' : '#ea580c',
                fontSize: '1.1rem',
                fontWeight: totals.pendenteNum !== 0 ? '700' : '600'
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
                      onChange={() => toggleMesReceita(mes, "manual")}
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

      <Modal open={alertModalOpen} title="Atenção" onClose={() => setAlertModalOpen(false)} size="small">
        <div className="modal-grid">
          <p>{alertMessage}</p>
          <div className="modal-actions">
             <button type="button" className="primary" onClick={() => setAlertModalOpen(false)}>OK</button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmModalOpen} title="Confirmação" onClose={() => setConfirmModalOpen(false)} size="small">
        <div className="modal-grid">
          <p>{confirmMessage}</p>
          <div className="modal-actions">
             <button type="button" className="ghost" onClick={() => setConfirmModalOpen(false)}>Cancelar</button>
             <button type="button" className="danger" onClick={() => {
                onConfirmAction();
                setConfirmModalOpen(false);
             }}>Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const DespesasPage = ({
  categorias,
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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const _showAlert = (message) => {
    setAlertMessage(message);
    setAlertModalOpen(true);
  };

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
        return { ...prev, meses: [...currentMeses, mes].sort((a, b) => {
          const monthsOrder = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ];
          return monthsOrder.indexOf(a) - monthsOrder.indexOf(b);
        }) };
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
    setDespesas((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "Pago" ? "Pendente" : "Pago" }
          : d
      )
    );
  };

  const excluirDespesa = (id) => {
    const item = despesas.find((d) => d.id === id);
    const cartaoVinculado = item ? getCartaoVinculado(item) : null;

    if (cartaoVinculado && temLancamentosNoCartao(cartaoVinculado.id)) {
      _showAlert(
        "Não é possível excluir esta despesa.\nO cartão de crédito possui lançamentos de despesas nessa fatura.\nPara excluir essa despesa, remova todos os lançamentos no cartão."
      );
      return;
    }

    showConfirm("Tem certeza que deseja excluir esta despesa?", () => {
      setDespesas((prev) => {
        const item = prev.find(d => d.id === id);
        if (!item) return prev;

        if (effectiveMes && item.meses && item.meses.includes(effectiveMes)) {
          const newMeses = item.meses.filter(m => m !== effectiveMes);
          if (newMeses.length === 0) {
            return prev.filter(d => d.id !== id);
          }
          return prev.map(d => {
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

  const editarDespesa = (despesa) => {
    setDespesaEditId(despesa.id);
    const matchPredef = gastosPredefinidos.some(g => g.descricao === despesa.descricao);
    setIsManualDescricao(!matchPredef);
    setManualForm({
      categoriaId: despesa.categoriaId || despesasCategorias[0]?.id || "",
      descricao: despesa.descricao,
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

  const handleSaveManual = (event) => {
    event.preventDefault();
    let novaDespesa = {
      id: despesaEditId || createId("desp"),
      orcamentoId: effectiveOrcamentoId,
      mes: manualForm.mesInicial,
      data: manualForm.data,
      categoriaId: manualForm.categoriaId,
      descricao: manualForm.descricao,
      valor: manualForm.valor,
      tipoRecorrencia: manualForm.tipoRecorrencia,
      qtdParcelas: manualForm.qtdParcelas,
      meses: manualForm.meses,
      status: manualForm.status,
      categoria: despesasCategorias.find(c => c.id === manualForm.categoriaId)?.nome || "—"
    };

    if (effectiveMes && novaDespesa.meses && novaDespesa.meses.includes(effectiveMes)) {
      novaDespesa.mes = effectiveMes;
    } else if (novaDespesa.meses && novaDespesa.meses.length > 0 && !novaDespesa.meses.includes(novaDespesa.mes)) {
      novaDespesa.mes = novaDespesa.meses[0];
    }

    if (despesaEditId) {
      setDespesas(prev => {
        const original = prev.find(d => d.id === despesaEditId);
        if (original && original.meses && original.meses.length > 0) {
          const removedMonths = original.meses.filter(m => !novaDespesa.meses.includes(m));
          if (removedMonths.length > 0) {
            const preservedEntry = {
              ...original,
              id: createId("desp-preserved"),
              meses: removedMonths,
              mes: removedMonths.includes(original.mes) ? original.mes : removedMonths[0]
            };
            return [...prev.map(d => d.id === despesaEditId ? novaDespesa : d), preservedEntry];
          }
        }
        return prev.map(d => d.id === despesaEditId ? novaDespesa : d);
      });
    } else {
      setDespesas(prev => [...prev, novaDespesa]);
    }
    setManualOpen(false);
  };

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
                    <td>{new Date(despesa.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td>{despesa.descricao}</td>
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
                  const gasto = gastosPredefinidos.find(g => g.descricao === desc);
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

      <Modal open={alertModalOpen} title="Atenção" onClose={() => setAlertModalOpen(false)} size="small">
        <div className="modal-grid">
          <p style={{ whiteSpace: "pre-line" }}>{alertMessage}</p>
          <div className="modal-actions">
             <button type="button" className="primary" onClick={() => setAlertModalOpen(false)}>OK</button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmModalOpen} title="Confirmação" onClose={() => setConfirmModalOpen(false)} size="small">
        <div className="modal-grid">
          <p>{confirmMessage}</p>
          <div className="modal-actions">
             <button type="button" className="ghost" onClick={() => setConfirmModalOpen(false)}>Cancelar</button>
             <button type="button" className="danger" onClick={() => {
                onConfirmAction();
                setConfirmModalOpen(false);
             }}>Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const CartaoPage = ({
  cartoes,
  setCartoes,
  lancamentosCartao,
  setLancamentosCartao,
  orcamentos,
  setDespesas,
  categorias,
  gastosPredefinidos
}) => {
  const [selectedCartaoId, setSelectedCartaoId] = useState("");
  const [selectedMes, setSelectedMes] = useState(getCurrentMonthName());
  const [isManualDescricao, setIsManualDescricao] = useState(false);
  const effectiveCartaoId = selectedCartaoId || cartoes[0]?.id || "";

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const selectedCartao = useMemo(() => cartoes.find(c => c.id === effectiveCartaoId) || {}, [cartoes, effectiveCartaoId]);

  const filteredLancamentos = useMemo(() => {
    if (!effectiveCartaoId) return [];
    return lancamentosCartao.filter(l => 
      l.cartaoId === effectiveCartaoId && 
      (l.mesReferencia === selectedMes || (l.meses && l.meses.includes(selectedMes)))
    );
  }, [lancamentosCartao, effectiveCartaoId, selectedMes]);

  const { fixoParcelado, gastosMes, totalMes } = useMemo(() => {
    let fixo = 0;
    let gastos = 0;
    filteredLancamentos.forEach(l => {
      const val = parseFloat(l.valor) || 0;
      if (l.tipoRecorrencia === "FIXO" || l.tipoRecorrencia === "PARCELADO") {
        fixo += val;
      } else {
        gastos += val;
      }
    });
    return { fixoParcelado: fixo, gastosMes: gastos, totalMes: fixo + gastos };
  }, [filteredLancamentos]);

  const valorAlocado = useMemo(() => {
     if (!selectedCartao) return 0;
     const limitesMensais = selectedCartao.limitesMensais || {};
     if (limitesMensais[selectedMes] !== undefined && limitesMensais[selectedMes] !== null && limitesMensais[selectedMes] !== "") {
        return parseFloat(limitesMensais[selectedMes]);
     }
     return parseFloat(selectedCartao.limite) || 0;
  }, [selectedCartao, selectedMes]);

  const saldoMes = valorAlocado - totalMes;

  const [limiteModalOpen, setLimiteModalOpen] = useState(false);
  const [limiteEditValue, setLimiteEditValue] = useState("");

  const isFaturaFechada = useMemo(() => {
    return selectedCartao.faturasFechadas?.includes(selectedMes) || false;
  }, [selectedCartao, selectedMes]);

  const [modalOpen, setModalOpen] = useState(false);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertModalOpen(true);
  };

  const showConfirm = (message, action) => {
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setConfirmModalOpen(true);
  };

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    mesReferencia: "",
    categoriaId: "",
    tipoRecorrencia: "EVENTUAL",
    qtdParcelas: "",
    meses: []
  });

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

  const openModal = (lancamento = null) => {
    if (lancamento) {
      setEditId(lancamento.id);
      
      const matchPredef = gastosPredefinidos && gastosPredefinidos.some(g => g.descricao === lancamento.descricao);
      setIsManualDescricao(!matchPredef);

      setForm({
        descricao: lancamento.descricao,
        valor: lancamento.valor,
        data: lancamento.data,
        mesReferencia: lancamento.mesReferencia,
        categoriaId: lancamento.categoriaId || "",
        tipoRecorrencia: lancamento.tipoRecorrencia || "EVENTUAL",
        qtdParcelas: lancamento.qtdParcelas || "",
        meses: lancamento.meses || []
      });
    } else {
      setEditId(null);
      
      const temPredefinidos = gastosPredefinidos && gastosPredefinidos.length > 0;
      setIsManualDescricao(!temPredefinidos);

      let targetCat = categorias.find(c => c.nome.toLowerCase() === "Bancos/Cartões".toLowerCase() && c.tipo === "DESPESA");
      
      if (!targetCat) {
        targetCat = categorias.find(c => c.tipo === "DESPESA");
      }

      setForm({
        descricao: "",
        valor: "",
        data: new Date().toISOString().split("T")[0],
        mesReferencia: selectedMes,
        categoriaId: targetCat ? targetCat.id : "",
        tipoRecorrencia: "EVENTUAL",
        qtdParcelas: "",
        meses: []
      });
    }
    setModalOpen(true);
  };

  const toggleFaturaStatus = () => {
    if (!effectiveCartaoId || !selectedMes) return;
    const currentFechadas = selectedCartao.faturasFechadas || [];
    let newFechadas;

    if (currentFechadas.includes(selectedMes)) {
      newFechadas = currentFechadas.filter(m => m !== selectedMes);
    } else {
      newFechadas = [...currentFechadas, selectedMes];
    }
    
    const updatedCartoes = cartoes.map(c => 
      c.id === effectiveCartaoId ? { ...c, faturasFechadas: newFechadas } : c
    );
    setCartoes(updatedCartoes);
    window.localStorage.setItem("hf_cartoes", JSON.stringify(updatedCartoes));

    syncDespesa(selectedMes, effectiveCartaoId, lancamentosCartao, updatedCartoes);
  };

  const syncDespesa = (mes, cartaoId, currentLancamentos, cartoesList = cartoes) => {
    const cartao = cartoesList.find(c => c.id === cartaoId);
    if (!cartao) return;

    const totalGastos = currentLancamentos
      .filter(l => l.cartaoId === cartaoId && (l.mesReferencia === mes || (l.meses && l.meses.includes(mes))))
      .reduce((acc, l) => acc + (parseFloat(l.valor) || 0), 0);

    const isFechada = cartao.faturasFechadas?.includes(mes);
    
    let valorFinal = totalGastos;
    if (!isFechada) {
        let limite = parseFloat(cartao.limite);
        if (cartao.limitesMensais && cartao.limitesMensais[mes] !== undefined && cartao.limitesMensais[mes] !== null && cartao.limitesMensais[mes] !== "") {
           limite = parseFloat(cartao.limitesMensais[mes]);
        }

        if (!isNaN(limite) && limite > 0) {
            valorFinal = limite;
        }
    }

    let catId = "";
    let catNome = "Bancos/Cartões";
    
    const existingCat = categorias.find(c => c.nome.toLowerCase() === catNome.toLowerCase() && c.tipo === "DESPESA");
    
    if (existingCat) {
      catId = existingCat.id;
    } else {
      const fallbackCat = categorias.find(c => c.tipo === "DESPESA");
      catId = fallbackCat ? fallbackCat.id : "";
    }

    const orcamento = orcamentos.find(o => o.meses && o.meses.includes(mes));
    if (!orcamento) return;

    const despesaDescricao = `Fatura do cartão ${cartao.nome}`;
    
    setDespesas(prev => {
      const existingDespesa = prev.find(d => 
        d.descricao === despesaDescricao && 
        d.mes === mes && 
        d.orcamentoId === orcamento.id
      );

      if (valorFinal > 0) {
        if (existingDespesa) {
          return prev.map(d => d.id === existingDespesa.id ? { ...d, valor: valorFinal } : d);
        } else {
          return [...prev, {
            id: createId("desp-auto"),
            orcamentoId: orcamento.id,
            mes: mes,
            data: new Date().toISOString().split("T")[0],
            categoriaId: catId,
            descricao: despesaDescricao,
            valor: valorFinal,
            status: "Pendente",
            categoria: catNome
          }];
        }
      } else {
        if (existingDespesa) {
          return prev.filter(d => d.id !== existingDespesa.id);
        }
        return prev;
      }
    });
  };

  const handleUpdateLimite = (e) => {
     e.preventDefault();
     const novoLimite = parseFloat(limiteEditValue);
     if (isNaN(novoLimite) || novoLimite < 0) return;

    const updatedCartoes = cartoes.map(c => {
       if (c.id === effectiveCartaoId) {
           const limites = c.limitesMensais || {};
           return { ...c, limitesMensais: { ...limites, [selectedMes]: novoLimite } };
        }
        return c;
     });
     
     setCartoes(updatedCartoes);
     window.localStorage.setItem("hf_cartoes", JSON.stringify(updatedCartoes));
     setLimiteModalOpen(false);
     syncDespesa(selectedMes, effectiveCartaoId, lancamentosCartao, updatedCartoes);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!effectiveCartaoId) return;

    const val = parseFloat(form.valor);
    if (isNaN(val) || val <= 0) return;

    const getNextMonth = (current, offset) => {
      const idx = months.indexOf(current);
      if (idx === -1) return current;
      return months[(idx + offset) % 12];
    };

    let newEntries = [];
    
    if (!editId && form.tipoRecorrencia === "PARCELADO" && parseInt(form.qtdParcelas) > 1) {
       const qtd = parseInt(form.qtdParcelas);
       const parcValue = val / qtd;
       
       for(let i=0; i<qtd; i++) {
          newEntries.push({
             id: createId("lanc-card-parc"),
             cartaoId: effectiveCartaoId,
             descricao: `${form.descricao} (${i+1}/${qtd})`,
             valor: parcValue,
             data: form.data,
             mesReferencia: getNextMonth(form.mesReferencia, i),
             categoriaId: form.categoriaId,
             tipoRecorrencia: "PARCELADO",
             parcela: i+1,
             totalParcelas: qtd,
             meses: []
          });
       }
    } else {
       let lancamento = {
          id: editId || createId("lanc-card"),
          cartaoId: effectiveCartaoId,
          descricao: form.descricao,
          valor: val,
          data: form.data,
          mesReferencia: form.mesReferencia,
          categoriaId: form.categoriaId,
          tipoRecorrencia: form.tipoRecorrencia,
          qtdParcelas: form.qtdParcelas,
          meses: form.meses || []
       };

       if (form.tipoRecorrencia === "FIXO") {
          if (selectedMes && form.meses && form.meses.includes(selectedMes)) {
             lancamento.mesReferencia = selectedMes;
          } else if (form.meses && form.meses.length > 0 && !form.meses.includes(form.mesReferencia)) {
             lancamento.mesReferencia = form.meses[0];
          }
       }
       newEntries.push(lancamento);
    }

    let nextLancamentos;
    if (editId) {
      const original = lancamentosCartao.find(l => l.id === editId);
      const novaVersao = newEntries[0];
      let preservedEntry = null;

      if (original && original.tipoRecorrencia === "FIXO" && original.meses && original.meses.length > 0) {
        const removedMonths = original.meses.filter(m => !novaVersao.meses.includes(m));
        if (removedMonths.length > 0) {
          preservedEntry = {
            ...original,
            id: createId("lanc-card-preserved"),
            meses: removedMonths,
            mesReferencia: removedMonths.includes(original.mesReferencia) ? original.mesReferencia : removedMonths[0]
          };
        }
      }

      nextLancamentos = lancamentosCartao.map(l => l.id === editId ? novaVersao : l);
      if (preservedEntry) {
        nextLancamentos.push(preservedEntry);
      }
    } else {
      nextLancamentos = [...lancamentosCartao, ...newEntries];
    }

    setLancamentosCartao(nextLancamentos);
    setModalOpen(false);
    
    let affectedMonths = new Set();
    newEntries.forEach(e => {
       affectedMonths.add(e.mesReferencia);
       if (e.meses) e.meses.forEach(m => affectedMonths.add(m));
    });
    
    if (editId) {
        const oldLancamento = lancamentosCartao.find(l => l.id === editId);
        if (oldLancamento) {
            affectedMonths.add(oldLancamento.mesReferencia);
            if (oldLancamento.meses) oldLancamento.meses.forEach(m => affectedMonths.add(m));
        }
    }

    Array.from(affectedMonths).forEach(m => syncDespesa(m, effectiveCartaoId, nextLancamentos));
  };

  const handleDelete = (id) => {
    showConfirm("Excluir lançamento?", () => {
      try {
        const lancamento = lancamentosCartao.find(l => l.id === id);
        if (!lancamento) return;
        
        let nextLancamentos;
        if (lancamento.tipoRecorrencia === "FIXO" && selectedMes && lancamento.meses && lancamento.meses.includes(selectedMes)) {
          const newMeses = lancamento.meses.filter(m => m !== selectedMes);
          
          if (newMeses.length === 0) {
            nextLancamentos = lancamentosCartao.filter(l => l.id !== id);
          } else {
            nextLancamentos = lancamentosCartao.map(l => {
              if (l.id === id) {
                return {
                  ...l,
                  meses: newMeses,
                  mesReferencia: (l.mesReferencia === selectedMes) ? newMeses[0] : l.mesReferencia
                };
              }
              return l;
            });
          }
        } else {
          nextLancamentos = lancamentosCartao.filter(l => l.id !== id);
        }
        
        setLancamentosCartao(nextLancamentos);

        const monthsToSync = new Set();
        monthsToSync.add(lancamento.mesReferencia);
        if (lancamento.meses) lancamento.meses.forEach(m => monthsToSync.add(m));
        
        Array.from(monthsToSync).forEach(m => syncDespesa(m, lancamento.cartaoId, nextLancamentos));
      } catch {
        showAlert("Ocorreu um erro ao excluir o lançamento. Tente novamente.");
      }
    });
  };

  return (
    <div className="page-grid">
       <section className="panel filters-panel">
        <div className="panel-header">
           <div><h2>Fatura do Cartão</h2></div>
           <div className="actions">
             <button type="button" className="primary" onClick={() => openModal()}>+ Novo lançamento</button>
           </div>
        </div>
        <form className="form-inline" onSubmit={e => e.preventDefault()}>
           <label className="field">
             Cartão
             <select value={effectiveCartaoId} onChange={e => setSelectedCartaoId(e.target.value)}>
               {cartoes.length === 0 && <option value="">Nenhum cartão cadastrado</option>}
               {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
             </select>
           </label>
           <label className="field">
             Mês
             <select value={selectedMes} onChange={e => setSelectedMes(e.target.value)}>
               {months.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
           </label>
        </form>
       </section>

       <section className="panel">
         <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
            Lançamentos de <span className="badge-month">{selectedMes}</span>
         </h3>
         
         <div className="table list-table-wrapper">
            <table className="list-table list-table--cartao" aria-label="Lançamentos do cartão">
              <colgroup>
                <col className="list-table__col list-table__col--date" />
                <col className="list-table__col list-table__col--desc" />
                <col className="list-table__col list-table__col--tipo" />
                <col className="list-table__col list-table__col--valor" />
                <col className="list-table__col list-table__col--acoes" />
              </colgroup>
              <thead className="list-table__head">
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Tipo de Gasto</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLancamentos.length === 0 ? (
                  <tr className="list-table__row list-table__row--empty">
                    <td colSpan={5}>Nenhum lançamento nesta fatura.</td>
                  </tr>
                ) : (
                  filteredLancamentos.map(l => (
                    <tr className="list-table__row" key={l.id}>
                      <td>{new Date(l.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      <td>{l.descricao}</td>
                      <td>{l.tipoRecorrencia === "FIXO" ? "Fixo" : l.tipoRecorrencia === "PARCELADO" ? "Parcelado" : "Eventual"}</td>
                      <td>{formatCurrency(l.valor)}</td>
                      <td className="list-table__cell list-table__cell--acoes">
                        <div className="actions">
                          <button className="icon-button info" onClick={() => openModal(l)} title="Editar"><IconEdit /></button>
                          <button className="icon-button danger" onClick={() => handleDelete(l.id)} title="Excluir"><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
         </div>

         <div className="dashboard-grid">
            <div className="summary-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ marginTop: '0', marginBottom: '0', color: '#64748b', fontSize: '0.9em' }}>Limite do Cartão</h4>
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
               <strong style={{ fontSize: '1.4em', color: '#0f172a' }}>{formatCurrency(valorAlocado)}</strong>
            </div>
            
            <div className="summary-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
               <h4 style={{ marginTop: '0', marginBottom: '4px', color: '#64748b', fontSize: '0.9em' }}>Fatura Atual</h4>
               <strong style={{ fontSize: '1.4em', color: '#dc2626' }}>{formatCurrency(totalMes)}</strong>
              <div style={{ fontSize: '0.8em', fontWeight: '500', color: '#64748b', marginTop: '1px' }}>
                  Fixo: {formatCurrency(fixoParcelado)} | Var: {formatCurrency(gastosMes)}
               </div>
            </div>

            <div className="summary-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
               <h4 style={{ marginTop: '0', marginBottom: '4px', color: '#64748b', fontSize: '0.9em' }}>Disponível</h4>
               <strong style={{ fontSize: '1.4em', color: saldoMes >= 0 ? '#16a34a' : '#dc2626' }}>{formatCurrency(saldoMes)}</strong>
            </div>

            <div className="summary-card" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                 <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.9em' }}>Status</h4>
                 <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.75em', 
                    fontWeight: 'bold',
                    background: isFaturaFechada ? '#fee2e2' : '#dcfce7',
                    color: isFaturaFechada ? '#991b1b' : '#166534'
                 }}>
                   {isFaturaFechada ? 'FECHADA' : 'ABERTA'}
                 </span>
               </div>
               <button 
                 type="button" 
                 onClick={toggleFaturaStatus}
                 style={{ 
                    marginTop: 'auto', 
                    width: '100%', 
                    padding: '6px', 
                    fontSize: '0.85em',
                    background: isFaturaFechada ? '#fff' : '#0f172a',
                    color: isFaturaFechada ? '#0f172a' : '#fff',
                    border: '1px solid #0f172a',
                    cursor: 'pointer',
                    borderRadius: '4px'
                 }}
               >
                 {isFaturaFechada ? 'Reabrir Fatura' : 'Fechar Fatura'}
               </button>
            </div>
         </div>
       </section>

       <Modal open={modalOpen} title={editId ? "Editar lançamento" : "Novo lançamento"} onClose={() => setModalOpen(false)}>
          <form className="modal-grid" onSubmit={handleSave}>
             <label className="field">
               Descrição
               {!isManualDescricao && gastosPredefinidos && gastosPredefinidos.length > 0 ? (
                 <select
                   value={form.descricao}
                   onChange={(e) => {
                    const desc = e.target.value;
                    const selectedGasto = gastosPredefinidos.find(g => g.descricao === desc);
                    setForm(prev => ({
                      ...prev,
                      descricao: desc,
                      categoriaId: (selectedGasto && selectedGasto.categoriaId) ? selectedGasto.categoriaId : prev.categoriaId
                    }));
                  }}
                 >
                   <option value="">Selecione...</option>
                   {gastosPredefinidos.map(g => (
                     <option key={g.id} value={g.descricao}>{g.descricao}</option>
                   ))}
                 </select>
               ) : (
                 <input
                   required
                   value={form.descricao}
                   onChange={e => setForm({...form, descricao: e.target.value})}
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
               Valor
               <input required type="number" step="0.01" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
             </label>
             <label className="field">
               Data da Compra
               <input required type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
             </label>
             <label className="field">
               Mês da Fatura
               <select value={form.mesReferencia} onChange={e => setForm({...form, mesReferencia: e.target.value})}>
                 {months.map(m => <option key={m} value={m}>{m}</option>)}
               </select>
             </label>
             <label className="field">
               Tipo
               <select value={form.tipoRecorrencia} onChange={e => setForm({...form, tipoRecorrencia: e.target.value})}>
                 <option value="EVENTUAL">Eventual</option>
                 <option value="FIXO">Fixo</option>
                 <option value="PARCELADO">Parcelado</option>
               </select>
             </label>
             {form.tipoRecorrencia === "PARCELADO" && (
                <label className="field">
                  Nº Parcelas
                  <input type="number" min="2" value={form.qtdParcelas} onChange={e => setForm({...form, qtdParcelas: e.target.value})} />
                </label>
             )}
             {form.tipoRecorrencia === "FIXO" && (
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
             <label className="field">
               Categoria
               <select value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})}>
                 <option value="">Sem categoria</option>
                 {categorias.filter(c => c.tipo === "DESPESA").map(c => (
                   <option key={c.id} value={c.id}>{c.nome}</option>
                 ))}
               </select>
             </label>
             <div className="modal-actions">
               <button type="button" className="ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
               <button type="submit" className="primary">Salvar</button>
             </div>
          </form>
       </Modal>

       <Modal open={limiteModalOpen} title={`Limite de ${selectedMes}`} onClose={() => setLimiteModalOpen(false)}>
          <form className="modal-grid" onSubmit={handleUpdateLimite}>
             <p style={{ gridColumn: '1 / -1', marginBottom: '1rem', color: '#64748b' }}>
                Defina o limite do cartão especificamente para o mês de <strong>{selectedMes}</strong>.
                Isso não afetará o limite padrão dos outros meses.
             </p>
             <label className="field">
                Valor do Limite
                <input 
                   type="number" 
                   step="0.01" 
                   required 
                   value={limiteEditValue} 
                   onChange={e => setLimiteEditValue(e.target.value)} 
                   autoFocus
                />
             </label>
             <div className="modal-actions">
                <button type="button" className="ghost" onClick={() => setLimiteModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary">Salvar Limite</button>
             </div>
          </form>
       </Modal>

       <Modal open={alertModalOpen} title="Atenção" onClose={() => setAlertModalOpen(false)} size="small">
         <div className="modal-grid">
           <p>{alertMessage}</p>
           <div className="modal-actions">
              <button type="button" className="primary" onClick={() => setAlertModalOpen(false)}>OK</button>
           </div>
         </div>
       </Modal>
 
       <Modal open={confirmModalOpen} title="Confirmação" onClose={() => setConfirmModalOpen(false)} size="small">
         <div className="modal-grid">
           <p>{confirmMessage}</p>
           <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setConfirmModalOpen(false)}>Cancelar</button>
              <button type="button" className="danger" onClick={() => {
                 onConfirmAction();
                 setConfirmModalOpen(false);
              }}>Excluir</button>
           </div>
         </div>
       </Modal>
    </div>
  );
};

const RelatoriosPage = ({
  orcamentos,
  receitas,
  despesas,
  cartoes,
  lancamentosCartao,
  categorias
}) => {
  const initialOrcamentoId = orcamentos[0]?.id ?? "";
  const [filters, setFilters] = useState({
    orcamentoId: initialOrcamentoId,
    mesInicio: "",
    mesFim: "",
    visao: "Acumulada"
  });

  const effectiveOrcamentoId = filters.orcamentoId || initialOrcamentoId;
  const currentOrcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
  const mesesOrcamento = MONTHS_ORDER.filter((mes) => currentOrcamento?.meses?.includes(mes));
  const defaultMes = useMemo(() => {
    if (mesesOrcamento.length === 0) return "";
    const currentMonth = getCurrentMonthName();
    return mesesOrcamento.includes(currentMonth) ? currentMonth : mesesOrcamento[0];
  }, [mesesOrcamento]);
  const mesInicio = filters.mesInicio && mesesOrcamento.includes(filters.mesInicio) ? filters.mesInicio : defaultMes;
  const mesFim = filters.mesFim && mesesOrcamento.includes(filters.mesFim) ? filters.mesFim : mesInicio;

  const mesesIntervalo = useMemo(() => {
    if (!mesInicio) return [];
    const startIndex = mesesOrcamento.indexOf(mesInicio);
    const endIndex = mesesOrcamento.indexOf(mesFim);
    if (startIndex === -1 || endIndex === -1) return mesInicio ? [mesInicio] : [];
    const from = Math.min(startIndex, endIndex);
    const to = Math.max(startIndex, endIndex);
    return mesesOrcamento.slice(from, to + 1);
  }, [mesInicio, mesFim, mesesOrcamento]);

  const mesesSelecionados = useMemo(() => {
    return filters.visao === "Mensal"
      ? (mesInicio ? [mesInicio] : [])
      : mesesIntervalo;
  }, [filters.visao, mesInicio, mesesIntervalo]);

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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pago:</span>
              <strong>{formatCurrency(resumoConsolidado.despPago)}</strong>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-title">Saldo</span>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Previsto:</span>
              <strong>{formatCurrency(saldoPrevisto)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Em conta:</span>
              <strong>{formatCurrency(saldoEmConta)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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

const ConfiguracoesPage = ({
  categorias,
  setCategorias,
  gastosPredefinidos,
  setGastosPredefinidos,
  tiposReceita,
  setTiposReceita,
  orcamentos,
  setOrcamentos,
  cartoes,
  setCartoes,
  despesas,
  receitas,
  lancamentosCartao
}) => {
  const [allMonths] = useState([
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]);

  const categoriasMap = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.nome])),
    [categorias]
  );
  const despesasCategorias = categorias.filter((categoria) => categoria.tipo === "DESPESA");

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertModalOpen(true);
  };

  const showConfirm = (message, action) => {
    setConfirmMessage(message);
    setOnConfirmAction(() => action);
    setConfirmModalOpen(true);
  };

  const handleDeleteOrcamento = (id) => {
    const orcamento = orcamentos.find(o => o.id === id);
    if (!orcamento) return;

    const mesesOrcamento = orcamento.meses || [];
    
    const hasLinkedDespesas = despesas.some(d => d.orcamentoId === id);
    const hasLinkedReceitas = receitas.some(r => r.orcamentoId === id);
    const hasLinkedCartao = lancamentosCartao.some(l => {
       if (mesesOrcamento.includes(l.mesReferencia)) return true;
       if (l.meses && l.meses.some(m => mesesOrcamento.includes(m))) return true;
       return false;
    });

    if (hasLinkedDespesas || hasLinkedReceitas || hasLinkedCartao) {
      showAlert("Este período não pode ser excluído pois possui lançamentos vinculados (Despesas, Receitas ou Cartão de Crédito).");
      return;
    }
    showConfirm("Tem certeza que deseja excluir este período do orçamento?", () => {
      setOrcamentos(prev => prev.filter(o => o.id !== id));
    });
  };

  const handleDeleteCartao = (id) => {
    const isLinked = lancamentosCartao.some(l => l.cartaoId === id);
    if (isLinked) {
      showAlert("Este cartão não pode ser excluído pois possui lançamentos vinculados.");
      return;
    }
    showConfirm("Tem certeza que deseja excluir este cartão de crédito?", () => {
      setCartoes(prev => prev.filter(c => c.id !== id));
    });
  };

  const handleDeleteCategoria = (id) => {
    const isLinked = despesas.some(d => d.categoriaId === id) || 
                     receitas.some(r => r.categoriaId === id) || 
                     lancamentosCartao.some(l => l.categoriaId === id);
    
    if (isLinked) {
      showAlert("Esta categoria não pode ser excluída pois possui lançamentos vinculados (Despesas, Receitas ou Cartão).");
      return;
    }
    showConfirm("Tem certeza que deseja excluir esta categoria?", () => {
      setCategorias(prev => prev.filter(c => c.id !== id));
    });
  };

  const handleDeleteGastoPredefinido = (id) => {
    showConfirm("Tem certeza que deseja excluir este gasto pré-definido?", () => {
      setGastosPredefinidos(prev => prev.filter(g => g.id !== id));
    });
  };

  const handleDeleteTipoReceita = (id) => {
    showConfirm("Tem certeza que deseja excluir esta receita pré-definida?", () => {
      setTiposReceita(prev => prev.filter(t => t.id !== id));
    });
  };

  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);
  const [gastoModalOpen, setGastoModalOpen] = useState(false);
  const [tipoModalOpen, setTipoModalOpen] = useState(false);
  const [orcamentoModalOpen, setOrcamentoModalOpen] = useState(false);
  const [cartaoModalOpen, setCartaoModalOpen] = useState(false);

  const [categoriaEditId, setCategoriaEditId] = useState(null);
  const [gastoEditId, setGastoEditId] = useState(null);
  const [tipoEditId, setTipoEditId] = useState(null);
  const [orcamentoEditId, setOrcamentoEditId] = useState(null);
  const [cartaoEditId, setCartaoEditId] = useState(null);

  const [categoriaForm, setCategoriaForm] = useState({ nome: "", tipo: "DESPESA" });
  const [gastoForm, setGastoForm] = useState({
    descricao: "",
    categoriaId: despesasCategorias[0]?.id ?? ""
  });
  const [tipoForm, setTipoForm] = useState({ descricao: "", recorrente: "false" });
  const [orcamentoForm, setOrcamentoForm] = useState({ label: "", meses: [] });
  const [cartaoForm, setCartaoForm] = useState({ nome: "", limite: "" });

  const abrirCategoriaModal = () => {
    setCategoriaEditId(null);
    setCategoriaForm({ nome: "", tipo: "DESPESA" });
    setCategoriaModalOpen(true);
  };

  const abrirGastoModal = () => {
    setGastoEditId(null);
    setGastoForm({ descricao: "", categoriaId: despesasCategorias[0]?.id ?? "" });
    setGastoModalOpen(true);
  };

  const abrirTipoModal = () => {
    setTipoEditId(null);
    setTipoForm({ descricao: "", recorrente: "false" });
    setTipoModalOpen(true);
  };

  const abrirOrcamentoModal = () => {
    setOrcamentoEditId(null);
    setOrcamentoForm({ label: "", meses: [] });
    setOrcamentoModalOpen(true);
  };

  const abrirCartaoModal = () => {
    setCartaoEditId(null);
    setCartaoForm({ nome: "", limite: "" });
    setCartaoModalOpen(true);
  };

  const editarCategoria = (categoria) => {
    setCategoriaEditId(categoria.id);
    setCategoriaForm({ nome: categoria.nome, tipo: categoria.tipo });
    setCategoriaModalOpen(true);
  };

  const editarGasto = (gasto) => {
    setGastoEditId(gasto.id);
    setGastoForm({ descricao: gasto.descricao, categoriaId: gasto.categoriaId });
    setGastoModalOpen(true);
  };

  const editarTipo = (tipo) => {
    setTipoEditId(tipo.id);
    setTipoForm({ descricao: tipo.descricao, recorrente: tipo.recorrente ? "true" : "false" });
    setTipoModalOpen(true);
  };

  const editarOrcamento = (orcamento) => {
    setOrcamentoEditId(orcamento.id);
    setOrcamentoForm({ label: orcamento.label, meses: orcamento.meses || [] });
    setOrcamentoModalOpen(true);
  };

  const editarCartao = (cartao) => {
    setCartaoEditId(cartao.id);
    setCartaoForm({ nome: cartao.nome, limite: cartao.limite || "" });
    setCartaoModalOpen(true);
  };

  const toggleMesForm = (mesNome) => {
    setOrcamentoForm((prev) => {
      const isSelected = prev.meses.includes(mesNome);
      const newSelection = isSelected
        ? prev.meses.filter((m) => m !== mesNome)
        : [...prev.meses, mesNome];
      return { ...prev, meses: allMonths.filter((m) => newSelection.includes(m)) };
    });
  };

  const handleSubmitCategoria = (event) => {
    event.preventDefault();
    const nome = categoriaForm.nome.trim();
    if (!nome) return;
    const nextCategorias = categoriaEditId
      ? categorias.map((categoria) =>
          categoria.id === categoriaEditId
            ? { ...categoria, nome, tipo: categoriaForm.tipo }
            : categoria
        )
      : [
          ...categorias,
          {
            id: createId("cat"),
            nome,
            tipo: categoriaForm.tipo
          }
        ];
    setCategorias(nextCategorias);
    window.localStorage.setItem("hf_categorias", JSON.stringify(nextCategorias));
    setCategoriaEditId(null);
    setCategoriaForm({ nome: "", tipo: "DESPESA" });
    setCategoriaModalOpen(false);
  };

  const handleSubmitGasto = (event) => {
    event.preventDefault();
    const descricao = gastoForm.descricao.trim();
    if (!descricao || !gastoForm.categoriaId) return;
    const nextGastos = gastoEditId
      ? gastosPredefinidos.map((gasto) =>
          gasto.id === gastoEditId
            ? { ...gasto, descricao, categoriaId: gasto.categoriaId }
            : gasto
        )
      : [
          ...gastosPredefinidos,
          {
            id: createId("gasto"),
            descricao,
            categoriaId: gastoForm.categoriaId
          }
        ];
    setGastosPredefinidos(nextGastos);
    window.localStorage.setItem("hf_gastos_predefinidos", JSON.stringify(nextGastos));
    setGastoEditId(null);
    setGastoForm({ descricao: "", categoriaId: despesasCategorias[0]?.id ?? "" });
    setGastoModalOpen(false);
  };

  const handleSubmitTipo = (event) => {
    event.preventDefault();
    const descricao = tipoForm.descricao.trim();
    if (!descricao) return;
    const nextTipos = tipoEditId
      ? tiposReceita.map((tipo) =>
          tipo.id === tipoEditId
            ? { ...tipo, descricao, recorrente: tipoForm.recorrente ? "true" : "false" }
            : tipo
        )
      : [
          ...tiposReceita,
          {
            id: createId("tipo"),
            descricao,
            recorrente: tipoForm.recorrente === "true" ? "true" : "false"
          }
        ];
    setTiposReceita(nextTipos);
    window.localStorage.setItem("hf_tipos_receita", JSON.stringify(nextTipos));
    setTipoEditId(null);
    setTipoForm({ descricao: "", recorrente: "false" });
    setTipoModalOpen(false);
  };

  const handleSubmitOrcamento = (event) => {
    event.preventDefault();
    const nome = orcamentoForm.label.trim();
    if (!nome) return;
    const nextOrcamentos = orcamentoEditId
      ? orcamentos.map((o) =>
          o.id === orcamentoEditId
            ? { ...o, label: nome, meses: orcamentoForm.meses }
            : o
        )
      : [
          ...orcamentos,
          {
            id: createId("orc"),
            label: nome,
            meses: allMonths.filter((m) => orcamentoForm.meses.includes(m) ? [m] : [])
          }
      ];
    setOrcamentos(nextOrcamentos);
    window.localStorage.setItem("hf_orcamentos", JSON.stringify(nextOrcamentos));
    setOrcamentoEditId(null);
    setOrcamentoForm({ label: "", meses: [] });
    setOrcamentoModalOpen(false);
  };

  const handleSubmitCartao = (event) => {
    event.preventDefault();
    const nome = cartaoForm.nome.trim();
    if (!nome) return;
    const limite = parseFloat(cartaoForm.limite) || 0;
    const nextCartoes = cartaoEditId
      ? cartoes.map((c) =>
          c.id === cartaoEditId
            ? { ...c, nome, limite }
            : c
        )
      : [
          ...cartoes,
          {
            id: createId("card"),
            nome,
            limite
          }
        ];
    setCartoes(nextCartoes);
    window.localStorage.setItem("hf_cartoes", JSON.stringify(nextCartoes));
    setCartaoEditId(null);
    setCartaoForm({ nome: "", limite: "" });
    setCartaoModalOpen(false);
  };

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Períodos do Orçamento</h2>
            <p>Cadastre os anos ou períodos fiscais e defina os meses.</p>
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={abrirOrcamentoModal} title="Cadastrar orçamento por período">
              + Novo período
            </button>
          </div>
        </div>
        <div className="table list-table-wrapper">
          <table className="list-table list-table--config-periodos" aria-label="Períodos do orçamento">
            <colgroup>
              <col className="list-table__col list-table__col--periodo" />
              <col className="list-table__col list-table__col--meses" />
              <col className="list-table__col list-table__col--acoes" />
            </colgroup>
            <thead className="list-table__head">
              <tr>
                <th scope="col">Identificação</th>
                <th scope="col">Meses</th>
                <th scope="col" className="list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={3}>Nenhum período cadastrado.</td>
                </tr>
              ) : (
                orcamentos.map((orcamento) => (
                  <tr className="list-table__row" key={orcamento.id}>
                    <td>{orcamento.label}</td>
                    <td style={{ fontSize: "0.85em", color: "#666" }}>
                      {(orcamento.meses || []).join(", ") || "Nenhum mês selecionado"}
                    </td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button type="button" className="icon-button info" onClick={() => editarOrcamento(orcamento)} title="Editar">
                          <IconEdit />
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => handleDeleteOrcamento(orcamento.id)} title="Excluir">
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Cartões de Crédito</h2>
            <p>Cadastre seus cartões para controle de faturas.</p>
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={abrirCartaoModal}>
              + Novo cartão
            </button>
          </div>
        </div>
        <div className="table list-table-wrapper">
          <table className="list-table list-table--config-cartoes" aria-label="Cartões de crédito">
            <colgroup>
              <col className="list-table__col list-table__col--nome" />
              <col className="list-table__col list-table__col--acoes" />
            </colgroup>
            <thead className="list-table__head">
              <tr>
                <th scope="col">Nome</th>
                <th scope="col" className="list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cartoes.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={2}>Nenhum cartão cadastrado.</td>
                </tr>
              ) : (
                cartoes.map((cartao) => (
                  <tr className="list-table__row" key={cartao.id}>
                    <td>{cartao.nome}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button type="button" className="icon-button info" onClick={() => editarCartao(cartao)} title="Editar">
                          <IconEdit />
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => handleDeleteCartao(cartao.id)} title="Excluir">
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Categorias</h2>
            <p>Cadastre e organize as categorias de receita e despesa.</p>
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={abrirCategoriaModal}>
              + Nova categoria
            </button>
          </div>
        </div>
        <div className="table list-table-wrapper">
          <table className="list-table list-table--config-categorias" aria-label="Categorias">
            <colgroup>
              <col className="list-table__col list-table__col--desc" />
              <col className="list-table__col list-table__col--tipo" />
              <col className="list-table__col list-table__col--acoes" />
            </colgroup>
            <thead className="list-table__head">
              <tr>
                <th scope="col">Categoria</th>
                <th scope="col">Tipo</th>
                <th scope="col" className="list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={3}>Nenhuma categoria cadastrada.</td>
                </tr>
              ) : (
                categorias.map((categoria) => (
                  <tr className="list-table__row" key={categoria.id}>
                    <td>{categoria.nome}</td>
                    <td>{categoria.tipo}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button type="button" className="icon-button info" onClick={() => editarCategoria(categoria)} title="Editar">
                          <IconEdit />
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => handleDeleteCategoria(categoria.id)} title="Excluir">
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Gastos Pré-definidos</h2>
            <p>Modelos rápidos para despesas recorrentes.</p>
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={abrirGastoModal} title="Cadastrar modelo de despesa">
              + Novo gasto
            </button>
          </div>
        </div>
        <div className="table list-table-wrapper">
          <table className="list-table list-table--config-gastos" aria-label="Gastos pré-definidos">
            <colgroup>
              <col className="list-table__col list-table__col--desc" />
              <col className="list-table__col list-table__col--cat" />
              <col className="list-table__col list-table__col--acoes" />
            </colgroup>
            <thead className="list-table__head">
              <tr>
                <th scope="col">Descrição</th>
                <th scope="col">Categoria</th>
                <th scope="col" className="list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {gastosPredefinidos.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={3}>Nenhum gasto pré-definido cadastrado.</td>
                </tr>
              ) : (
                gastosPredefinidos.map((gasto) => (
                  <tr className="list-table__row" key={gasto.id}>
                    <td>{gasto.descricao}</td>
                    <td>{categoriasMap.get(gasto.categoriaId) || "—"}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button type="button" className="icon-button info" onClick={() => editarGasto(gasto)} title="Editar">
                          <IconEdit />
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => handleDeleteGastoPredefinido(gasto.id)} title="Excluir">
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Receitas Pré-definidas</h2>
            <p>Modelos rápidos para receitas recorrentes.</p>
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={abrirTipoModal} title="Cadastrar modelo de receita">
              + Nova receita
            </button>
          </div>
        </div>
        <div className="table list-table-wrapper">
          <table className="list-table list-table--config-receitas" aria-label="Receitas pré-definidas">
            <colgroup>
              <col className="list-table__col list-table__col--desc" />
              <col className="list-table__col list-table__col--recorrente" />
              <col className="list-table__col list-table__col--acoes" />
            </colgroup>
            <thead className="list-table__head">
              <tr>
                <th scope="col">Descrição</th>
                <th scope="col">Recorrente</th>
                <th scope="col" className="list-table__col list-table__col--acoes list-table__head-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tiposReceita.length === 0 ? (
                <tr className="list-table__row list-table__row--empty">
                  <td colSpan={3}>Nenhuma receita pré-definida cadastrada.</td>
                </tr>
              ) : (
                tiposReceita.map((tipo) => (
                  <tr className="list-table__row" key={tipo.id}>
                    <td>{tipo.descricao}</td>
                    <td>{tipo.recorrente ? "Sim" : "Não"}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button type="button" className="icon-button info" onClick={() => editarTipo(tipo)} title="Editar">
                          <IconEdit />
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => handleDeleteTipoReceita(tipo.id)} title="Excluir">
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

      <Modal
        open={orcamentoModalOpen}
        title={orcamentoEditId ? "Editar período" : "Novo período"}
        onClose={() => setOrcamentoModalOpen(false)}
      >
        <form
          className="modal-grid"
          onSubmit={handleSubmitOrcamento}
        >
          <label className="field">
            Identificação (Ex: 2024)
            <input
              type="text"
              required
              value={orcamentoForm.label}
              onChange={(event) =>
                setOrcamentoForm((prev) => ({ ...prev, label: event.target.value }))
              }
            />
          </label>
          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 500 }}>Meses do Período</span>
              <label className="select-all" style={{ fontSize: "0.9em", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={orcamentoForm.meses.length === allMonths.length && allMonths.length > 0}
                  onChange={() => {
                    const allSelected = orcamentoForm.meses.length === allMonths.length;
                    setOrcamentoForm((prev) => ({
                      ...prev,
                      meses: allSelected ? [] : [...allMonths]
                    }));
                  }}
                />
                Selecionar todos
              </label>
            </div>
            <div className="months-grid-mini">
              {allMonths.map((mes) => (
                <label key={mes} className="checkbox-card small">
                  <input
                    type="checkbox"
                    checked={orcamentoForm.meses.includes(mes)}
                    onChange={() => toggleMesForm(mes)}
                  />
                  <span>{mes}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setOrcamentoModalOpen(false)} title="Fechar sem salvar">
              Cancelar
            </button>
            <button type="submit" className="primary" title="Confirmar e salvar dados">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={cartaoModalOpen}
        title={cartaoEditId ? "Editar cartão" : "Novo cartão"}
        onClose={() => setCartaoModalOpen(false)}
      >
        <form
          className="modal-grid"
          onSubmit={handleSubmitCartao}
        >
          <label className="field">
            Nome do Cartão
            <input
              type="text"
              required
              value={cartaoForm.nome}
              onChange={(event) =>
                setCartaoForm((prev) => ({ ...prev, nome: event.target.value }))
              }
            />
          </label>
          <label className="field">
            Limite / Valor Alocado
            <input
              type="number"
              step="0.01"
              value={cartaoForm.limite}
              onChange={(event) =>
                setCartaoForm((prev) => ({ ...prev, limite: event.target.value }))
              }
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setCartaoModalOpen(false)} title="Fechar sem salvar">
              Cancelar
            </button>
            <button type="submit" className="primary" title="Confirmar e salvar dados">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={categoriaModalOpen}
        title={categoriaEditId ? "Editar categoria" : "Nova categoria"}
        onClose={() => setCategoriaModalOpen(false)}
      >
        <form
          className="modal-grid"
          onSubmit={handleSubmitCategoria}
        >
          <label className="field">
            Nome
            <input
              type="text"
              value={categoriaForm.nome}
              onChange={(event) =>
                setCategoriaForm((prev) => ({ ...prev, nome: event.target.value }))
              }
            />
          </label>
          <label className="field">
            Tipo
            <select
              value={categoriaForm.tipo}
              onChange={(event) =>
                setCategoriaForm((prev) => ({ ...prev, tipo: event.target.value }))
              }
            >
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setCategoriaModalOpen(false)} title="Fechar sem salvar">
              Cancelar
            </button>
            <button type="submit" className="primary" title="Confirmar e salvar dados">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={gastoModalOpen}
        title={gastoEditId ? "Editar gasto pré-definido" : "Novo gasto pré-definido"}
        onClose={() => setGastoModalOpen(false)}
      >
        <form
          className="modal-grid"
          onSubmit={handleSubmitGasto}
        >
          <label className="field">
            Descrição
            <input
              type="text"
              value={gastoForm.descricao}
              onChange={(event) =>
                setGastoForm((prev) => ({ ...prev, descricao: event.target.value }))
              }
            />
          </label>
          <label className="field">
            Categoria
            <select
              value={gastoForm.categoriaId}
              onChange={(event) =>
                setGastoForm((prev) => ({ ...prev, categoriaId: event.target.value }))
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
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setGastoModalOpen(false)} title="Fechar sem salvar">
              Cancelar
            </button>
            <button type="submit" className="primary" title="Confirmar e salvar dados">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={tipoModalOpen}
        title={tipoEditId ? "Editar receita pré-definida" : "Nova receita pré-definida"}
        onClose={() => setTipoModalOpen(false)}
      >
        <form
          className="modal-grid"
          onSubmit={handleSubmitTipo}
        >
          <label className="field">
            Descrição
            <input
              type="text"
              value={tipoForm.descricao}
              onChange={(event) =>
                setTipoForm((prev) => ({ ...prev, descricao: event.target.value }))
              }
            />
          </label>
          <label className="field">
            Recorrente
            <select
              value={tipoForm.recorrente}
              onChange={(event) =>
                setTipoForm((prev) => ({ ...prev, recorrente: event.target.value }))
              }
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setTipoModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={alertModalOpen}
        title="Atenção"
        onClose={() => setAlertModalOpen(false)}
        size="small"
      >
        <div className="modal-grid">
          <p>{alertMessage}</p>
          <div className="modal-actions">
            <button type="button" className="primary" onClick={() => setAlertModalOpen(false)}>
              Entendi
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmModalOpen}
        title="Confirmação"
        onClose={() => setConfirmModalOpen(false)}
      >
        <div className="modal-grid">
          <p>{confirmMessage}</p>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setConfirmModalOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                onConfirmAction();
                setConfirmModalOpen(false);
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const getHashPage = () => {
  const hash = window.location.hash.replace("#", "");
  return hash || "dashboard";
};

const loadFromStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const loadConfigFromApi = async () => {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) return null;
    const data = await response.json();
    return {
      categorias: Array.isArray(data?.categorias) ? data.categorias : [],
      gastosPredefinidos: Array.isArray(data?.gastosPredefinidos) ? data.gastosPredefinidos : [],
      tiposReceita: Array.isArray(data?.tiposReceita) ? data.tiposReceita : [],
      receitas: Array.isArray(data?.receitas) ? data.receitas : [],
      despesas: Array.isArray(data?.despesas) ? data.despesas : [],
      orcamentos: Array.isArray(data?.orcamentos) ? data.orcamentos : [],
      cartoes: Array.isArray(data?.cartoes) ? data.cartoes : [],
      lancamentosCartao: Array.isArray(data?.lancamentosCartao) ? data.lancamentosCartao : []
    };
  } catch {
    return null;
  }
};

const persistConfigToApi = async (payload) => {
  try {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    return;
  }
};

function App() {
  const [activeKey, setActiveKey] = useState(getHashPage());
  const [categorias, setCategorias] = useState(() => loadFromStorage("hf_categorias", []));
  const [gastosPredefinidos, setGastosPredefinidos] = useState(() =>
    loadFromStorage("hf_gastos_predefinidos", [])
  );
  const [tiposReceita, setTiposReceita] = useState(() =>
    loadFromStorage("hf_tipos_receita", [])
  );
  const [receitas, setReceitas] = useState(() => loadFromStorage("hf_receitas", []));
  const [despesas, setDespesas] = useState(() => loadFromStorage("hf_despesas", []));
  const [orcamentos, setOrcamentos] = useState(() => loadFromStorage("hf_orcamentos", []));
  const [cartoes, setCartoes] = useState(() => loadFromStorage("hf_cartoes", []));
  const [lancamentosCartao, setLancamentosCartao] = useState(() => loadFromStorage("hf_lancamentos_cartao", []));
  const [storageReady, setStorageReady] = useState(false);
  const hasPersistedOnce = useRef(false);

  const pages = [
    { key: "dashboard", label: "Dashboard" },
    { key: "receitas", label: "Receitas" },
    { key: "despesas", label: "Despesas" },
    { key: "cartao", label: "Cartão" },
    { key: "relatorios", label: "Relatórios" },
    { key: "configuracoes", label: "Configurações" }
  ];

  useEffect(() => {
    const onHashChange = () => setActiveKey(getHashPage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const remote = await loadConfigFromApi();
      if (!active) return;
      if (remote) {
        setCategorias(remote.categorias);
        setGastosPredefinidos(remote.gastosPredefinidos);
        setTiposReceita(remote.tiposReceita);
        setReceitas(remote.receitas);
        setDespesas(remote.despesas);
        setOrcamentos(remote.orcamentos);
        setCartoes(remote.cartoes);
        setLancamentosCartao(remote.lancamentosCartao);
      }
      setStorageReady(true);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("hf_categorias", JSON.stringify(categorias));
    window.localStorage.setItem("hf_gastos_predefinidos", JSON.stringify(gastosPredefinidos));
    window.localStorage.setItem("hf_tipos_receita", JSON.stringify(tiposReceita));
    window.localStorage.setItem("hf_receitas", JSON.stringify(receitas));
    window.localStorage.setItem("hf_despesas", JSON.stringify(despesas));
    window.localStorage.setItem("hf_orcamentos", JSON.stringify(orcamentos));
    window.localStorage.setItem("hf_cartoes", JSON.stringify(cartoes));
    window.localStorage.setItem("hf_lancamentos_cartao", JSON.stringify(lancamentosCartao));
    
    if (!hasPersistedOnce.current) {
      hasPersistedOnce.current = true;
      return;
    }
    persistConfigToApi({
      categorias,
      gastosPredefinidos,
      tiposReceita,
      receitas,
      despesas,
      orcamentos,
      cartoes,
      lancamentosCartao
    });
  }, [storageReady, categorias, gastosPredefinidos, tiposReceita, receitas, despesas, orcamentos, cartoes, lancamentosCartao]);

  const activePage = pages.find((p) => p.key === activeKey) || pages[0];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (window.location.hash.replace("#", "") !== activePage.key) {
      window.location.hash = activePage.key;
    }
  }, [activePage.key]);

  useEffect(() => {
    const updateZoom = () => {
      const zoom = window.devicePixelRatio || 1;
      document.documentElement.style.setProperty("--ui-zoom", zoom.toString());
    };
    updateZoom();
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleChange = (event) => {
      if (!event.matches) {
        setIsMobileMenuOpen(false);
      }
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`app ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <h1>HomeFinance</h1>
          <span>Orçamento Doméstico</span>
        </div>
        <nav className="nav" aria-label="Navegação principal">
          {pages.map((page) => (
            <a
              key={page.key}
              href={`#${page.key}`}
              className={`nav-item ${page.key === activePage.key ? "active" : ""}`}
              onClick={handleNavClick}
            >
              {page.label}
            </a>
          ))}
        </nav>
      </aside>
      {isMobileMenuOpen && <div className="mobile-backdrop" onClick={handleNavClick} />}
      <div className="main">
        <header className="header">
          <div className="header-left">
            <button
              type="button"
              className="menu-toggle"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              ☰
            </button>
            <h2>{activePage.label}</h2>
          </div>
        </header>
        <main className="content">
          {activeKey === "dashboard" && (
            <DashboardPage 
              receitas={receitas} 
              despesas={despesas} 
              orcamentos={orcamentos} 
            />
          )}
          {activeKey === "receitas" && (
            <ReceitasPage
              categorias={categorias}
              tiposReceita={tiposReceita}
              orcamentos={orcamentos}
              receitas={receitas}
              setReceitas={setReceitas}
            />
          )}
          {activeKey === "despesas" && (
            <DespesasPage
              categorias={categorias}
              gastosPredefinidos={gastosPredefinidos}
              orcamentos={orcamentos}
              despesas={despesas}
              setDespesas={setDespesas}
              cartoes={cartoes}
              lancamentosCartao={lancamentosCartao}
            />
          )}
          {activeKey === "cartao" && (
            <CartaoPage
              cartoes={cartoes}
              setCartoes={setCartoes}
              lancamentosCartao={lancamentosCartao}
              setLancamentosCartao={setLancamentosCartao}
              orcamentos={orcamentos}
              despesas={despesas}
              setDespesas={setDespesas}
              categorias={categorias}
              gastosPredefinidos={gastosPredefinidos}
            />
          )}
          {activeKey === "relatorios" && (
            <RelatoriosPage
              orcamentos={orcamentos}
              receitas={receitas}
              despesas={despesas}
              cartoes={cartoes}
              lancamentosCartao={lancamentosCartao}
              categorias={categorias}
            />
          )}
          {activeKey === "configuracoes" && (
            <ConfiguracoesPage
              categorias={categorias}
              setCategorias={setCategorias}
              gastosPredefinidos={gastosPredefinidos}
              setGastosPredefinidos={setGastosPredefinidos}
              tiposReceita={tiposReceita}
              setTiposReceita={setTiposReceita}
              orcamentos={orcamentos}
              setOrcamentos={setOrcamentos}
              cartoes={cartoes}
              setCartoes={setCartoes}
              despesas={despesas}
              receitas={receitas}
              lancamentosCartao={lancamentosCartao}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
