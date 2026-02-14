const configRepository = require("../repositories/configRepository");
const { monthNumberToName, monthNameToNumber, toId } = require("../utils/backendUtils");

const normalizeCategoriaNome = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const loadConfig = async (userId) => {
  await configRepository.mergeDuplicateCategorias(userId);
  const {
    orcamentosRes,
    orcamentoMesesRes,
    categoriasRes,
    gastosRes,
    tiposRes,
    cartoesRes,
    limitesRes,
    faturasRes,
    receitasRes,
    receitasMesesRes,
    despesasRes,
    despesasMesesRes,
    lancamentosRes,
    lancamentosMesesRes
  } = await configRepository.fetchConfigData(userId);

  const orcamentoMesesMap = new Map();
  orcamentoMesesRes.rows.forEach((row) => {
    const list = orcamentoMesesMap.get(row.orcamento_id) || [];
    list.push(row.mes);
    orcamentoMesesMap.set(row.orcamento_id, list);
  });

  const categoriasById = new Map(
    categoriasRes.rows.map((row) => [row.id, row.nome])
  );

  const receitasMesesMap = new Map();
  receitasMesesRes.rows.forEach((row) => {
    const list = receitasMesesMap.get(row.receita_id) || [];
    list.push(row.mes);
    receitasMesesMap.set(row.receita_id, list);
  });

  const despesasMesesMap = new Map();
  despesasMesesRes.rows.forEach((row) => {
    const list = despesasMesesMap.get(row.despesa_id) || [];
    list.push(row.mes);
    despesasMesesMap.set(row.despesa_id, list);
  });

  const lancamentosMesesMap = new Map();
  lancamentosMesesRes.rows.forEach((row) => {
    const list = lancamentosMesesMap.get(row.lancamento_id) || [];
    list.push(row.mes);
    lancamentosMesesMap.set(row.lancamento_id, list);
  });

  const limitesByCartao = new Map();
  limitesRes.rows.forEach((row) => {
    const entry = limitesByCartao.get(row.cartao_id) || {};
    entry[monthNumberToName(row.mes)] = Number(row.limite);
    limitesByCartao.set(row.cartao_id, entry);
  });

  const faturasByCartao = new Map();
  faturasRes.rows.forEach((row) => {
    const list = faturasByCartao.get(row.cartao_id) || [];
    list.push(monthNumberToName(row.mes));
    faturasByCartao.set(row.cartao_id, list);
  });

  return {
    categorias: categoriasRes.rows.map((row) => ({
      id: toId(row.id),
      nome: row.nome,
      tipo: row.tipo,
      ativa: row.ativa
    })),
    gastosPredefinidos: gastosRes.rows.map((row) => ({
      id: toId(row.id),
      descricao: row.descricao,
      categoriaId: toId(row.categoria_id),
      ativo: row.ativo
    })),
    tiposReceita: tiposRes.rows.map((row) => ({
      id: toId(row.id),
      descricao: row.descricao,
      recorrente: row.recorrente,
      ativo: row.ativo
    })),
    orcamentos: orcamentosRes.rows.map((row) => ({
      id: toId(row.id),
      label: String(row.ano),
      meses: (orcamentoMesesMap.get(row.id) || [])
        .slice()
        .sort((a, b) => a - b)
        .map(monthNumberToName)
    })),
    cartoes: cartoesRes.rows.map((row) => ({
      id: toId(row.id),
      nome: row.nome,
      limite: Number(row.limite),
      limitesMensais: limitesByCartao.get(row.id) || {},
      faturasFechadas: faturasByCartao.get(row.id) || []
    })),
    receitas: receitasRes.rows.map((row) => {
      // DIAGNOSTIC LOG: Check date conversion
      if (row.data) {
        console.log('[DIAGNOSTIC] Receita ID:', row.id, '- Original date from DB:', row.data, '- Type:', typeof row.data);
        console.log('[DIAGNOSTIC] Receita ID:', row.id, '- toISOString():', row.data.toISOString());
        console.log('[DIAGNOSTIC] Receita ID:', row.id, '- Final date string:', row.data.toISOString().slice(0, 10));
      }
      return {
        id: toId(row.id),
        orcamentoId: toId(row.orcamento_id),
        mes: monthNumberToName(row.mes_referencia),
        data: row.data ? row.data.toISOString().slice(0, 10) : null,
        categoriaId: toId(row.categoria_id),
        descricao: row.descricao,
        complemento: row.complemento || "",
        valor: Number(row.valor),
        tipoRecorrencia: row.tipo_recorrencia,
        qtdParcelas: row.total_parcelas ?? "",
        parcela: row.parcela_atual ?? null,
        totalParcelas: row.total_parcelas ?? null,
        meses: (receitasMesesMap.get(row.id) || []).map(monthNumberToName),
        status: row.status,
        categoria: categoriasById.get(row.categoria_id) || "—"
      };
    }),
    despesas: despesasRes.rows.map((row) => {
      // DIAGNOSTIC LOG: Check date conversion
      if (row.data) {
        console.log('[DIAGNOSTIC] Despesa ID:', row.id, '- Original date from DB:', row.data, '- Type:', typeof row.data);
        console.log('[DIAGNOSTIC] Despesa ID:', row.id, '- toISOString():', row.data.toISOString());
        console.log('[DIAGNOSTIC] Despesa ID:', row.id, '- Final date string:', row.data.toISOString().slice(0, 10));
      }
      return {
        id: toId(row.id),
        orcamentoId: toId(row.orcamento_id),
        mes: monthNumberToName(row.mes_referencia),
        data: row.data ? row.data.toISOString().slice(0, 10) : null,
        categoriaId: toId(row.categoria_id),
        descricao: row.descricao,
        complemento: row.complemento || "",
        valor: Number(row.valor),
        tipoRecorrencia: row.tipo_recorrencia,
        qtdParcelas: row.total_parcelas ?? "",
        parcela: row.parcela_atual ?? null,
        totalParcelas: row.total_parcelas ?? null,
        meses: (despesasMesesMap.get(row.id) || []).map(monthNumberToName),
        status: row.status,
        categoria: categoriasById.get(row.categoria_id) || "—"
      };
    }),
    lancamentosCartao: lancamentosRes.rows.map((row) => {
      // DIAGNOSTIC LOG: Check date conversion
      if (row.data) {
        console.log('[DIAGNOSTIC] Lancamento ID:', row.id, '- Original date from DB:', row.data, '- Type:', typeof row.data);
        console.log('[DIAGNOSTIC] Lancamento ID:', row.id, '- toISOString():', row.data.toISOString());
        console.log('[DIAGNOSTIC] Lancamento ID:', row.id, '- Final date string:', row.data.toISOString().slice(0, 10));
      }
      return {
        id: toId(row.id),
        cartaoId: toId(row.cartao_id),
        descricao: row.descricao,
        complemento: row.complemento || "",
        valor: Number(row.valor),
        data: row.data ? row.data.toISOString().slice(0, 10) : null,
        mesReferencia: monthNumberToName(row.mes_referencia),
        categoriaId: toId(row.categoria_id),
        tipoRecorrencia: row.tipo_recorrencia,
        parcela: row.parcela_atual ?? null,
        totalParcelas: row.total_parcelas ?? null,
        meses: (lancamentosMesesMap.get(row.id) || []).map(monthNumberToName)
      };
    })
  };
};

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const resolveId = (map, value) => {
  if (map && map.size > 0) {
    if (map.has(value)) return map.get(value);
    const key = value === null || value === undefined ? value : String(value);
    if (map.has(key)) return map.get(key);
    return null;
  }
  return normalizeId(value);
};

const saveConfig = async (payload, userId) => {
  const client = await configRepository.beginTransaction();
  try {
    const isPartial = payload?._partial === true;
    if (!isPartial) {
      await configRepository.clearConfigData(client, userId);
    } else {
      const hasLancamentos = Object.prototype.hasOwnProperty.call(payload, "lancamentosCartao");
      const hasReceitas = Object.prototype.hasOwnProperty.call(payload, "receitas");
      const hasDespesas = Object.prototype.hasOwnProperty.call(payload, "despesas");
      const hasCartoes = Object.prototype.hasOwnProperty.call(payload, "cartoes");
      const hasOrcamentos = Object.prototype.hasOwnProperty.call(payload, "orcamentos");
      const hasGastos = Object.prototype.hasOwnProperty.call(payload, "gastosPredefinidos");
      const hasTipos = Object.prototype.hasOwnProperty.call(payload, "tiposReceita");
      const hasCategorias = Object.prototype.hasOwnProperty.call(payload, "categorias");

      if (hasLancamentos) {
        await configRepository.clearLancamentosCartao(client, userId);
      }
      if (hasReceitas) {
        await configRepository.clearReceitas(client, userId);
      }
      if (hasDespesas) {
        await configRepository.clearDespesas(client, userId);
      }
      if (hasCartoes) {
        await configRepository.clearCartoes(client, userId);
      }
      if (hasOrcamentos) {
        await configRepository.clearOrcamentos(client, userId);
      }
      if (hasGastos) {
        await configRepository.clearGastosPredefinidos(client, userId);
      }
      if (hasTipos) {
        await configRepository.clearTiposReceita(client, userId);
      }
      if (hasCategorias) {
        await configRepository.clearCategorias(client, userId);
      }
    }

    const orcamentoIdMap = new Map();
    const orcamentosPayload = Array.isArray(payload.orcamentos) ? payload.orcamentos : [];
    for (const orcamento of orcamentosPayload) {
      const anoTexto = String(orcamento.label ?? orcamento.ano ?? "").trim();
      const anoMatch = anoTexto.match(/\d{4}/);
      const ano = Number(anoMatch ? anoMatch[0] : anoTexto);
      if (!Number.isFinite(ano) || ano <= 0) continue;
      const result = await configRepository.insertOrcamento(client, {
        ano,
        ativo: orcamento.ativo !== false,
        userId
      });
      const id = result.rows[0].id;
      orcamentoIdMap.set(orcamento.id, id);
      const meses = Array.isArray(orcamento.meses) ? orcamento.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await configRepository.insertOrcamentoMes(client, { orcamentoId: id, mes, userId });
      }
    }

    const categoriaIdMap = new Map();
    const categoriasPayload = Array.isArray(payload.categorias) ? payload.categorias : [];
    for (const categoria of categoriasPayload) {
      if (!categoria?.nome || !categoria?.tipo) continue;
      const result = await configRepository.insertCategoria(client, {
        nome: categoria.nome,
        tipo: categoria.tipo,
        ativa: categoria.ativa !== false,
        userId
      });
      const id = result.rows[0].id;
      categoriaIdMap.set(categoria.id, id);
      categoriaIdMap.set(String(categoria.id), id);
    }

    if (categoriaIdMap.size === 0) {
      const categoriasDb = await configRepository.listCategoriaIds(userId);
      categoriasDb.rows.forEach((row) => {
        const id = toId(row.id);
        if (!id) return;
        categoriaIdMap.set(id, id);
        categoriaIdMap.set(String(id), id);
      });
    }

    const gastoIdMap = new Map();
    const gastosPayload = Array.isArray(payload.gastosPredefinidos) ? payload.gastosPredefinidos : [];
    for (const gasto of gastosPayload) {
      const categoriaId = resolveId(categoriaIdMap, gasto.categoriaId);
      if (!categoriaId || !gasto?.descricao) continue;
      const result = await configRepository.insertGastoPredefinido(client, {
        descricao: gasto.descricao,
        categoriaId,
        ativo: gasto.ativo !== false,
        userId
      });
      gastoIdMap.set(gasto.id, result.rows[0].id);
    }

    const tipoReceitaIdMap = new Map();
    const tiposPayload = Array.isArray(payload.tiposReceita) ? payload.tiposReceita : [];
    for (const tipo of tiposPayload) {
      if (!tipo?.descricao) continue;
      const result = await configRepository.insertTipoReceita(client, {
        descricao: tipo.descricao,
        recorrente: Boolean(tipo.recorrente),
        ativo: tipo.ativo !== false,
        userId
      });
      tipoReceitaIdMap.set(tipo.id, result.rows[0].id);
    }

    const cartaoIdMap = new Map();
    const cartoesPayload = Array.isArray(payload.cartoes) ? payload.cartoes : [];
    for (const cartao of cartoesPayload) {
      if (!cartao?.nome) continue;
      const result = await configRepository.insertCartao(client, {
        nome: cartao.nome,
        limite: Number(cartao.limite) || 0,
        ativo: cartao.ativo !== false,
        userId
      });
      const cartaoId = result.rows[0].id;
      cartaoIdMap.set(cartao.id, cartaoId);
      const limites = cartao.limitesMensais || {};
      for (const [mesNome, limite] of Object.entries(limites)) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await configRepository.insertCartaoLimite(client, {
          cartaoId,
          mes,
          limite: Number(limite) || 0,
          userId
        });
      }
      const faturasFechadas = Array.isArray(cartao.faturasFechadas) ? cartao.faturasFechadas : [];
      for (const mesNome of faturasFechadas) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await configRepository.insertCartaoFatura(client, { cartaoId, mes, userId });
      }
    }

    const receitasPayload = Array.isArray(payload.receitas) ? payload.receitas : [];
    for (const receita of receitasPayload) {
      const orcamentoId = resolveId(orcamentoIdMap, receita.orcamentoId);
      const categoriaId = resolveId(categoriaIdMap, receita.categoriaId);
      if (!orcamentoId || !categoriaId || !receita?.descricao) continue;
      const mesReferencia =
        monthNameToNumber(receita.mes) ||
        monthNameToNumber((receita.meses || [])[0]);
      if (!mesReferencia) continue;
      const totalParcelas =
        receita.totalParcelas ?? (receita.qtdParcelas ? Number(receita.qtdParcelas) : null);
      // DIAGNOSTIC LOG: Check date being saved
      console.log('[DIAGNOSTIC] Saving Receita - ID:', receita.id, '- data value:', receita.data, '- Type:', typeof receita.data);
      const result = await configRepository.insertReceita(client, {
        orcamentoId,
        categoriaId,
        descricao: receita.descricao,
        complemento: receita.complemento || null,
        valor: Number(receita.valor) || 0,
        mesReferencia,
        data: receita.data || null,
        status: receita.status || "Pendente",
        tipoRecorrencia: receita.tipoRecorrencia || null,
        parcelaAtual: receita.parcela || null,
        totalParcelas,
        userId
      });
      const receitaId = result.rows[0].id;
      const meses = Array.isArray(receita.meses) ? receita.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await configRepository.insertReceitaMes(client, { receitaId, mes, userId });
      }
    }

    const despesasPayload = Array.isArray(payload.despesas) ? payload.despesas : [];
    for (const despesa of despesasPayload) {
      const orcamentoId = resolveId(orcamentoIdMap, despesa.orcamentoId);
      const categoriaId = resolveId(categoriaIdMap, despesa.categoriaId);
      if (!orcamentoId || !categoriaId || !despesa?.descricao) continue;
      const mesReferencia =
        monthNameToNumber(despesa.mes) ||
        monthNameToNumber((despesa.meses || [])[0]);
      if (!mesReferencia) continue;
      const totalParcelas =
        despesa.totalParcelas ?? (despesa.qtdParcelas ? Number(despesa.qtdParcelas) : null);
      // DIAGNOSTIC LOG: Check date being saved
      console.log('[DIAGNOSTIC] Saving Despesa - ID:', despesa.id, '- data value:', despesa.data, '- Type:', typeof despesa.data);
      const result = await configRepository.insertDespesa(client, {
        orcamentoId,
        categoriaId,
        descricao: despesa.descricao,
        complemento: despesa.complemento || null,
        valor: Number(despesa.valor) || 0,
        mesReferencia,
        data: despesa.data || null,
        status: despesa.status || "Pendente",
        tipoRecorrencia: despesa.tipoRecorrencia || null,
        parcelaAtual: despesa.parcela || null,
        totalParcelas,
        userId
      });
      const despesaId = result.rows[0].id;
      const meses = Array.isArray(despesa.meses) ? despesa.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await configRepository.insertDespesaMes(client, { despesaId, mes, userId });
      }
    }

    const lancamentosPayload = Array.isArray(payload.lancamentosCartao) ? payload.lancamentosCartao : [];
    for (const lancamento of lancamentosPayload) {
      const cartaoId = resolveId(cartaoIdMap, lancamento.cartaoId);
      const categoriaId = resolveId(categoriaIdMap, lancamento.categoriaId);
      if (!cartaoId || !categoriaId || !lancamento?.descricao) continue;
      const mesReferencia =
        monthNameToNumber(lancamento.mesReferencia) ||
        monthNameToNumber(lancamento.mes);
      if (!mesReferencia) continue;
      // DIAGNOSTIC LOG: Check date being saved
      console.log('[DIAGNOSTIC] Saving Lancamento - ID:', lancamento.id, '- data value:', lancamento.data, '- Type:', typeof lancamento.data);
      const result = await configRepository.insertLancamentoCartao(client, {
        cartaoId,
        categoriaId,
        descricao: lancamento.descricao,
        complemento: lancamento.complemento || null,
        valor: Number(lancamento.valor) || 0,
        data: lancamento.data,
        mesReferencia,
        tipoRecorrencia: lancamento.tipoRecorrencia || null,
        parcelaAtual: lancamento.parcela || null,
        totalParcelas: lancamento.totalParcelas || null,
        userId
      });
      const lancamentoId = result.rows[0].id;
      const meses = Array.isArray(lancamento.meses) ? lancamento.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await configRepository.insertLancamentoCartaoMes(client, { lancamentoId, mes, userId });
      }
    }

    await configRepository.commitTransaction(client);
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const listCategorias = async (userId) => {
  await configRepository.mergeDuplicateCategorias(userId);
  const result = await configRepository.listCategorias(userId);
  return result.rows.map((row) => ({
    id: toId(row.id),
    nome: row.nome,
    tipo: row.tipo,
    ativa: row.ativa
  }));
};

const createCategoria = async (payload, userId) => {
  const categorias = await listCategorias(userId);
  const targetKey = normalizeCategoriaNome(payload.nome);
  const existing = categorias.find(
    (categoria) =>
      categoria.tipo === payload.tipo &&
      normalizeCategoriaNome(categoria.nome) === targetKey
  );
  if (existing) return existing;
  const result = await configRepository.createCategoria({
    nome: payload.nome,
    tipo: payload.tipo,
    ativa: payload.ativa !== false,
    userId,
    lockKey: `${userId}:${payload.tipo}:${targetKey}`
  });
  const row = result.rows[0];
  return {
    id: toId(row.id),
    nome: row.nome,
    tipo: row.tipo,
    ativa: row.ativa
  };
};

const updateCategoria = async (id, payload, userId) => {
  const categorias = await listCategorias(userId);
  const targetKey = normalizeCategoriaNome(payload.nome);
  const existing = categorias.find(
    (categoria) =>
      categoria.tipo === payload.tipo &&
      normalizeCategoriaNome(categoria.nome) === targetKey &&
      String(categoria.id) !== String(id)
  );
  if (existing) {
    const error = new Error("Categoria já existe.");
    error.status = 409;
    throw error;
  }
  const result = await configRepository.updateCategoria({
    id,
    nome: payload.nome,
    tipo: payload.tipo,
    ativa: payload.ativa !== false,
    userId
  });
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: toId(row.id),
    nome: row.nome,
    tipo: row.tipo,
    ativa: row.ativa
  };
};

const deleteCategoria = async (id, userId) => {
  const result = await configRepository.deactivateCategoria({ id, userId });
  return Boolean(result.rows[0]);
};

const listGastosPredefinidos = async (userId) => {
  const result = await configRepository.listGastosPredefinidos(userId);
  return result.rows.map((row) => ({
    id: toId(row.id),
    descricao: row.descricao,
    categoriaId: toId(row.categoria_id),
    ativo: row.ativo
  }));
};

const createGastoPredefinido = async (payload, userId) => {
  const result = await configRepository.createGastoPredefinido({
    descricao: payload.descricao,
    categoriaId: payload.categoriaId,
    ativo: payload.ativo !== false,
    userId
  });
  const row = result.rows[0];
  return {
    id: toId(row.id),
    descricao: row.descricao,
    categoriaId: toId(row.categoria_id),
    ativo: row.ativo
  };
};

const updateGastoPredefinido = async (id, payload, userId) => {
  const result = await configRepository.updateGastoPredefinido({
    id,
    descricao: payload.descricao,
    categoriaId: payload.categoriaId,
    ativo: payload.ativo !== false,
    userId
  });
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: toId(row.id),
    descricao: row.descricao,
    categoriaId: toId(row.categoria_id),
    ativo: row.ativo
  };
};

const deleteGastoPredefinido = async (id, userId) => {
  const result = await configRepository.deactivateGastoPredefinido({ id, userId });
  return Boolean(result.rows[0]);
};

const listTiposReceita = async (userId) => {
  const result = await configRepository.listTiposReceita(userId);
  return result.rows.map((row) => ({
    id: toId(row.id),
    descricao: row.descricao,
    recorrente: row.recorrente,
    ativo: row.ativo
  }));
};

const createTipoReceita = async (payload, userId) => {
  const result = await configRepository.createTipoReceita({
    descricao: payload.descricao,
    recorrente: Boolean(payload.recorrente),
    ativo: payload.ativo !== false,
    userId
  });
  const row = result.rows[0];
  return {
    id: toId(row.id),
    descricao: row.descricao,
    recorrente: row.recorrente,
    ativo: row.ativo
  };
};

const updateTipoReceita = async (id, payload, userId) => {
  const result = await configRepository.updateTipoReceita({
    id,
    descricao: payload.descricao,
    recorrente: Boolean(payload.recorrente),
    ativo: payload.ativo !== false,
    userId
  });
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: toId(row.id),
    descricao: row.descricao,
    recorrente: row.recorrente,
    ativo: row.ativo
  };
};

const deleteTipoReceita = async (id, userId) => {
  const result = await configRepository.deactivateTipoReceita({ id, userId });
  return Boolean(result.rows[0]);
};

module.exports = {
  loadConfig,
  saveConfig,
  listCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  listGastosPredefinidos,
  createGastoPredefinido,
  updateGastoPredefinido,
  deleteGastoPredefinido,
  listTiposReceita,
  createTipoReceita,
  updateTipoReceita,
  deleteTipoReceita
};
