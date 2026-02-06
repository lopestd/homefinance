const { loadStore, saveStore, allocateId } = require("../storage/fileStore");

const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const isPositiveNumber = (v) => typeof v === "number" && v > 0;

const getCartaoById = (store, id_cartao) =>
  store.cartoes.find((c) => c.id_cartao === id_cartao);

const getOrcamentoMesById = (store, id_orcamento_mes) =>
  store.orcamentoMeses.find((m) => m.id_orcamento_mes === id_orcamento_mes);

const getOrcamentoMesByAnoMes = (store, id_orcamento, mes) =>
  store.orcamentoMeses.find(
    (m) => m.id_orcamento === id_orcamento && m.mes === mes
  );

const getCategoriaById = (store, id_categoria) =>
  store.categorias.find((c) => c.id_categoria === id_categoria);

const getOrCreateCartaoMes = (store, id_cartao, id_orcamento_mes) => {
  let cartaoMes = store.cartaoMeses.find(
    (cm) => cm.id_cartao === id_cartao && cm.id_orcamento_mes === id_orcamento_mes
  );
  if (!cartaoMes) {
    const id_cartao_mes = allocateId(store, "cartaoMes");
    cartaoMes = { id_cartao_mes, id_cartao, id_orcamento_mes };
    store.cartaoMeses.push(cartaoMes);
  }
  return cartaoMes;
};

const criarCartao = async ({ descricao }) => {
  assert(descricao, "Descrição obrigatória");
  const store = await loadStore();
  const id_cartao = allocateId(store, "cartao");
  store.cartoes.push({ id_cartao, descricao: descricao.trim(), ativo: true });
  await saveStore(store);
  return { id_cartao };
};

const createCartao = async ({ descricao }) => {
  const { id_cartao } = await criarCartao({ descricao });
  return { cartaoId: id_cartao };
};

const criarLancamentoMensal = async ({
  id_cartao,
  id_orcamento_mes,
  descricao,
  valor,
  tipo
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  assert(["PARCELADO", "RECORRENTE", "CORRENTE"].includes(tipo), "Tipo inválido");
  const store = await loadStore();
  const cartao = getCartaoById(store, id_cartao);
  assert(cartao && cartao.ativo, "Cartão inexistente ou inativo");
  const orcamentoMes = getOrcamentoMesById(store, id_orcamento_mes);
  assert(orcamentoMes, "Mês inexistente");
  const cartaoMes = getOrCreateCartaoMes(store, id_cartao, id_orcamento_mes);
  const id_cartao_lancamento = allocateId(store, "cartaoLancamento");
  store.cartaoLancamentos.push({
    id_cartao_lancamento,
    id_cartao_mes: cartaoMes.id_cartao_mes,
    descricao: descricao.trim(),
    valor,
    tipo,
    paga: false
  });
  await saveStore(store);
  return { id_cartao_lancamento };
};

const createLancamentoCartao = async ({
  cartaoId,
  orcamentoId,
  mes,
  descricao,
  valor,
  tipo
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  assert(["PARCELADO", "RECORRENTE", "CORRENTE"].includes(tipo), "Tipo inválido");
  assert(Number.isInteger(mes), "Mês inválido");
  assert(mes >= 1 && mes <= 12, "Mês fora de faixa");
  const store = await loadStore();
  const cartao = getCartaoById(store, cartaoId);
  assert(cartao && cartao.ativo, "Cartão inexistente ou inativo");
  const orcamentoMes = getOrcamentoMesByAnoMes(store, orcamentoId, mes);
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const cartaoMes = getOrCreateCartaoMes(store, cartaoId, orcamentoMes.id_orcamento_mes);
  const id_cartao_lancamento = allocateId(store, "cartaoLancamento");
  store.cartaoLancamentos.push({
    id_cartao_lancamento,
    id_cartao_mes: cartaoMes.id_cartao_mes,
    descricao: descricao.trim(),
    valor,
    tipo,
    paga: false
  });
  await saveStore(store);
  return { lancamentoId: id_cartao_lancamento };
};

const listarLancamentosMensais = async ({ id_cartao, id_orcamento_mes }) => {
  const store = await loadStore();
  const cartaoMes = store.cartaoMeses.find(
    (cm) => cm.id_cartao === id_cartao && cm.id_orcamento_mes === id_orcamento_mes
  );
  if (!cartaoMes) return [];
  return store.cartaoLancamentos.filter(
    (l) => l.id_cartao_mes === cartaoMes.id_cartao_mes
  );
};

const listFaturaMes = async ({ cartaoId, orcamentoId, mes }) => {
  assert(Number.isInteger(mes), "Mês inválido");
  assert(mes >= 1 && mes <= 12, "Mês fora de faixa");
  const store = await loadStore();
  const cartao = getCartaoById(store, cartaoId);
  assert(cartao && cartao.ativo, "Cartão inexistente ou inativo");
  const orcamentoMes = getOrcamentoMesByAnoMes(store, orcamentoId, mes);
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const cartaoMes = store.cartaoMeses.find(
    (cm) => cm.id_cartao === cartaoId && cm.id_orcamento_mes === orcamentoMes.id_orcamento_mes
  );
  if (!cartaoMes) {
    return { lancamentos: [], totalFatura: 0 };
  }
  const lancamentos = store.cartaoLancamentos.filter(
    (l) => l.id_cartao_mes === cartaoMes.id_cartao_mes
  );
  const totalFatura = lancamentos.reduce((sum, l) => sum + l.valor, 0);
  return { lancamentos, totalFatura };
};

const consultarFaturaMensal = async ({
  id_cartao,
  id_orcamento_mes,
  id_categoria_bancos
}) => {
  const store = await loadStore();
  const cartao = getCartaoById(store, id_cartao);
  assert(cartao && cartao.ativo, "Cartão inexistente ou inativo");
  const orcamentoMes = getOrcamentoMesById(store, id_orcamento_mes);
  assert(orcamentoMes, "Mês inexistente");
  if (typeof id_categoria_bancos === "number") {
    const categoria = getCategoriaById(store, id_categoria_bancos);
    assert(categoria, "Categoria inexistente");
    assert(categoria.ativo, "Categoria inativa");
    assert(categoria.tipo === "DESPESA", "Categoria deve ser DESPESA");
  }
  const lancamentos = await listarLancamentosMensais({ id_cartao, id_orcamento_mes });
  const total = lancamentos.reduce((sum, l) => sum + l.valor, 0);
  return {
    lancamentos,
    total,
    id_categoria_bancos: typeof id_categoria_bancos === "number" ? id_categoria_bancos : null
  };
};

module.exports = {
  createCartao,
  createLancamentoCartao,
  listFaturaMes,
  criarCartao,
  criarLancamentoMensal,
  listarLancamentosMensais,
  consultarFaturaMensal
};
