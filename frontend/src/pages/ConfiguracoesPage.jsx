import { useMemo, useState } from "react";
import { AlertDialog, ConfirmDialog } from "../components/Dialogs";
import { IconEdit, IconTrash } from "../components/Icons";
import Modal from "../components/Modal";
import { createId } from "../utils/appUtils";
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
  createGastoPredefinido,
  updateGastoPredefinido,
  deleteGastoPredefinido,
  createTipoReceita,
  updateTipoReceita,
  deleteTipoReceita
} from "../services/configApi";

const normalizeCategoriaNome = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

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
  const [alertVariant, setAlertVariant] = useState("warning");
  const [alertTitle, setAlertTitle] = useState("Atenção");
  const [alertPrimaryLabel, setAlertPrimaryLabel] = useState("Entendi");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(() => () => {});
  const confirmTitle = "Confirmação";
  const confirmVariant = "danger";
  const confirmPrimaryLabel = "Excluir";
  const confirmSecondaryLabel = "Cancelar";

  const showAlert = (message, options = {}) => {
    setAlertMessage(message);
    setAlertVariant(options.variant || "warning");
    setAlertTitle(options.title || "Atenção");
    setAlertPrimaryLabel(options.primaryLabel || "Entendi");
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
    showConfirm("Tem certeza que deseja excluir esta categoria?", async () => {
      try {
        await deleteCategoria(id);
        setCategorias(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        showAlert(error?.message || "Falha ao excluir categoria.");
      }
    });
  };

  const handleDeleteGastoPredefinido = (id) => {
    showConfirm("Tem certeza que deseja excluir este gasto pré-definido?", async () => {
      try {
        await deleteGastoPredefinido(id);
        setGastosPredefinidos(prev => prev.filter(g => g.id !== id));
      } catch (error) {
        showAlert(error?.message || "Falha ao excluir gasto pré-definido.");
      }
    });
  };

  const handleDeleteTipoReceita = (id) => {
    showConfirm("Tem certeza que deseja excluir esta receita pré-definida?", async () => {
      try {
        await deleteTipoReceita(id);
        setTiposReceita(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        showAlert(error?.message || "Falha ao excluir receita pré-definida.");
      }
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

  const handleSubmitCategoria = async (event) => {
    event.preventDefault();
    const nome = categoriaForm.nome.trim();
    if (!nome) return;
    const normalizedNome = normalizeCategoriaNome(nome);
    const existing = categorias.find(
      (categoria) =>
        categoria.tipo === categoriaForm.tipo &&
        normalizeCategoriaNome(categoria.nome) === normalizedNome &&
        String(categoria.id) !== String(categoriaEditId)
    );
    if (existing) {
      showAlert("Já existe uma categoria com esse nome.");
      return;
    }
    try {
      if (categoriaEditId) {
        const updated = await updateCategoria(categoriaEditId, { nome, tipo: categoriaForm.tipo });
        setCategorias(prev =>
          prev.map((categoria) => (categoria.id === categoriaEditId ? updated : categoria))
        );
      } else {
        const created = await createCategoria({ nome, tipo: categoriaForm.tipo });
        setCategorias((prev) => {
          const alreadyExists = prev.some(
            (categoria) =>
              categoria.id === created.id ||
              (categoria.tipo === created.tipo &&
                normalizeCategoriaNome(categoria.nome) === normalizeCategoriaNome(created.nome))
          );
          if (alreadyExists) return prev;
          return [...prev, created];
        });
      }
      setCategoriaEditId(null);
      setCategoriaForm({ nome: "", tipo: "DESPESA" });
      setCategoriaModalOpen(false);
    } catch (error) {
      showAlert(error?.message || "Falha ao salvar categoria.");
    }
  };

  const handleSubmitGasto = async (event) => {
    event.preventDefault();
    const descricao = gastoForm.descricao.trim();
    if (!descricao || !gastoForm.categoriaId) return;
    try {
      if (gastoEditId) {
        const updated = await updateGastoPredefinido(gastoEditId, {
          descricao,
          categoriaId: gastoForm.categoriaId
        });
        setGastosPredefinidos(prev =>
          prev.map((gasto) => (gasto.id === gastoEditId ? updated : gasto))
        );
      } else {
        const created = await createGastoPredefinido({
          descricao,
          categoriaId: gastoForm.categoriaId
        });
        setGastosPredefinidos(prev => [...prev, created]);
      }
      setGastoEditId(null);
      setGastoForm({ descricao: "", categoriaId: despesasCategorias[0]?.id ?? "" });
      setGastoModalOpen(false);
    } catch (error) {
      showAlert(error?.message || "Falha ao salvar gasto pré-definido.");
    }
  };

  const handleSubmitTipo = async (event) => {
    event.preventDefault();
    const descricao = tipoForm.descricao.trim();
    if (!descricao) return;
    try {
      if (tipoEditId) {
        const updated = await updateTipoReceita(tipoEditId, {
          descricao,
          recorrente: tipoForm.recorrente === "true"
        });
        setTiposReceita(prev =>
          prev.map((tipo) => (tipo.id === tipoEditId ? updated : tipo))
        );
      } else {
        const created = await createTipoReceita({
          descricao,
          recorrente: tipoForm.recorrente === "true"
        });
        setTiposReceita(prev => [...prev, created]);
      }
      setTipoEditId(null);
      setTipoForm({ descricao: "", recorrente: "false" });
      setTipoModalOpen(false);
    } catch (error) {
      showAlert(error?.message || "Falha ao salvar receita pré-definida.");
    }
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
            meses: allMonths.filter((m) => orcamentoForm.meses.includes(m))
          }
      ];
    setOrcamentos(nextOrcamentos);
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

export { ConfiguracoesPage };
