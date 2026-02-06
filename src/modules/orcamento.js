const { loadStore, saveStore, allocateId } = require("../storage/fileStore");

const assert = (c, m) => {
  if (!c) throw new Error(m);
};

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

const criarOrcamento = async ({ ano, meses }) => {
  assert(Number.isInteger(ano), "Ano inválido");
  validateMonths(meses);
  const store = await loadStore();
  const mesSet = new Set(meses);
  const conflito = store.orcamentoMeses.some((om) => {
    const o = getOrcamentoById(store, om.id_orcamento);
    return o && o.ano === ano && mesSet.has(om.mes);
  });
  assert(!conflito, "Mês já utilizado no ano");
  const id_orcamento = allocateId(store, "orcamento");
  store.orcamentos.push({
    id_orcamento,
    ano,
    ativo: true,
    data_criacao: new Date().toISOString()
  });
  meses.forEach((mes) => {
    const id_orcamento_mes = allocateId(store, "orcamentoMes");
    store.orcamentoMeses.push({ id_orcamento_mes, id_orcamento, mes });
  });
  await saveStore(store);
  return { id_orcamento };
};

const obterOrcamento = async ({ id_orcamento }) => {
  const store = await loadStore();
  const o = getOrcamentoById(store, id_orcamento);
  assert(o, "Orçamento inexistente");
  const meses = store.orcamentoMeses
    .filter((m) => m.id_orcamento === id_orcamento)
    .map((m) => m.mes);
  return { ano: o.ano, meses };
};

const createOrcamento = async ({ ano, meses }) => {
  const { id_orcamento } = await criarOrcamento({ ano, meses });
  return { orcamentoId: id_orcamento };
};

const getOrcamento = async ({ orcamentoId }) => {
  return obterOrcamento({ id_orcamento: orcamentoId });
};

module.exports = {
  createOrcamento,
  getOrcamento,
  criarOrcamento,
  obterOrcamento
};
