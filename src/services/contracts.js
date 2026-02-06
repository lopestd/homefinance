const { loadStore, saveStore, allocateId } = require("../storage/fileStore");

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const isPositiveNumber = (value) => typeof value === "number" && value > 0;

const getOrcamentoById = (store, id_orcamento) =>
  store.orcamentos.find((o) => o.id_orcamento === id_orcamento);

const getOrcamentoMesById = (store, id_orcamento_mes) =>
  store.orcamentoMeses.find((m) => m.id_orcamento_mes === id_orcamento_mes);

const getOrcamentoMeses = (store, id_orcamento) =>
  store.orcamentoMeses.filter((m) => m.id_orcamento === id_orcamento);

const getCategoriaById = (store, id_categoria) =>
  store.categorias.find((c) => c.id_categoria === id_categoria);

const getTipoReceitaById = (store, id_tipo_receita) =>
  store.tiposReceita.find((t) => t.id_tipo_receita === id_tipo_receita);

const getGastoPredefinidoById = (store, id_gasto_predefinido) =>
  store.gastosPredefinidos.find((g) => g.id_gasto_predefinido === id_gasto_predefinido);

const isOrcamentoActive = (store, id_orcamento) => {
  const orcamento = getOrcamentoById(store, id_orcamento);
  return orcamento ? Boolean(orcamento.ativo) : false;
};

const validateMonths = (meses) => {
  assert(Array.isArray(meses) && meses.length > 0, "Lista de meses não vazia");
  assert(meses.length <= 12, "Máximo de 12 meses");
  const unique = new Set(meses);
  assert(unique.size === meses.length, "Meses duplicados");
  meses.forEach((mes) => {
    assert(Number.isInteger(mes) && mes >= 1 && mes <= 12, "Mês inválido");
  });
};

const ensureCategoriaAtiva = (categoria, tipo) => {
  assert(categoria, "Categoria existente");
  assert(categoria.ativo, "Categoria ativa");
  assert(categoria.tipo === tipo, "Categoria do tipo correto");
};

const ensureOrcamentoMesPertence = (store, id_orcamento, id_orcamento_mes) => {
  const orcamentoMes = getOrcamentoMesById(store, id_orcamento_mes);
  assert(orcamentoMes, "Mês existente");
  assert(orcamentoMes.id_orcamento === id_orcamento, "Mês pertence ao orçamento");
  return orcamentoMes;
};

const getMesesOrdenados = (store, id_orcamento) =>
  getOrcamentoMeses(store, id_orcamento).slice().sort((a, b) => a.mes - b.mes);

const criarCategoria = async ({ nome, tipo }) => {
  assert(nome, "Nome obrigatório");
  assert(tipo === "RECEITA" || tipo === "DESPESA", "Tipo obrigatório");
  const store = await loadStore();
  const exists = store.categorias.some(
    (c) => c.nome === nome && c.tipo === tipo
  );
  assert(!exists, "Nome único por tipo");
  const id_categoria = allocateId(store, "categoria");
  store.categorias.push({ id_categoria, nome, tipo, ativo: true });
  await saveStore(store);
  return { id_categoria };
};

const atualizarCategoria = async ({ id_categoria, nome, ativo }) => {
  const store = await loadStore();
  const categoria = getCategoriaById(store, id_categoria);
  assert(categoria, "Categoria existente");
  if (nome && nome !== categoria.nome) {
    const exists = store.categorias.some(
      (c) => c.id_categoria !== id_categoria && c.nome === nome && c.tipo === categoria.tipo
    );
    assert(!exists, "Nome único por tipo");
    categoria.nome = nome;
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

const criarGastoPredefinido = async ({ descricao, id_categoria }) => {
  assert(descricao, "Descrição obrigatória");
  const store = await loadStore();
  const categoria = getCategoriaById(store, id_categoria);
  ensureCategoriaAtiva(categoria, "DESPESA");
  const id_gasto_predefinido = allocateId(store, "gastoPredefinido");
  store.gastosPredefinidos.push({
    id_gasto_predefinido,
    descricao,
    id_categoria,
    ativo: true
  });
  await saveStore(store);
  return { id_gasto_predefinido };
};

const criarTipoReceita = async ({ descricao, recorrente }) => {
  assert(descricao, "Descrição obrigatória");
  const store = await loadStore();
  const exists = store.tiposReceita.some((t) => t.descricao === descricao);
  assert(!exists, "Descrição única");
  const id_tipo_receita = allocateId(store, "tipoReceita");
  store.tiposReceita.push({
    id_tipo_receita,
    descricao,
    recorrente: Boolean(recorrente),
    ativo: true
  });
  await saveStore(store);
  return { id_tipo_receita };
};

const criarOrcamento = async ({ ano, meses }) => {
  assert(Number.isInteger(ano), "Ano obrigatório");
  validateMonths(meses);
  const store = await loadStore();
  const mesSet = new Set(meses);
  const mesesUsados = store.orcamentoMeses.some((om) => {
    const orcamento = getOrcamentoById(store, om.id_orcamento);
    return orcamento && orcamento.ano === ano && mesSet.has(om.mes);
  });
  assert(!mesesUsados, "Nenhum mês já utilizado no mesmo ano");
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

const consultarOrcamento = async ({ id_orcamento }) => {
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento existente");
  const meses = getOrcamentoMeses(store, id_orcamento).map((m) => m.mes);
  const totalReceitas = store.receitas
    .filter((r) => r.id_orcamento === id_orcamento)
    .reduce((sum, r) => sum + r.valor, 0);
  const totalDespesas = store.despesas
    .filter((d) => d.id_orcamento === id_orcamento)
    .reduce((sum, d) => sum + d.valor, 0);
  return {
    ano: orcamento.ano,
    meses,
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas
  };
};

const criarReceita = async ({
  id_orcamento,
  id_orcamento_mes,
  id_categoria,
  descricao,
  valor,
  recebida,
  id_tipo_receita
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento existente");
  ensureOrcamentoMesPertence(store, id_orcamento, id_orcamento_mes);
  const categoria = getCategoriaById(store, id_categoria);
  ensureCategoriaAtiva(categoria, "RECEITA");
  if (id_tipo_receita) {
    const tipoReceita = getTipoReceitaById(store, id_tipo_receita);
    assert(tipoReceita && tipoReceita.ativo, "Tipo de receita válido");
  }
  const id_receita = allocateId(store, "receita");
  store.receitas.push({
    id_receita,
    id_orcamento,
    id_orcamento_mes,
    id_categoria,
    id_tipo_receita: id_tipo_receita || null,
    descricao,
    valor,
    recebida: Boolean(recebida)
  });
  await saveStore(store);
  return { id_receita };
};

const marcarReceitaRecebida = async ({ id_receita, recebida }) => {
  const store = await loadStore();
  const receita = store.receitas.find((r) => r.id_receita === id_receita);
  assert(receita, "Receita existente");
  receita.recebida = Boolean(recebida);
  await saveStore(store);
  return { id_receita };
};

const criarReceitaRecorrente = async ({
  id_orcamento,
  meses,
  id_categoria,
  descricao,
  valor
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  validateMonths(meses);
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento existente");
  const categoria = getCategoriaById(store, id_categoria);
  ensureCategoriaAtiva(categoria, "RECEITA");
  const orcamentoMeses = getOrcamentoMeses(store, id_orcamento);
  const mesesDisponiveis = new Map(orcamentoMeses.map((m) => [m.mes, m.id_orcamento_mes]));
  meses.forEach((mes) => {
    assert(mesesDisponiveis.has(mes), "Meses pertencem ao orçamento");
  });
  const created = [];
  meses.forEach((mes) => {
    const id_orcamento_mes = mesesDisponiveis.get(mes);
    const id_receita = allocateId(store, "receita");
    store.receitas.push({
      id_receita,
      id_orcamento,
      id_orcamento_mes,
      id_categoria,
      id_tipo_receita: null,
      descricao,
      valor,
      recebida: false
    });
    created.push(id_receita);
  });
  await saveStore(store);
  return { id_receitas: created };
};

const criarDespesaInterna = (store, data, meses) => {
  const created = [];
  meses.forEach((mesData) => {
    const id_despesa = allocateId(store, "despesa");
    store.despesas.push({
      id_despesa,
      id_orcamento: data.id_orcamento,
      id_orcamento_mes: mesData.id_orcamento_mes,
      id_categoria: data.id_categoria,
      id_gasto_predefinido: data.id_gasto_predefinido || null,
      descricao: data.descricao,
      valor: data.valor,
      paga: false,
      tipo_recorrencia: data.tipo_recorrencia,
      qtd_parcelas: data.qtd_parcelas || null
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
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento existente");
  const categoria = getCategoriaById(store, id_categoria);
  ensureCategoriaAtiva(categoria, "DESPESA");
  const orcamentoMes = ensureOrcamentoMesPertence(store, id_orcamento, id_orcamento_mes);
  assert(
    ["EVENTUAL", "FIXO", "PARCELADO"].includes(tipo_recorrencia),
    "Tipo de recorrência válido"
  );
  let meses = [orcamentoMes];
  if (tipo_recorrencia === "FIXO") {
    meses = getOrcamentoMeses(store, id_orcamento);
  }
  if (tipo_recorrencia === "PARCELADO") {
    assert(Number.isInteger(qtd_parcelas) && qtd_parcelas > 0, "Quantidade de parcelas válida");
    const ordenados = getMesesOrdenados(store, id_orcamento);
    const startIndex = ordenados.findIndex((m) => m.id_orcamento_mes === id_orcamento_mes);
    assert(startIndex >= 0, "Mês pertence ao orçamento");
    const slice = ordenados.slice(startIndex, startIndex + qtd_parcelas);
    assert(slice.length === qtd_parcelas, "Parcelas ≤ meses disponíveis");
    meses = slice;
  }
  const ids = criarDespesaInterna(store, {
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

const criarDespesaDeGastoPredefinido = async ({
  id_gasto_predefinido,
  id_orcamento,
  id_orcamento_mes,
  valor,
  tipo_recorrencia,
  qtd_parcelas
}) => {
  assert(isPositiveNumber(valor), "Valor > 0");
  const store = await loadStore();
  const gasto = getGastoPredefinidoById(store, id_gasto_predefinido);
  assert(gasto && gasto.ativo, "Gasto pré-definido ativo");
  const categoria = getCategoriaById(store, gasto.id_categoria);
  ensureCategoriaAtiva(categoria, "DESPESA");
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento existente");
  const orcamentoMes = ensureOrcamentoMesPertence(store, id_orcamento, id_orcamento_mes);
  assert(
    ["EVENTUAL", "FIXO", "PARCELADO"].includes(tipo_recorrencia),
    "Tipo de recorrência válido"
  );
  let meses = [orcamentoMes];
  if (tipo_recorrencia === "FIXO") {
    meses = getOrcamentoMeses(store, id_orcamento);
  }
  if (tipo_recorrencia === "PARCELADO") {
    assert(Number.isInteger(qtd_parcelas) && qtd_parcelas > 0, "Quantidade de parcelas válida");
    const ordenados = getMesesOrdenados(store, id_orcamento);
    const startIndex = ordenados.findIndex((m) => m.id_orcamento_mes === id_orcamento_mes);
    assert(startIndex >= 0, "Mês pertence ao orçamento");
    const slice = ordenados.slice(startIndex, startIndex + qtd_parcelas);
    assert(slice.length === qtd_parcelas, "Parcelas ≤ meses disponíveis");
    meses = slice;
  }
  const ids = criarDespesaInterna(store, {
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

const marcarDespesaPaga = async ({ id_despesa, paga }) => {
  const store = await loadStore();
  const despesa = store.despesas.find((d) => d.id_despesa === id_despesa);
  assert(despesa, "Despesa existente");
  despesa.paga = Boolean(paga);
  await saveStore(store);
  return { id_despesa };
};

const criarCartao = async ({ descricao }) => {
  assert(descricao, "Descrição obrigatória");
  const store = await loadStore();
  const id_cartao = allocateId(store, "cartao");
  store.cartoes.push({ id_cartao, descricao, ativo: true });
  await saveStore(store);
  return { id_cartao };
};

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

const criarCartaoLancamento = async ({
  id_cartao,
  id_orcamento_mes,
  descricao,
  valor,
  tipo
}) => {
  assert(descricao, "Descrição obrigatória");
  assert(isPositiveNumber(valor), "Valor > 0");
  assert(["PARCELADO", "RECORRENTE", "CORRENTE"].includes(tipo), "Tipo válido");
  const store = await loadStore();
  const cartao = store.cartoes.find((c) => c.id_cartao === id_cartao);
  assert(cartao && cartao.ativo, "Cartão existente");
  const orcamentoMes = getOrcamentoMesById(store, id_orcamento_mes);
  assert(orcamentoMes, "Mês pertence ao orçamento");
  const cartaoMes = getOrCreateCartaoMes(store, id_cartao, id_orcamento_mes);
  const id_cartao_lancamento = allocateId(store, "cartaoLancamento");
  store.cartaoLancamentos.push({
    id_cartao_lancamento,
    id_cartao_mes: cartaoMes.id_cartao_mes,
    descricao,
    valor,
    tipo,
    paga: false
  });
  await saveStore(store);
  return { id_cartao_lancamento };
};

const consultarFaturaMensal = async ({ id_cartao, id_orcamento_mes }) => {
  const store = await loadStore();
  const cartaoMes = store.cartaoMeses.find(
    (cm) => cm.id_cartao === id_cartao && cm.id_orcamento_mes === id_orcamento_mes
  );
  if (!cartaoMes) {
    return { lancamentos: [], total: 0 };
  }
  const lancamentos = store.cartaoLancamentos.filter(
    (l) => l.id_cartao_mes === cartaoMes.id_cartao_mes
  );
  const total = lancamentos.reduce((sum, l) => sum + l.valor, 0);
  return { lancamentos, total };
};

const calcularTotaisMes = (store, id_orcamento_mes) => {
  const receitas = store.receitas.filter((r) => r.id_orcamento_mes === id_orcamento_mes);
  const despesas = store.despesas.filter((d) => d.id_orcamento_mes === id_orcamento_mes);
  const cartaoMeses = store.cartaoMeses.filter((cm) => cm.id_orcamento_mes === id_orcamento_mes);
  const cartaoMesIds = new Set(cartaoMeses.map((cm) => cm.id_cartao_mes));
  const cartaoLancamentos = store.cartaoLancamentos.filter((l) => cartaoMesIds.has(l.id_cartao_mes));
  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalReceitasRecebidas = receitas.filter((r) => r.recebida).reduce((sum, r) => sum + r.valor, 0);
  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalDespesasPagas = despesas.filter((d) => d.paga).reduce((sum, d) => sum + d.valor, 0);
  const totalCartao = cartaoLancamentos.reduce((sum, l) => sum + l.valor, 0);
  const totalCartaoPago = cartaoLancamentos.filter((l) => l.paga).reduce((sum, l) => sum + l.valor, 0);
  return {
    totalReceitas,
    totalReceitasRecebidas,
    totalDespesas,
    totalDespesasPagas,
    totalCartao,
    totalCartaoPago,
    saldoMes: totalReceitas - totalDespesas
  };
};

const resumoMensal = async ({ id_orcamento_mes }) => {
  const store = await loadStore();
  const orcamentoMes = getOrcamentoMesById(store, id_orcamento_mes);
  assert(orcamentoMes, "Mês existente");
  const totais = calcularTotaisMes(store, id_orcamento_mes);
  return {
    totalReceitasLancadas: totais.totalReceitas,
    totalReceitasRecebidas: totais.totalReceitasRecebidas,
    totalDespesasLancadas: totais.totalDespesas,
    totalDespesasPagas: totais.totalDespesasPagas,
    totalCartao: totais.totalCartao,
    saldoMes: totais.saldoMes
  };
};

const relatorioPorPeriodo = async ({ id_orcamento }) => {
  const store = await loadStore();
  const orcamento = getOrcamentoById(store, id_orcamento);
  assert(orcamento, "Orçamento existente");
  const meses = getMesesOrdenados(store, id_orcamento);
  const totaisPorMes = meses.map((mes) => {
    const totais = calcularTotaisMes(store, mes.id_orcamento_mes);
    return {
      mes: mes.mes,
      receitasLancadas: totais.totalReceitas,
      receitasRecebidas: totais.totalReceitasRecebidas,
      despesasLancadas: totais.totalDespesas,
      despesasPagas: totais.totalDespesasPagas,
      cartaoLancado: totais.totalCartao,
      cartaoPago: totais.totalCartaoPago,
      saldoMes: totais.saldoMes
    };
  });
  const totalReceitas = totaisPorMes.reduce((sum, t) => sum + t.receitasLancadas, 0);
  const totalDespesas = totaisPorMes.reduce((sum, t) => sum + t.despesasLancadas, 0);
  const totalReceitasRecebidas = totaisPorMes.reduce((sum, t) => sum + t.receitasRecebidas, 0);
  const totalDespesasPagas = totaisPorMes.reduce((sum, t) => sum + t.despesasPagas, 0);
  return {
    totaisPorMes,
    comparativoReceitasDespesas: {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas
    },
    pagoVsPrevisto: {
      receitasRecebidas: totalReceitasRecebidas,
      despesasPagas: totalDespesasPagas,
      saldoPago: totalReceitasRecebidas - totalDespesasPagas
    }
  };
};

module.exports = {
  criarCategoria,
  atualizarCategoria,
  criarGastoPredefinido,
  criarTipoReceita,
  criarOrcamento,
  consultarOrcamento,
  criarReceita,
  marcarReceitaRecebida,
  criarReceitaRecorrente,
  criarDespesaManual,
  criarDespesaDeGastoPredefinido,
  marcarDespesaPaga,
  criarCartao,
  criarCartaoLancamento,
  consultarFaturaMensal,
  resumoMensal,
  relatorioPorPeriodo
};
