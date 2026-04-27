const configRepository = require("../repositories/configRepository");
const { pool } = require("../storage/db");
const { monthNameToNumber, monthNumberToName, toId } = require("../utils/backendUtils");

const toPositiveInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const ensureArray = (payload) => (Array.isArray(payload) ? payload : []);

const throwBadRequest = (message) => {
  const error = new Error(message);
  error.status = 400;
  throw error;
};

const resolveMonth = (value) => {
  return monthNameToNumber(value);
};

const parseYearFromDate = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isInteger(year) ? year : null;
};

const assertOrcamentoByAnoMes = async (client, userId, payload) => {
  const ano = parseYearFromDate(payload?.data);
  if (!ano) {
    throwBadRequest("Data do lançamento de cartão inválida. Use o formato YYYY-MM-DD.");
  }

  const result = await client.query(
    `SELECT 1
       FROM admhomefinance.orcamentos o
       JOIN admhomefinance.orcamento_meses om
         ON om.orcamento_id = o.id
        AND om.id_usuario = o.id_usuario
      WHERE o.id_usuario = $1
        AND o.id = $2
        AND o.ano = $3
        AND om.mes = $4
      LIMIT 1`,
    [userId, payload.orcamentoId, ano, payload.mesReferencia]
  );

  if (result.rowCount === 0) {
    throwBadRequest(
      `Orçamento ${payload.orcamentoId} não corresponde ao ano/data e mês de referência do lançamento.`
    );
  }
};


const parseDespesaOrReceita = (payload, tipo) => {
  const orcamentoId = toPositiveInt(payload?.orcamentoId);
  const categoriaId = toPositiveInt(payload?.categoriaId);
  const descricao = String(payload?.descricao || "").trim();
  const mesReferencia = resolveMonth(payload?.mes) || resolveMonth((payload?.meses || [])[0]);
  const valor = Number(payload?.valor) || 0;
  const meses = Array.isArray(payload?.meses) ? payload.meses : [];
  const tipoRecorrencia = payload?.tipoRecorrencia || null;
  const parcelaAtual = payload?.parcela ? Number(payload.parcela) : null;
  const totalParcelas = payload?.totalParcelas
    ? Number(payload.totalParcelas)
    : payload?.qtdParcelas
      ? Number(payload.qtdParcelas)
      : null;

  const status = tipo === "despesa"
    ? (payload?.status === "Pago" ? "Pago" : "Pendente")
    : (payload?.status === "Recebido" ? "Recebido" : "Pendente");

  if (!orcamentoId || !categoriaId || !descricao || !mesReferencia) {
    throwBadRequest(`Dados de ${tipo} inválidos para criação em lote.`);
  }

  return {
    orcamentoId,
    categoriaId,
    descricao,
    complemento: payload?.complemento || null,
    valor,
    mesReferencia,
    data: payload?.data || null,
    status,
    tipoRecorrencia,
    parcelaAtual,
    totalParcelas,
    meses
  };
};

const parseLancamentoCartao = (payload) => {
  const orcamentoId = toPositiveInt(payload?.orcamentoId);
  const cartaoId = toPositiveInt(payload?.cartaoId);
  const categoriaId = toPositiveInt(payload?.categoriaId);
  const descricao = String(payload?.descricao || "").trim();
  const mesReferencia =
    resolveMonth(payload?.mesReferencia) ||
    resolveMonth(payload?.mes) ||
    resolveMonth((payload?.meses || [])[0]);
  const valor = Number(payload?.valor) || 0;
  const data = payload?.data ? String(payload.data).trim() : "";
  const meses = Array.isArray(payload?.meses) ? payload.meses : [];
  const rawTipo = String(payload?.tipoRecorrencia || "").trim().toUpperCase();
  const tipoRecorrencia = ["EVENTUAL", "FIXO", "PARCELADO"].includes(rawTipo) ? rawTipo : null;
  const parcelaFromPayload = payload?.parcela ? Number(payload.parcela) : null;
  const totalParcelasFromPayload = payload?.totalParcelas
    ? Number(payload.totalParcelas)
    : payload?.qtdParcelas
      ? Number(payload.qtdParcelas)
      : null;
  let parcelaFromDescricao = null;
  let totalParcelasFromDescricao = null;
  const parcelaMatch = descricao.match(/\((\d+)\s*\/\s*(\d+)\)\s*$/);
  if (parcelaMatch) {
    parcelaFromDescricao = Number(parcelaMatch[1]);
    totalParcelasFromDescricao = Number(parcelaMatch[2]);
  }

  if (!orcamentoId || !cartaoId || !categoriaId || !descricao || !mesReferencia || !data) {
    throwBadRequest("Dados de lançamento de cartão inválidos para criação em lote.");
  }

  return {
    orcamentoId,
    cartaoId,
    categoriaId,
    descricao,
    complemento: payload?.complemento || null,
    valor,
    data,
    mesReferencia,
    tipoRecorrencia,
    parcelaAtual: parcelaFromPayload ?? parcelaFromDescricao,
    totalParcelas: totalParcelasFromPayload ?? totalParcelasFromDescricao,
    meses
  };
};

const assertExistingIds = async (client, tableName, idField, userId, ids, label) => {
  if (ids.size === 0) return;
  const wanted = Array.from(ids);
  const result = await client.query(
    `SELECT ${idField} AS id FROM admhomefinance.${tableName} WHERE id_usuario = $1 AND ${idField} = ANY($2::int[])`,
    [userId, wanted]
  );
  const found = new Set(result.rows.map((row) => Number(row.id)));
  for (const id of wanted) {
    if (!found.has(id)) {
      throwBadRequest(`${label} inválido(a): ${id}.`);
    }
  }
};

const createDespesasBatch = async (payload, userId) => {
  const items = ensureArray(payload);
  if (items.length === 0) return { created: 0 };

  const parsed = items.map((item) => parseDespesaOrReceita(item, "despesa"));
  const categoriaIds = new Set(parsed.map((item) => item.categoriaId));
  const orcamentoIds = new Set(parsed.map((item) => item.orcamentoId));

  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "categorias", "id", userId, categoriaIds, "Categoria");
    await assertExistingIds(client, "orcamentos", "id", userId, orcamentoIds, "Orçamento");

    for (const item of parsed) {
      const result = await configRepository.insertDespesa(client, { ...item, userId });
      const despesaId = result.rows[0].id;
      for (const mesNome of item.meses) {
        const mes = resolveMonth(mesNome);
        if (!mes) continue;
        await configRepository.insertDespesaMes(client, { despesaId, mes, userId });
      }
    }

    await configRepository.commitTransaction(client);
    return { created: parsed.length };
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const createReceitasBatch = async (payload, userId) => {
  const items = ensureArray(payload);
  if (items.length === 0) return { created: 0 };

  const parsed = items.map((item) => parseDespesaOrReceita(item, "receita"));
  const categoriaIds = new Set(parsed.map((item) => item.categoriaId));
  const orcamentoIds = new Set(parsed.map((item) => item.orcamentoId));

  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "categorias", "id", userId, categoriaIds, "Categoria");
    await assertExistingIds(client, "orcamentos", "id", userId, orcamentoIds, "Orçamento");

    for (const item of parsed) {
      const result = await configRepository.insertReceita(client, { ...item, userId });
      const receitaId = result.rows[0].id;
      for (const mesNome of item.meses) {
        const mes = resolveMonth(mesNome);
        if (!mes) continue;
        await configRepository.insertReceitaMes(client, { receitaId, mes, userId });
      }
    }

    await configRepository.commitTransaction(client);
    return { created: parsed.length };
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const createReceita = async (payload, userId) => {
  const parsed = parseDespesaOrReceita(payload, "receita");
  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "categorias", "id", userId, new Set([parsed.categoriaId]), "Categoria");
    await assertExistingIds(client, "orcamentos", "id", userId, new Set([parsed.orcamentoId]), "Orçamento");

    const result = await configRepository.insertReceita(client, { ...parsed, userId });
    const receitaId = result.rows[0].id;
    for (const mesNome of parsed.meses) {
      const mes = resolveMonth(mesNome);
      if (!mes) continue;
      await configRepository.insertReceitaMes(client, { receitaId, mes, userId });
    }
    await configRepository.commitTransaction(client);
    return { created: 1 };
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const updateReceita = async (receitaId, payload, userId) => {
  const id = toPositiveInt(receitaId);
  if (!id) throwBadRequest("ID de receita inválido.");

  const parsed = parseDespesaOrReceita(payload, "receita");
  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "categorias", "id", userId, new Set([parsed.categoriaId]), "Categoria");
    await assertExistingIds(client, "orcamentos", "id", userId, new Set([parsed.orcamentoId]), "Orçamento");

    const exists = await client.query(
      "SELECT id FROM admhomefinance.receitas WHERE id = $1 AND id_usuario = $2",
      [id, userId]
    );
    if (exists.rowCount === 0) {
      const error = new Error("Receita não encontrada.");
      error.status = 404;
      throw error;
    }

    const updated = await configRepository.updateReceita(client, {
      ...parsed,
      id,
      userId
    });
    if (updated.rowCount === 0) {
      const error = new Error("Receita não encontrada.");
      error.status = 404;
      throw error;
    }

    await configRepository.clearReceitaMeses(client, userId, id);
    for (const mesNome of parsed.meses) {
      const mes = resolveMonth(mesNome);
      if (!mes) continue;
      await configRepository.insertReceitaMes(client, { receitaId: id, mes, userId });
    }

    await configRepository.commitTransaction(client);
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const updateReceitaStatus = async (receitaId, status, userId) => {
  const id = toPositiveInt(receitaId);
  const normalizedStatus = status === "Recebido" ? "Recebido" : status === "Pendente" ? "Pendente" : null;
  if (!id || !normalizedStatus) throwBadRequest("Dados de status inválidos.");

  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    const updated = await client.query(
      "UPDATE admhomefinance.receitas SET status = $1 WHERE id = $2 AND id_usuario = $3 RETURNING id",
      [normalizedStatus, id, userId]
    );
    if (updated.rowCount === 0) {
      const error = new Error("Receita não encontrada.");
      error.status = 404;
      throw error;
    }
    await configRepository.commitTransaction(client);
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const deleteReceita = async (receitaId, userId) => {
  const id = toPositiveInt(receitaId);
  if (!id) throwBadRequest("ID de receita inválido.");

  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await configRepository.clearReceitaMeses(client, userId, id);
    const deleted = await client.query(
      "DELETE FROM admhomefinance.receitas WHERE id = $1 AND id_usuario = $2 RETURNING id",
      [id, userId]
    );
    if (deleted.rowCount === 0) {
      const error = new Error("Receita não encontrada.");
      error.status = 404;
      throw error;
    }
    await configRepository.commitTransaction(client);
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const createLancamentosCartaoBatch = async (payload, userId) => {
  const items = ensureArray(payload);
  if (items.length === 0) return { created: 0 };

  const parsed = items.map((item) => parseLancamentoCartao(item));
  const categoriaIds = new Set(parsed.map((item) => item.categoriaId));
  const cartaoIds = new Set(parsed.map((item) => item.cartaoId));
  const orcamentoIds = new Set(parsed.map((item) => item.orcamentoId));

  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "categorias", "id", userId, categoriaIds, "Categoria");
    await assertExistingIds(client, "cartoes", "id", userId, cartaoIds, "Cartão");
    await assertExistingIds(client, "orcamentos", "id", userId, orcamentoIds, "Orçamento");

    for (const item of parsed) {
      await assertOrcamentoByAnoMes(client, userId, item);
      const result = await configRepository.insertLancamentoCartao(client, { ...item, userId });
      const lancamentoId = result.rows[0].id;
      for (const mesNome of item.meses) {
        const mes = resolveMonth(mesNome);
        if (!mes) continue;
        await configRepository.insertLancamentoCartaoMes(client, { lancamentoId, mes, userId });
      }
    }

    await configRepository.commitTransaction(client);
    return { created: parsed.length };
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const createLancamentoCartao = async (payload, userId) => {
  const parsed = parseLancamentoCartao(payload);
  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "categorias", "id", userId, new Set([parsed.categoriaId]), "Categoria");
    await assertExistingIds(client, "cartoes", "id", userId, new Set([parsed.cartaoId]), "Cartão");
    await assertExistingIds(client, "orcamentos", "id", userId, new Set([parsed.orcamentoId]), "Orçamento");
    await assertOrcamentoByAnoMes(client, userId, parsed);

    const result = await configRepository.insertLancamentoCartao(client, { ...parsed, userId });
    const lancamentoId = result.rows[0].id;
    for (const mesNome of parsed.meses) {
      const mes = resolveMonth(mesNome);
      if (!mes) continue;
      await configRepository.insertLancamentoCartaoMes(client, { lancamentoId, mes, userId });
    }
    await configRepository.commitTransaction(client);
    return { created: 1 };
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const updateLancamentoCartao = async (lancamentoId, payload, userId) => {
  const id = toPositiveInt(lancamentoId);
  if (!id) throwBadRequest("ID de lançamento inválido.");

  const parsed = parseLancamentoCartao(payload);
  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "categorias", "id", userId, new Set([parsed.categoriaId]), "Categoria");
    await assertExistingIds(client, "cartoes", "id", userId, new Set([parsed.cartaoId]), "Cartão");
    await assertExistingIds(client, "orcamentos", "id", userId, new Set([parsed.orcamentoId]), "Orçamento");
    await assertOrcamentoByAnoMes(client, userId, parsed);

    const exists = await client.query(
      "SELECT id, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.lancamentos_cartao WHERE id = $1 AND id_usuario = $2",
      [id, userId]
    );
    if (exists.rowCount === 0) {
      const error = new Error("Lançamento não encontrado.");
      error.status = 404;
      throw error;
    }

    const existing = exists.rows[0];
    const tipoRecorrenciaFinal = parsed.tipoRecorrencia || existing.tipo_recorrencia || null;
    let parcelaAtualFinal = parsed.parcelaAtual ?? existing.parcela_atual ?? null;
    let totalParcelasFinal = parsed.totalParcelas ?? existing.total_parcelas ?? null;
    if (tipoRecorrenciaFinal !== "PARCELADO") {
      parcelaAtualFinal = null;
      totalParcelasFinal = null;
    }

    const updated = await client.query(
      "UPDATE admhomefinance.lancamentos_cartao SET orcamento_id = $1, cartao_id = $2, categoria_id = $3, descricao = $4, complemento = $5, valor = $6, data = $7, mes_referencia = $8, tipo_recorrencia = $9, parcela_atual = $10, total_parcelas = $11 WHERE id = $12 AND id_usuario = $13 RETURNING id",
      [
        parsed.orcamentoId,
        parsed.cartaoId,
        parsed.categoriaId,
        parsed.descricao,
        parsed.complemento,
        parsed.valor,
        parsed.data,
        parsed.mesReferencia,
        tipoRecorrenciaFinal,
        parcelaAtualFinal,
        totalParcelasFinal,
        id,
        userId
      ]
    );
    if (updated.rowCount === 0) {
      const error = new Error("Lançamento não encontrado.");
      error.status = 404;
      throw error;
    }

    await client.query(
      "DELETE FROM admhomefinance.lancamentos_cartao_meses WHERE lancamento_id = $1 AND id_usuario = $2",
      [id, userId]
    );
    for (const mesNome of parsed.meses) {
      const mes = resolveMonth(mesNome);
      if (!mes) continue;
      await configRepository.insertLancamentoCartaoMes(client, { lancamentoId: id, mes, userId });
    }

    await configRepository.commitTransaction(client);
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const deleteLancamentoCartao = async (lancamentoId, userId) => {
  const id = toPositiveInt(lancamentoId);
  if (!id) throwBadRequest("ID de lançamento inválido.");

  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await client.query(
      "DELETE FROM admhomefinance.lancamentos_cartao_meses WHERE lancamento_id = $1 AND id_usuario = $2",
      [id, userId]
    );
    const deleted = await client.query(
      "DELETE FROM admhomefinance.lancamentos_cartao WHERE id = $1 AND id_usuario = $2 RETURNING id",
      [id, userId]
    );
    if (deleted.rowCount === 0) {
      const error = new Error("Lançamento não encontrado.");
      error.status = 404;
      throw error;
    }
    await configRepository.commitTransaction(client);
  } catch (error) {
    await configRepository.rollbackTransaction(client);
    throw error;
  } finally {
    configRepository.releaseClient(client);
  }
};

const listReceitas = async (userId) => {
  const [receitasRes, mesesRes, categoriasRes] = await Promise.all([
    pool.query(
      "SELECT id, orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.receitas WHERE id_usuario = $1 ORDER BY id DESC",
      [userId]
    ),
    pool.query("SELECT receita_id, mes FROM admhomefinance.receitas_meses WHERE id_usuario = $1", [userId]),
    pool.query("SELECT id, nome FROM admhomefinance.categorias WHERE id_usuario = $1", [userId])
  ]);

  const mesesMap = new Map();
  mesesRes.rows.forEach((row) => {
    const list = mesesMap.get(row.receita_id) || [];
    list.push(row.mes);
    mesesMap.set(row.receita_id, list);
  });

  const categoriasMap = new Map(categoriasRes.rows.map((row) => [row.id, row.nome]));
  return receitasRes.rows.map((row) => ({
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
    meses: (mesesMap.get(row.id) || []).map(monthNumberToName),
    status: row.status,
    categoria: categoriasMap.get(row.categoria_id) || "â€”"
  }));
};

const listLancamentosCartao = async (userId) => {
  const [lancamentosRes, mesesRes] = await Promise.all([
    pool.query(
      "SELECT id, orcamento_id, cartao_id, categoria_id, descricao, complemento, valor, data, mes_referencia, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.lancamentos_cartao WHERE id_usuario = $1 ORDER BY id",
      [userId]
    ),
    pool.query("SELECT lancamento_id, mes FROM admhomefinance.lancamentos_cartao_meses WHERE id_usuario = $1", [userId])
  ]);

  const mesesMap = new Map();
  mesesRes.rows.forEach((row) => {
    const list = mesesMap.get(row.lancamento_id) || [];
    list.push(row.mes);
    mesesMap.set(row.lancamento_id, list);
  });

  return lancamentosRes.rows.map((row) => ({
    id: toId(row.id),
    orcamentoId: toId(row.orcamento_id),
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
    meses: (mesesMap.get(row.id) || []).map(monthNumberToName)
  }));
};

module.exports = {
  createReceita,
  updateReceita,
  updateReceitaStatus,
  deleteReceita,
  createDespesasBatch,
  createReceitasBatch,
  createLancamentoCartao,
  updateLancamentoCartao,
  deleteLancamentoCartao,
  createLancamentosCartaoBatch,
  listReceitas,
  listLancamentosCartao
};
