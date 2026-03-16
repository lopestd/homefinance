const despesasRepository = require("../repositories/despesasRepository");
const batchCreateService = require("./batchCreateService");
const { monthNumberToName, monthNameToNumber, toId } = require("../utils/backendUtils");

const toPositiveInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const mapDespesasOutput = ({ despesasRes, mesesRes, categoriasRes }) => {
  const mesesMap = new Map();
  mesesRes.rows.forEach((row) => {
    const list = mesesMap.get(row.despesa_id) || [];
    list.push(row.mes);
    mesesMap.set(row.despesa_id, list);
  });

  const categoriasMap = new Map(
    categoriasRes.rows.map((row) => [row.id, row.nome])
  );

  return despesasRes.rows.map((row) => ({
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
    categoria: categoriasMap.get(row.categoria_id) || "—"
  }));
};

const validateBasePayload = (payload) => {
  const orcamentoId = toPositiveInt(payload?.orcamentoId);
  const categoriaId = toPositiveInt(payload?.categoriaId);
  const descricao = String(payload?.descricao || "").trim();
  const mesReferencia = monthNameToNumber(payload?.mes) || monthNameToNumber((payload?.meses || [])[0]);
  const valor = Number(payload?.valor) || 0;
  const meses = Array.isArray(payload?.meses) ? payload.meses : [];
  const status = payload?.status === "Pago" ? "Pago" : "Pendente";
  const tipoRecorrencia = payload?.tipoRecorrencia || null;
  const parcelaAtual = payload?.parcela ? Number(payload.parcela) : null;
  const totalParcelas = payload?.totalParcelas
    ? Number(payload.totalParcelas)
    : payload?.qtdParcelas
      ? Number(payload.qtdParcelas)
      : null;

  if (!orcamentoId || !categoriaId || !descricao || !mesReferencia) {
    return { ok: false, message: "Dados de despesa inválidos." };
  }

  return {
    ok: true,
    value: {
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
    }
  };
};

const listDespesas = async (userId) => {
  const raw = await despesasRepository.listDespesas(userId);
  return mapDespesasOutput(raw);
};

const createDespesa = async (payload, userId) => {
  const parsed = validateBasePayload(payload);
  if (!parsed.ok) {
    const error = new Error(parsed.message);
    error.status = 400;
    throw error;
  }

  const { value } = parsed;
  const [hasCategoria, hasOrcamento] = await Promise.all([
    despesasRepository.existsCategoria(userId, value.categoriaId),
    despesasRepository.existsOrcamento(userId, value.orcamentoId)
  ]);

  if (!hasCategoria || !hasOrcamento) {
    const error = new Error("Categoria ou orçamento inválido para a despesa.");
    error.status = 400;
    throw error;
  }

  const client = await despesasRepository.beginTransaction();
  try {
    const id = await despesasRepository.insertDespesa(client, {
      ...value,
      userId
    });
    await despesasRepository.clearDespesaMeses(client, id, userId);
    for (const mesNome of value.meses) {
      const mes = monthNameToNumber(mesNome);
      if (!mes) continue;
      await despesasRepository.insertDespesaMes(client, { despesaId: id, mes, userId });
    }
    await despesasRepository.commitTransaction(client);
  } catch (error) {
    await despesasRepository.rollbackTransaction(client);
    throw error;
  } finally {
    despesasRepository.releaseClient(client);
  }
};

const createDespesasBatch = async (payload, userId) => {
  return batchCreateService.createDespesasBatch(payload, userId);
};

const updateDespesa = async (despesaId, payload, userId) => {
  const id = toPositiveInt(despesaId);
  if (!id) {
    const error = new Error("ID de despesa inválido.");
    error.status = 400;
    throw error;
  }

  const exists = await despesasRepository.existsDespesa(userId, id);
  if (!exists) {
    const error = new Error("Despesa não encontrada.");
    error.status = 404;
    throw error;
  }

  const parsed = validateBasePayload(payload);
  if (!parsed.ok) {
    const error = new Error(parsed.message);
    error.status = 400;
    throw error;
  }

  const { value } = parsed;
  const [hasCategoria, hasOrcamento] = await Promise.all([
    despesasRepository.existsCategoria(userId, value.categoriaId),
    despesasRepository.existsOrcamento(userId, value.orcamentoId)
  ]);

  if (!hasCategoria || !hasOrcamento) {
    const error = new Error("Categoria ou orçamento inválido para a despesa.");
    error.status = 400;
    throw error;
  }

  const client = await despesasRepository.beginTransaction();
  try {
    const updated = await despesasRepository.updateDespesa(client, {
      ...value,
      id,
      userId
    });
    if (!updated) {
      const error = new Error("Despesa não encontrada.");
      error.status = 404;
      throw error;
    }
    await despesasRepository.clearDespesaMeses(client, id, userId);
    for (const mesNome of value.meses) {
      const mes = monthNameToNumber(mesNome);
      if (!mes) continue;
      await despesasRepository.insertDespesaMes(client, { despesaId: id, mes, userId });
    }
    await despesasRepository.commitTransaction(client);
  } catch (error) {
    await despesasRepository.rollbackTransaction(client);
    throw error;
  } finally {
    despesasRepository.releaseClient(client);
  }
};

const updateDespesaStatus = async (despesaId, status, userId) => {
  const id = toPositiveInt(despesaId);
  const normalizedStatus = status === "Pago" ? "Pago" : status === "Pendente" ? "Pendente" : null;
  if (!id || !normalizedStatus) {
    const error = new Error("Dados de status inválidos.");
    error.status = 400;
    throw error;
  }

  const client = await despesasRepository.beginTransaction();
  try {
    const updated = await despesasRepository.updateDespesaStatus(client, {
      id,
      status: normalizedStatus,
      userId
    });
    if (!updated) {
      const error = new Error("Despesa não encontrada.");
      error.status = 404;
      throw error;
    }
    await despesasRepository.commitTransaction(client);
  } catch (error) {
    await despesasRepository.rollbackTransaction(client);
    throw error;
  } finally {
    despesasRepository.releaseClient(client);
  }
};

const deleteDespesa = async (despesaId, userId) => {
  const id = toPositiveInt(despesaId);
  if (!id) {
    const error = new Error("ID de despesa inválido.");
    error.status = 400;
    throw error;
  }

  const client = await despesasRepository.beginTransaction();
  try {
    const deleted = await despesasRepository.deleteDespesa(client, { id, userId });
    if (!deleted) {
      const error = new Error("Despesa não encontrada.");
      error.status = 404;
      throw error;
    }
    await despesasRepository.commitTransaction(client);
  } catch (error) {
    await despesasRepository.rollbackTransaction(client);
    throw error;
  } finally {
    despesasRepository.releaseClient(client);
  }
};

module.exports = {
  listDespesas,
  createDespesa,
  createDespesasBatch,
  updateDespesa,
  updateDespesaStatus,
  deleteDespesa
};
