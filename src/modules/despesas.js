const { loadStore, saveStore, allocateId } = require("../storage/fileStore");

const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const isPositiveNumber = (v) => typeof v === "number" && v > 0;

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

const getGastoPredefinidoById = (store, id_gasto_predefinido) =>
  store.gastosPredefinidos.find((g) => g.id_gasto_predefinido === id_gasto_predefinido);

const ensureCategoriaDespesaAtiva = (categoria) => {
  assert(categoria, "Categoria inexistente");
  assert(categoria.ativo, "Categoria inativa");
  assert(categoria.tipo === "DESPESA", "Categoria deve ser DESPESA");
};

const ensureOrcamentoMesPertence = (store, id_orcamento, id_orcamento_mes) => {
  const orcamentoMes = getOrcamentoMesById(store, id_orcamento_mes);
  assert(orcamentoMes, "Mês inexistente");
  assert(orcamentoMes.id_orcamento === id_orcamento, "Mês não pertence ao orçamento");
  return orcamentoMes;
};

const getMesesOrdenados = (store, id_orcamento) =>
  store.orcamentoMeses
    .filter((m) => m.id_orcamento === id_orcamento)
    .slice()
    .sort((a, b) => a.mes - b.mes);

const criarDespesas = (store, base, meses) => {
  const created = [];
  meses.forEach((mesData) => {
    const id_despesa = allocateId(store, "despesa");
    store.despesas.push({
      id_despesa,
      id_orcamento: base.id_orcamento,
      id_orcamento_mes: mesData.id_orcamento_mes,
      id_categoria: base.id_categoria,
      id_gasto_predefinido: base.id_gasto_predefinido || null,
      descricao: base.descricao,
      valor: base.valor,
      paga: false,
      tipo_recorrencia: base.tipo_recorrencia,
      qtd_parcelas: base.qtd_parcelas || null
    });
    created.push(id_despesa);
  });
  return created;
};

const criarDespesaManual = async ({
  id_orcamento,
  id_orcamento_mes,
  id_categoria,
  descricao,
  valor,
  tipo_recorrencia,
  qtd_parcelas
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  assert(["EVENTUAL", "FIXO", "PARCELADO"].includes(tipo_recorrencia), "Tipo inválido");
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento inexistente");
  const categoria = getCategoriaById(store, id_categoria);
  ensureCategoriaDespesaAtiva(categoria);
  const orcamentoMes = ensureOrcamentoMesPertence(store, id_orcamento, id_orcamento_mes);
  let meses = [orcamentoMes];
  if (tipo_recorrencia === "FIXO") {
    meses = getMesesOrdenados(store, id_orcamento);
  }
  if (tipo_recorrencia === "PARCELADO") {
    assert(Number.isInteger(qtd_parcelas) && qtd_parcelas > 0, "Parcelas inválidas");
    const ordenados = getMesesOrdenados(store, id_orcamento);
    const startIndex = ordenados.findIndex((m) => m.id_orcamento_mes === id_orcamento_mes);
    assert(startIndex >= 0, "Mês não pertence ao orçamento");
    const slice = ordenados.slice(startIndex, startIndex + qtd_parcelas);
    assert(slice.length === qtd_parcelas, "Parcelas ultrapassam o período");
    meses = slice;
  }
  const ids = criarDespesas(store, {
    id_orcamento,
    id_categoria,
    descricao,
    valor,
    tipo_recorrencia,
    qtd_parcelas
  }, meses);
  await saveStore(store);
  return { id_despesas: ids };
};

const criarDespesaManualPorMes = async ({
  orcamentoId,
  mesInicial,
  categoriaId,
  descricao,
  valor,
  tipoRecorrencia,
  qtdParcelas
}) => {
  assert(Number.isInteger(mesInicial), "Mês inválido");
  assert(mesInicial >= 1 && mesInicial <= 12, "Mês fora de faixa");
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  assert(
    ["EVENTUAL", "FIXO", "PARCELADO"].includes(tipoRecorrencia),
    "Tipo inválido"
  );
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, orcamentoId);
  assert(orcamento, "Orçamento inexistente");
  const categoria = getCategoriaById(store, categoriaId);
  ensureCategoriaDespesaAtiva(categoria);
  const orcamentoMes = getOrcamentoMesByAnoMes(store, orcamentoId, mesInicial);
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const alertas = [];
  let meses = [orcamentoMes];
  if (tipoRecorrencia === "FIXO") {
    meses = getMesesOrdenados(store, orcamentoId);
  }
  if (tipoRecorrencia === "PARCELADO") {
    assert(Number.isInteger(qtdParcelas) && qtdParcelas > 0, "Parcelas inválidas");
    const ordenados = getMesesOrdenados(store, orcamentoId);
    const startIndex = ordenados.findIndex((m) => m.mes === mesInicial);
    assert(startIndex >= 0, "Mês não pertence ao orçamento");
    const slice = ordenados.slice(startIndex, startIndex + qtdParcelas);
    if (slice.length < qtdParcelas) {
      alertas.push("Parcelas ultrapassam o período");
    }
    meses = slice;
  }
  const ids = criarDespesas(store, {
    id_orcamento: orcamentoId,
    id_categoria: categoriaId,
    descricao,
    valor,
    tipo_recorrencia: tipoRecorrencia,
    qtd_parcelas: qtdParcelas
  }, meses);
  await saveStore(store);
  return {
    despesasCriadas: ids.map((id_despesa) => ({ despesaId: id_despesa })),
    alertas: alertas.length ? alertas : undefined
  };
};

const criarDespesaDeGastoPredefinido = async ({
  id_gasto_predefinido,
  id_orcamento,
  id_orcamento_mes,
  valor,
  tipo_recorrencia,
  qtd_parcelas
}) => {
  assert(isPositiveNumber(valor), "Valor > 0");
  assert(["EVENTUAL", "FIXO", "PARCELADO"].includes(tipo_recorrencia), "Tipo inválido");
  const store = await loadStore();
  const gasto = getGastoPredefinidoById(store, id_gasto_predefinido);
  assert(gasto && gasto.ativo, "Gasto pré-definido inexistente ou inativo");
  const categoria = getCategoriaById(store, gasto.id_categoria);
  ensureCategoriaDespesaAtiva(categoria);
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento inexistente");
  const orcamentoMes = ensureOrcamentoMesPertence(store, id_orcamento, id_orcamento_mes);
  let meses = [orcamentoMes];
  if (tipo_recorrencia === "FIXO") {
    meses = getMesesOrdenados(store, id_orcamento);
  }
  if (tipo_recorrencia === "PARCELADO") {
    assert(Number.isInteger(qtd_parcelas) && qtd_parcelas > 0, "Parcelas inválidas");
    const ordenados = getMesesOrdenados(store, id_orcamento);
    const startIndex = ordenados.findIndex((m) => m.id_orcamento_mes === id_orcamento_mes);
    assert(startIndex >= 0, "Mês não pertence ao orçamento");
    const slice = ordenados.slice(startIndex, startIndex + qtd_parcelas);
    assert(slice.length === qtd_parcelas, "Parcelas ultrapassam o período");
    meses = slice;
  }
  const ids = criarDespesas(store, {
    id_orcamento,
    id_categoria: gasto.id_categoria,
    id_gasto_predefinido,
    descricao: gasto.descricao,
    valor,
    tipo_recorrencia,
    qtd_parcelas
  }, meses);
  await saveStore(store);
  return { id_despesas: ids };
};

const criarDespesaPredefinidaPorMes = async ({
  gastoPredefinidoId,
  orcamentoId,
  mesInicial,
  valor,
  tipoRecorrencia,
  qtdParcelas
}) => {
  assert(Number.isInteger(mesInicial), "Mês inválido");
  assert(mesInicial >= 1 && mesInicial <= 12, "Mês fora de faixa");
  assert(isPositiveNumber(valor), "Valor > 0");
  assert(
    ["EVENTUAL", "FIXO", "PARCELADO"].includes(tipoRecorrencia),
    "Tipo inválido"
  );
  const store = await loadStore();
  const gasto = getGastoPredefinidoById(store, gastoPredefinidoId);
  assert(gasto && gasto.ativo, "Gasto pré-definido inexistente ou inativo");
  const categoria = getCategoriaById(store, gasto.id_categoria);
  ensureCategoriaDespesaAtiva(categoria);
  const orcamento = getOrcamentoById(store, orcamentoId);
  assert(orcamento, "Orçamento inexistente");
  const orcamentoMes = getOrcamentoMesByAnoMes(store, orcamentoId, mesInicial);
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const alertas = [];
  let meses = [orcamentoMes];
  if (tipoRecorrencia === "FIXO") {
    meses = getMesesOrdenados(store, orcamentoId);
  }
  if (tipoRecorrencia === "PARCELADO") {
    assert(Number.isInteger(qtdParcelas) && qtdParcelas > 0, "Parcelas inválidas");
    const ordenados = getMesesOrdenados(store, orcamentoId);
    const startIndex = ordenados.findIndex((m) => m.mes === mesInicial);
    assert(startIndex >= 0, "Mês não pertence ao orçamento");
    const slice = ordenados.slice(startIndex, startIndex + qtdParcelas);
    if (slice.length < qtdParcelas) {
      alertas.push("Parcelas ultrapassam o período");
    }
    meses = slice;
  }
  const ids = criarDespesas(store, {
    id_orcamento: orcamentoId,
    id_categoria: gasto.id_categoria,
    id_gasto_predefinido: gastoPredefinidoId,
    descricao: gasto.descricao,
    valor,
    tipo_recorrencia: tipoRecorrencia,
    qtd_parcelas: qtdParcelas
  }, meses);
  await saveStore(store);
  return {
    despesasCriadas: ids.map((id_despesa) => ({ despesaId: id_despesa })),
    alertas: alertas.length ? alertas : undefined
  };
};

const marcarPaga = async ({ id_despesa, paga }) => {
  const store = await loadStore();
  const despesa = store.despesas.find((d) => d.id_despesa === id_despesa);
  assert(despesa, "Despesa inexistente");
  despesa.paga = Boolean(paga);
  await saveStore(store);
  return { id_despesa };
};

const setDespesaPaga = async ({ despesaId, paga }) => {
  const store = await loadStore();
  const despesa = store.despesas.find((d) => d.id_despesa === despesaId);
  assert(despesa, "Despesa inexistente");
  despesa.paga = Boolean(paga);
  await saveStore(store);
};

const listDespesasPorMes = async ({ orcamentoId, mes }) => {
  assert(Number.isInteger(mes), "Mês inválido");
  assert(mes >= 1 && mes <= 12, "Mês fora de faixa");
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, orcamentoId);
  assert(orcamento, "Orçamento inexistente");
  const orcamentoMes = getOrcamentoMesByAnoMes(store, orcamentoId, mes);
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const despesas = store.despesas.filter(
    (d) => d.id_orcamento_mes === orcamentoMes.id_orcamento_mes
  );
  const totalLancado = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalPago = despesas.filter((d) => d.paga).reduce((sum, d) => sum + d.valor, 0);
  return { despesas, totalLancado, totalPago };
};

module.exports = {
  createDespesa: criarDespesaManualPorMes,
  createDespesaFromGastoPredefinido: criarDespesaPredefinidaPorMes,
  setDespesaPaga,
  listDespesasPorMes,
  criarDespesaManual,
  criarDespesaDeGastoPredefinido,
  marcarPaga
};
