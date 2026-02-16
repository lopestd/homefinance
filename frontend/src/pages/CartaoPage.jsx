import { useCallback, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { NumericFormat } from "react-number-format";
import "react-datepicker/dist/react-datepicker.css";
import { AlertDialog, ConfirmDialog } from "../components/Dialogs";
import { IconEdit, IconTrash } from "../components/Icons";
import Modal from "../components/Modal";
import { createCategoria } from "../services/configApi";
import { createId, formatCurrency, getCurrentMonthName } from "../utils/appUtils";

registerLocale("pt-BR", ptBR);

const normalizeCategoriaNome = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const MonthlySummaryCard = ({ summary, isCurrentMonth }) => {
  const {
    mes,
    limite,
    fixoParcelado,
    gastosEventuais,
    totalFatura,
    saldo,
    isFechada
  } = summary;

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
          <span className="label">Parcelado + Fixo:</span>
          <span className="value">{formatCurrency(fixoParcelado)}</span>
        </div>

        <div className="monthly-summary-card__row">
          <span className="label">Gastos:</span>
          <span className="value">{formatCurrency(gastosEventuais)}</span>
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
  setCategorias,
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

  const selectedCartao = useMemo(() => cartoes.find((c) => c.id === effectiveCartaoId) || {}, [cartoes, effectiveCartaoId]);

  const filteredLancamentos = useMemo(() => {
    if (!effectiveCartaoId) return [];
    return lancamentosCartao.filter((l) =>
      l.cartaoId === effectiveCartaoId &&
      (l.mesReferencia === selectedMes || (l.meses && l.meses.includes(selectedMes)))
    );
  }, [lancamentosCartao, effectiveCartaoId, selectedMes]);

  const { fixoParcelado, gastosMes, totalMes } = useMemo(() => {
    let fixo = 0;
    let gastos = 0;
    filteredLancamentos.forEach((l) => {
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

  const effectiveOrcamento = useMemo(() => {
    return orcamentos.find((o) => o.meses && o.meses.includes(selectedMes));
  }, [orcamentos, selectedMes]);

  const effectiveOrcamentoId = effectiveOrcamento?.id || orcamentos[0]?.id || "";

  const calculateMonthSummary = useCallback((cartaoId, mes) => {
    const cartao = cartoes.find((c) => c.id === cartaoId);
    if (!cartao) return null;

    const lancamentosDoMes = lancamentosCartao.filter((l) =>
      l.cartaoId === cartaoId &&
      (l.mesReferencia === mes || (l.meses && l.meses.includes(mes)))
    );

    let fixoParcelado = 0;
    let gastosEventuais = 0;

    lancamentosDoMes.forEach((l) => {
      const val = parseFloat(l.valor) || 0;
      if (l.tipoRecorrencia === "FIXO" || l.tipoRecorrencia === "PARCELADO") {
        fixoParcelado += val;
      } else {
        gastosEventuais += val;
      }
    });

    const limitesMensais = cartao.limitesMensais || {};
    const limite = limitesMensais[mes] !== undefined && limitesMensais[mes] !== null && limitesMensais[mes] !== ""
      ? parseFloat(limitesMensais[mes])
      : parseFloat(cartao.limite) || 0;

    const totalFatura = fixoParcelado + gastosEventuais;
    const saldo = limite - totalFatura;
    const isFechada = cartao.faturasFechadas?.includes(mes) || false;

    return {
      mes,
      limite,
      fixoParcelado,
      gastosEventuais,
      totalFatura,
      saldo,
      isFechada
    };
  }, [cartoes, lancamentosCartao]);

  const allMonthsSummary = useMemo(() => {
    if (!effectiveCartaoId || !effectiveOrcamentoId) return [];

    const orcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
    if (!orcamento || !orcamento.meses) return [];

    return orcamento.meses
      .map((mes) => calculateMonthSummary(effectiveCartaoId, mes))
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

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    descricao: "",
    complemento: "",
    valor: "",
    data: new Date().toLocaleDateString('en-CA'),
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

  const openModal = async (lancamento = null) => {
    if (isFaturaFechada) {
      showAlert("Fatura do mês está fechada.\nPara lançar ou editar itens, necessário reabrir a fatura.");
      return;
    }
    if (lancamento) {
      setEditId(lancamento.id);

      const matchPredef = gastosPredefinidos && gastosPredefinidos.some((g) => g.descricao === lancamento.descricao);
      setIsManualDescricao(!matchPredef);

      setForm({
        descricao: lancamento.descricao,
        complemento: lancamento.complemento || "",
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

      setForm({
        descricao: "",
        complemento: "",
        valor: "",
        data: new Date().toLocaleDateString('en-CA'),
        mesReferencia: selectedMes,
        categoriaId: "",
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
    const isClosing = !currentFechadas.includes(selectedMes);

    if (!isClosing) {
      newFechadas = currentFechadas.filter((m) => m !== selectedMes);
    } else {
      newFechadas = [...currentFechadas, selectedMes];
    }

    const updatedCartoes = cartoes.map((c) =>
      c.id === effectiveCartaoId ? { ...c, faturasFechadas: newFechadas } : c
    );
    setCartoes(updatedCartoes);

    syncDespesa(selectedMes, effectiveCartaoId, lancamentosCartao, updatedCartoes);

    if (isClosing) {
      const cartao = cartoes.find((c) => c.id === effectiveCartaoId);
      if (!cartao) return;
      const orcamento = orcamentos.find((o) => o.meses && o.meses.includes(selectedMes));
      if (!orcamento) return;
      const descricaoDespesa = `Fatura do cartão ${cartao.nome}`;
      const dataAtual = new Date().toLocaleDateString('en-CA');
      setDespesas((prev) => prev.map((d) => (
        d.descricao === descricaoDespesa && d.mes === selectedMes && d.orcamentoId === orcamento.id
          ? { ...d, data: dataAtual }
          : d
      )));
    }
  };

  const syncDespesa = (mes, cartaoId, currentLancamentos, cartoesList = cartoes) => {
    const cartao = cartoesList.find((c) => c.id === cartaoId);
    if (!cartao) return;

    const totalGastos = currentLancamentos
      .filter((l) => l.cartaoId === cartaoId && (l.mesReferencia === mes || (l.meses && l.meses.includes(mes))))
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
    if (!orcamento) return;

    const despesaDescricao = `Fatura do cartão ${cartao.nome}`;

    setDespesas((prev) => {
      const existingDespesa = prev.find((d) =>
        d.descricao === despesaDescricao &&
        d.mes === mes &&
        d.orcamentoId === orcamento.id
      );

      if (valorFinal > 0) {
        if (existingDespesa) {
          return prev.map((d) => d.id === existingDespesa.id ? { ...d, valor: valorFinal } : d);
        } else {
          return [...prev, {
            id: createId("desp-auto"),
            orcamentoId: orcamento.id,
            mes: mes,
            data: new Date().toLocaleDateString('en-CA'),
            categoriaId: catId,
            descricao: despesaDescricao,
            valor: valorFinal,
            status: "Pendente",
            categoria: catNome
          }];
        }
      } else {
        if (existingDespesa) {
          return prev.filter((d) => d.id !== existingDespesa.id);
        }
        return prev;
      }
    });
  };

  const handleUpdateLimite = (e) => {
    e.preventDefault();
    const novoLimite = parseFloat(limiteEditValue);
    if (isNaN(novoLimite) || novoLimite < 0) return;

    const updatedCartoes = cartoes.map((c) => {
      if (c.id === effectiveCartaoId) {
        const limites = c.limitesMensais || {};
        return { ...c, limitesMensais: { ...limites, [selectedMes]: novoLimite } };
      }
      return c;
    });

    setCartoes(updatedCartoes);
    setLimiteModalOpen(false);
    syncDespesa(selectedMes, effectiveCartaoId, lancamentosCartao, updatedCartoes);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!effectiveCartaoId) return;
    if (isFaturaFechada) {
      showAlert("Fatura do mês está fechada.\nPara lançar ou editar itens, necessário reabrir a fatura.");
      return;
    }

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

      for (let i = 0; i < qtd; i++) {
        newEntries.push({
          id: createId("lanc-card-parc"),
          cartaoId: effectiveCartaoId,
          descricao: `${form.descricao} (${i + 1}/${qtd})`,
          complemento: form.complemento || "",
          valor: parcValue,
          data: form.data,
          mesReferencia: getNextMonth(form.mesReferencia, i),
          categoriaId: form.categoriaId,
          tipoRecorrencia: "PARCELADO",
          parcela: i + 1,
          totalParcelas: qtd,
          meses: []
        });
      }
    } else {
      let lancamento = {
        id: editId || createId("lanc-card"),
        cartaoId: effectiveCartaoId,
        descricao: form.descricao,
        complemento: form.complemento || "",
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
      const original = lancamentosCartao.find((l) => l.id === editId);
      const novaVersao = newEntries[0];
      let preservedEntry = null;

      if (original && original.tipoRecorrencia === "FIXO" && original.meses && original.meses.length > 0) {
        const removedMonths = original.meses.filter((m) => !novaVersao.meses.includes(m));
        if (removedMonths.length > 0) {
          preservedEntry = {
            ...original,
            id: createId("lanc-card-preserved"),
            meses: removedMonths,
            mesReferencia: removedMonths.includes(original.mesReferencia) ? original.mesReferencia : removedMonths[0]
          };
        }
      }

      nextLancamentos = lancamentosCartao.map((l) => l.id === editId ? novaVersao : l);
      if (preservedEntry) {
        nextLancamentos.push(preservedEntry);
      }
    } else {
      nextLancamentos = [...lancamentosCartao, ...newEntries];
    }

    setLancamentosCartao(nextLancamentos);
    setModalOpen(false);

    let affectedMonths = new Set();
    newEntries.forEach((e) => {
      affectedMonths.add(e.mesReferencia);
      if (e.meses) e.meses.forEach((m) => affectedMonths.add(m));
    });

    if (editId) {
      const oldLancamento = lancamentosCartao.find((l) => l.id === editId);
      if (oldLancamento) {
        affectedMonths.add(oldLancamento.mesReferencia);
        if (oldLancamento.meses) oldLancamento.meses.forEach((m) => affectedMonths.add(m));
      }
    }

    Array.from(affectedMonths).forEach((m) => syncDespesa(m, effectiveCartaoId, nextLancamentos));
  };

  const handleDelete = (id) => {
    if (isFaturaFechada) {
      showAlert("Fatura do mês está fechada.\nPara lançar ou editar itens, necessário reabrir a fatura.");
      return;
    }
    showConfirm("Tem certeza que deseja excluir este lançamento?", () => {
      try {
        const lancamento = lancamentosCartao.find((l) => l.id === id);
        if (!lancamento) return;

        let nextLancamentos;
        if (lancamento.tipoRecorrencia === "FIXO" && selectedMes && lancamento.meses && lancamento.meses.includes(selectedMes)) {
          const newMeses = lancamento.meses.filter((m) => m !== selectedMes);

          if (newMeses.length === 0) {
            nextLancamentos = lancamentosCartao.filter((l) => l.id !== id);
          } else {
            nextLancamentos = lancamentosCartao.map((l) => {
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
          nextLancamentos = lancamentosCartao.filter((l) => l.id !== id);
        }

        setLancamentosCartao(nextLancamentos);

        const monthsToSync = new Set();
        monthsToSync.add(lancamento.mesReferencia);
        if (lancamento.meses) lancamento.meses.forEach((m) => monthsToSync.add(m));

        Array.from(monthsToSync).forEach((m) => syncDespesa(m, lancamento.cartaoId, nextLancamentos));
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
      </section>

      <section className="panel">
        <h3 className="panel-title">
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
                filteredLancamentos.map((l) => (
                  <tr className="list-table__row" key={l.id}>
                    <td>{new Date(l.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                    <td>{l.complemento ? `${l.descricao} - ${l.complemento}` : l.descricao}</td>
                    <td>{l.tipoRecorrencia === "FIXO" ? "Fixo" : l.tipoRecorrencia === "PARCELADO" ? "Parcelado" : "Eventual"}</td>
                    <td>{formatCurrency(l.valor)}</td>
                    <td className="list-table__cell list-table__cell--acoes">
                      <div className="actions">
                        <button className="icon-button info" onClick={() => openModal(l)} title="Editar"><IconEdit /></button>
                        <button className="icon-button delete" onClick={() => handleDelete(l.id)} title="Excluir"><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

          <div className="summary-card">
            <h4 className="summary-card-title">Fatura Atual</h4>
            <strong className="summary-card-value summary-card-value--negative">{formatCurrency(totalMes)}</strong>
            <div className="summary-card-subtext">
              Fixo: {formatCurrency(fixoParcelado)} | Var: {formatCurrency(gastosMes)}
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

      <Modal open={modalOpen} title={editId ? "Editar lançamento" : "Novo lançamento"} onClose={() => setModalOpen(false)}>
        <form className="modal-grid" onSubmit={handleSave}>
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
                {categorias.filter((c) => c.tipo === "DESPESA").map((c) => (
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
                selected={form.data ? new Date(form.data + "T00:00:00") : null}
                onChange={(date) => {
                  const formattedDate = date ? date.toISOString().split("T")[0] : "";
                  setForm({ ...form, data: formattedDate });
                }}
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                placeholderText="DD/MM/AAAA"
              />
            </label>
          </div>
          <div className="modal-grid-row">
            <label className="field">
              Tipo de gasto
              <select value={form.tipoRecorrencia} onChange={(e) => setForm({ ...form, tipoRecorrencia: e.target.value })}>
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
          {form.tipoRecorrencia === "PARCELADO" && (
            <label className="field">
              Nº Parcelas
              <input type="number" min="2" value={form.qtdParcelas} onChange={(e) => setForm({ ...form, qtdParcelas: e.target.value })} />
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
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="primary">Salvar</button>
          </div>
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
          <div className="modal-actions">
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
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          onConfirmAction();
          setConfirmModalOpen(false);
        }}
      />
    </div>
  );
};

export { CartaoPage };
