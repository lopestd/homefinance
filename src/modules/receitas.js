const { loadStore, saveStore, allocateId } = require("../storage/fileStore");

const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const isPositiveNumber = (v) => typeof v === "number" && v > 0;

const validateMonths = (meses) => {
  assert(Array.isArray(meses), "Meses deve ser array");
  assert(meses.length > 0, "Lista de meses não vazia");
  assert(meses.length <= 12, "Máximo de 12 meses");
  const set = new Set();
  meses.forEach((mes) => {
    assert(Number.isInteger(mes), "Mês inválido");
    assert(mes >= 1 && mes <= 12, "Mês fora de faixa");
    assert(!set.has(mes), "Meses duplicados");
    set.add(mes);
  });
};

const getOrcamentoById = (store, id_orcamento) =>
  store.orcamentos.find((o) => o.id_orcamento === id_orcamento);

const getOrcamentoMesById = (store, id_orcamento_mes) =>
  store.orcamentoMeses.find((m) => m.id_orcamento_mes === id_orcamento_mes);

const getOrcamentoMesByAnoMes = (store, id_orcamento, mes) =>
  store.orcamentoMeses.find(
    (m) => m.id_orcamento === id_orcamento && m.mes === mes
  );

const getCategoriaById = (store, id_categoria) =>
  store.categorias.find((c) => c.id_categoria === id_categoria);

const ensureCategoriaReceitaAtiva = (categoria) => {
  assert(categoria, "Categoria inexistente");
  assert(categoria.ativo, "Categoria inativa");
  assert(categoria.tipo === "RECEITA", "Categoria deve ser RECEITA");
};

const ensureOrcamentoMesPertence = (store, id_orcamento, id_orcamento_mes) => {
  const orcamentoMes = getOrcamentoMesById(store, id_orcamento_mes);
  assert(orcamentoMes, "Mês inexistente");
  assert(orcamentoMes.id_orcamento === id_orcamento, "Mês não pertence ao orçamento");
  return orcamentoMes;
};

const criarReceitaManual = async ({
  id_orcamento,
  id_orcamento_mes,
  id_categoria,
  descricao,
  complemento,
  valor,
  recebida
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento inexistente");
  ensureOrcamentoMesPertence(store, id_orcamento, id_orcamento_mes);
  const categoria = getCategoriaById(store, id_categoria);
  ensureCategoriaReceitaAtiva(categoria);
  const id_receita = allocateId(store, "receita");
  store.receitas.push({
    id_receita,
    id_orcamento,
    id_orcamento_mes,
    id_categoria,
    id_tipo_receita: null,
    descricao,
    complemento: complemento || null,
    valor,
    recebida: Boolean(recebida)
  });
  await saveStore(store);
  return { id_receita };
};

const criarReceitaRecorrente = async ({
  id_orcamento,
  meses,
  id_categoria,
  descricao,
  complemento,
  valor
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  validateMonths(meses);
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento inexistente");
  const categoria = getCategoriaById(store, id_categoria);
  ensureCategoriaReceitaAtiva(categoria);
  const orcamentoMeses = store.orcamentoMeses.filter(
    (m) => m.id_orcamento === id_orcamento
  );
  const mapaMeses = new Map(orcamentoMeses.map((m) => [m.mes, m.id_orcamento_mes]));
  meses.forEach((mes) => {
    assert(mapaMeses.has(mes), "Mês não pertence ao orçamento");
  });
  const created = [];
  meses.forEach((mes) => {
    const id_orcamento_mes = mapaMeses.get(mes);
    const id_receita = allocateId(store, "receita");
    store.receitas.push({
      id_receita,
      id_orcamento,
      id_orcamento_mes,
      id_categoria,
      id_tipo_receita: null,
      descricao,
      complemento: complemento || null,
      valor,
      recebida: false
    });
    created.push(id_receita);
  });
  await saveStore(store);
  return { id_receitas: created };
};

const marcarRecebida = async ({ id_receita, recebida }) => {
  const store = await loadStore();
  const receita = store.receitas.find((r) => r.id_receita === id_receita);
  assert(receita, "Receita inexistente");
  receita.recebida = Boolean(recebida);
  await saveStore(store);
  return { id_receita };
};

const createReceita = async ({
  orcamentoId,
  mes,
  categoriaId,
  descricao,
  complemento,
  valor,
  recebida
}) => {
  assert(Number.isInteger(mes), "Mês inválido");
  assert(mes >= 1 && mes <= 12, "Mês fora de faixa");
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, orcamentoId);
  assert(orcamento, "Orçamento inexistente");
  const orcamentoMes = getOrcamentoMesByAnoMes(store, orcamentoId, mes);
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const categoria = getCategoriaById(store, categoriaId);
  ensureCategoriaReceitaAtiva(categoria);
  const id_receita = allocateId(store, "receita");
  store.receitas.push({
    id_receita,
    id_orcamento: orcamentoId,
    id_orcamento_mes: orcamentoMes.id_orcamento_mes,
    id_categoria: categoriaId,
    id_tipo_receita: null,
    descricao,
    complemento: complemento || null,
    valor,
    recebida: Boolean(recebida)
  });
  await saveStore(store);
  return { receitaId: id_receita };
};

const createReceitaRecorrente = async ({
  orcamentoId,
  meses,
  categoriaId,
  descricao,
  complemento,
  valor
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  validateMonths(meses);
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, orcamentoId);
  assert(orcamento, "Orçamento inexistente");
  const categoria = getCategoriaById(store, categoriaId);
  ensureCategoriaReceitaAtiva(categoria);
  const orcamentoMeses = store.orcamentoMeses.filter(
    (m) => m.id_orcamento === orcamentoId
  );
  const mapaMeses = new Map(orcamentoMeses.map((m) => [m.mes, m.id_orcamento_mes]));
  meses.forEach((mes) => {
    assert(mapaMeses.has(mes), "Mês não pertence ao orçamento");
  });
  const receitasCriadas = [];
  meses.forEach((mes) => {
    const id_orcamento_mes = mapaMeses.get(mes);
    const id_receita = allocateId(store, "receita");
    store.receitas.push({
      id_receita,
      id_orcamento: orcamentoId,
      id_orcamento_mes,
      id_categoria: categoriaId,
      id_tipo_receita: null,
      descricao,
      complemento: complemento || null,
      valor,
      recebida: false
    });
    receitasCriadas.push({ receitaId: id_receita });
  });
  await saveStore(store);
  return { receitasCriadas };
};

const setReceitaRecebida = async ({ receitaId, recebida }) => {
  const store = await loadStore();
  const receita = store.receitas.find((r) => r.id_receita === receitaId);
  assert(receita, "Receita inexistente");
  receita.recebida = Boolean(recebida);
  await saveStore(store);
};

const listReceitasPorMes = async ({ orcamentoId, mes }) => {
  assert(Number.isInteger(mes), "Mês inválido");
  assert(mes >= 1 && mes <= 12, "Mês fora de faixa");
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, orcamentoId);
  assert(orcamento, "Orçamento inexistente");
  const orcamentoMes = getOrcamentoMesByAnoMes(store, orcamentoId, mes);
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const receitas = store.receitas.filter(
    (r) => r.id_orcamento_mes === orcamentoMes.id_orcamento_mes
  );
  const totalLancado = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalRecebido = receitas.filter((r) => r.recebida).reduce((sum, r) => sum + r.valor, 0);
  return { receitas, totalLancado, totalRecebido };
};

module.exports = {
  createReceita,
  createReceitaRecorrente,
  setReceitaRecebida,
  listReceitasPorMes,
  criarReceitaManual,
  criarReceitaRecorrente,
  marcarRecebida
};
