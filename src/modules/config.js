const { loadStore, saveStore, allocateId } = require("../storage/fileStore");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const normalize = (s) => (typeof s === "string" ? s.trim().toLowerCase() : s);

const isOrcamentoActive = (store, id_orcamento) => {
  const o = store.orcamentos.find((x) => x.id_orcamento === id_orcamento);
  return o ? Boolean(o.ativo) : false;
};

const getCategoriaById = (store, id_categoria) =>
  store.categorias.find((c) => c.id_categoria === id_categoria);

const getTipoReceitaById = (store, id_tipo_receita) =>
  store.tiposReceita.find((t) => t.id_tipo_receita === id_tipo_receita);

const getGastoPredefinidoById = (store, id_gasto_predefinido) =>
  store.gastosPredefinidos.find((g) => g.id_gasto_predefinido === id_gasto_predefinido);

const listarCategorias = async ({ tipo, ativo } = {}) => {
  const store = await loadStore();
  let result = store.categorias.slice();
  if (tipo) result = result.filter((c) => c.tipo === tipo);
  if (typeof ativo === "boolean") result = result.filter((c) => c.ativo === ativo);
  return result;
};

const obterCategoria = async ({ id_categoria }) => {
  const store = await loadStore();
  const categoria = getCategoriaById(store, id_categoria);
  assert(categoria, "Categoria inexistente");
  return categoria;
};

const criarCategoria = async ({ nome, tipo }) => {
  assert(nome, "Nome obrigatório");
  assert(tipo === "RECEITA" || tipo === "DESPESA", "Tipo obrigatório");
  const store = await loadStore();
  const n = normalize(nome);
  const exists = store.categorias.some(
    (c) => normalize(c.nome) === n && c.tipo === tipo
  );
  assert(!exists, "Nome único por tipo");
  const id_categoria = allocateId(store, "categoria");
  store.categorias.push({ id_categoria, nome: nome.trim(), tipo, ativo: true });
  await saveStore(store);
  return { id_categoria };
};

const atualizarCategoria = async ({ id_categoria, nome, ativo }) => {
  const store = await loadStore();
  const categoria = getCategoriaById(store, id_categoria);
  assert(categoria, "Categoria inexistente");
  if (typeof nome === "string" && normalize(nome) !== normalize(categoria.nome)) {
    const n = normalize(nome);
    const exists = store.categorias.some(
      (c) => c.id_categoria !== id_categoria && normalize(c.nome) === n && c.tipo === categoria.tipo
    );
    assert(!exists, "Nome único por tipo");
    categoria.nome = nome.trim();
  }
  if (typeof ativo === "boolean" && ativo !== categoria.ativo) {
    if (!ativo) {
      const usedReceitas = store.receitas.some(
        (r) => r.id_categoria === id_categoria && isOrcamentoActive(store, r.id_orcamento)
      );
      const usedDespesas = store.despesas.some(
        (d) => d.id_categoria === id_categoria && isOrcamentoActive(store, d.id_orcamento)
      );
      assert(!usedReceitas && !usedDespesas, "Categoria em uso para novos lançamentos");
    }
    categoria.ativo = ativo;
  }
  await saveStore(store);
  return { id_categoria };
};

const inativarCategoria = async ({ id_categoria }) => {
  return atualizarCategoria({ id_categoria, ativo: false });
};

const listarGastosPredefinidos = async ({ ativo } = {}) => {
  const store = await loadStore();
  let result = store.gastosPredefinidos.slice();
  if (typeof ativo === "boolean") result = result.filter((g) => g.ativo === ativo);
  return result;
};

const obterGastoPredefinido = async ({ id_gasto_predefinido }) => {
  const store = await loadStore();
  const gasto = getGastoPredefinidoById(store, id_gasto_predefinido);
  assert(gasto, "Gasto pré-definido inexistente");
  return gasto;
};

const criarGastoPredefinido = async ({ descricao, id_categoria }) => {
  assert(descricao, "Descrição obrigatória");
  const store = await loadStore();
  const categoria = getCategoriaById(store, id_categoria);
  assert(categoria, "Categoria inexistente");
  assert(categoria.ativo, "Categoria inativa");
  assert(categoria.tipo === "DESPESA", "Categoria deve ser DESPESA");
  const id_gasto_predefinido = allocateId(store, "gastoPredefinido");
  store.gastosPredefinidos.push({
    id_gasto_predefinido,
    descricao: descricao.trim(),
    id_categoria,
    ativo: true
  });
  await saveStore(store);
  return { id_gasto_predefinido };
};

const atualizarGastoPredefinido = async ({ id_gasto_predefinido, descricao, id_categoria, ativo }) => {
  const store = await loadStore();
  const gasto = getGastoPredefinidoById(store, id_gasto_predefinido);
  assert(gasto, "Gasto pré-definido inexistente");
  if (typeof descricao === "string" && descricao.trim() !== gasto.descricao) {
    gasto.descricao = descricao.trim();
  }
  if (typeof id_categoria === "number" && id_categoria !== gasto.id_categoria) {
    const categoria = getCategoriaById(store, id_categoria);
    assert(categoria, "Categoria inexistente");
    assert(categoria.ativo, "Categoria inativa");
    assert(categoria.tipo === "DESPESA", "Categoria deve ser DESPESA");
    gasto.id_categoria = id_categoria;
  }
  if (typeof ativo === "boolean") {
    gasto.ativo = ativo;
  }
  await saveStore(store);
  return { id_gasto_predefinido };
};

const inativarGastoPredefinido = async ({ id_gasto_predefinido }) => {
  return atualizarGastoPredefinido({ id_gasto_predefinido, ativo: false });
};

const listarTiposReceita = async ({ ativo } = {}) => {
  const store = await loadStore();
  let result = store.tiposReceita.slice();
  if (typeof ativo === "boolean") result = result.filter((t) => t.ativo === ativo);
  return result;
};

const obterTipoReceita = async ({ id_tipo_receita }) => {
  const store = await loadStore();
  const tipo = getTipoReceitaById(store, id_tipo_receita);
  assert(tipo, "Tipo de receita inexistente");
  return tipo;
};

const criarTipoReceita = async ({ descricao, recorrente }) => {
  assert(descricao, "Descrição obrigatória");
  const store = await loadStore();
  const n = normalize(descricao);
  const exists = store.tiposReceita.some((t) => normalize(t.descricao) === n);
  assert(!exists, "Descrição única");
  const id_tipo_receita = allocateId(store, "tipoReceita");
  store.tiposReceita.push({
    id_tipo_receita,
    descricao: descricao.trim(),
    recorrente: Boolean(recorrente),
    ativo: true
  });
  await saveStore(store);
  return { id_tipo_receita };
};

const atualizarTipoReceita = async ({ id_tipo_receita, descricao, recorrente, ativo }) => {
  const store = await loadStore();
  const tipo = getTipoReceitaById(store, id_tipo_receita);
  assert(tipo, "Tipo de receita inexistente");
  if (typeof descricao === "string" && normalize(descricao) !== normalize(tipo.descricao)) {
    const n = normalize(descricao);
    const exists = store.tiposReceita.some(
      (t) => t.id_tipo_receita !== id_tipo_receita && normalize(t.descricao) === n
    );
    assert(!exists, "Descrição única");
    tipo.descricao = descricao.trim();
  }
  if (typeof recorrente === "boolean") {
    tipo.recorrente = recorrente;
  }
  if (typeof ativo === "boolean" && ativo !== tipo.ativo) {
    if (!ativo) {
      const used = store.receitas.some(
        (r) => r.id_tipo_receita === id_tipo_receita && isOrcamentoActive(store, r.id_orcamento)
      );
      assert(!used, "Tipo de receita em uso em orçamento ativo");
    }
    tipo.ativo = ativo;
  }
  await saveStore(store);
  return { id_tipo_receita };
};

const inativarTipoReceita = async ({ id_tipo_receita }) => {
  return atualizarTipoReceita({ id_tipo_receita, ativo: false });
};

const createCategoria = async ({ nome, tipo }) => {
  const { id_categoria } = await criarCategoria({ nome, tipo });
  return { categoriaId: id_categoria };
};

const updateCategoria = async ({ categoriaId, nome, ativo }) => {
  await atualizarCategoria({ id_categoria: categoriaId, nome, ativo });
};

const listCategorias = async ({ tipo, somenteAtivas } = {}) => {
  const ativo = typeof somenteAtivas === "boolean" ? somenteAtivas : undefined;
  return listarCategorias({ tipo, ativo });
};

const createGastoPredefinido = async ({ descricao, categoriaId }) => {
  const { id_gasto_predefinido } = await criarGastoPredefinido({
    descricao,
    id_categoria: categoriaId
  });
  return { gastoPredefinidoId: id_gasto_predefinido };
};

const updateGastoPredefinido = async ({ gastoPredefinidoId, descricao, ativo }) => {
  await atualizarGastoPredefinido({
    id_gasto_predefinido: gastoPredefinidoId,
    descricao,
    ativo
  });
};

const listGastosPredefinidos = async ({ somenteAtivos } = {}) => {
  const ativo = typeof somenteAtivos === "boolean" ? somenteAtivos : undefined;
  return listarGastosPredefinidos({ ativo });
};

const createTipoReceita = async ({ descricao, recorrente }) => {
  const { id_tipo_receita } = await criarTipoReceita({ descricao, recorrente });
  return { tipoReceitaId: id_tipo_receita };
};

const listTiposReceita = async ({ somenteAtivos } = {}) => {
  const ativo = typeof somenteAtivos === "boolean" ? somenteAtivos : undefined;
  return listarTiposReceita({ ativo });
};

module.exports = {
  createCategoria,
  updateCategoria,
  listCategorias,
  createGastoPredefinido,
  updateGastoPredefinido,
  listGastosPredefinidos,
  createTipoReceita,
  listTiposReceita,
  listarCategorias,
  obterCategoria,
  criarCategoria,
  atualizarCategoria,
  inativarCategoria,
  listarGastosPredefinidos,
  obterGastoPredefinido,
  criarGastoPredefinido,
  atualizarGastoPredefinido,
  inativarGastoPredefinido,
  listarTiposReceita,
  obterTipoReceita,
  criarTipoReceita,
  atualizarTipoReceita,
  inativarTipoReceita
};
