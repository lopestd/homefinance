const { pool } = require("../storage/db");

const beginTransaction = async () => {
  const client = await pool.connect();
  await client.query("BEGIN");
  return client;
};

const commitTransaction = async (client) => {
  await client.query("COMMIT");
};

const rollbackTransaction = async (client) => {
  await client.query("ROLLBACK");
};

const releaseClient = (client) => {
  client.release();
};

const listDespesas = async (userId) => {
  const [despesasRes, mesesRes, categoriasRes] = await Promise.all([
    pool.query(
      "SELECT id, orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.despesas WHERE id_usuario = $1 ORDER BY id DESC",
      [userId]
    ),
    pool.query(
      "SELECT despesa_id, mes FROM admhomefinance.despesas_meses WHERE id_usuario = $1",
      [userId]
    ),
    pool.query(
      "SELECT id, nome FROM admhomefinance.categorias WHERE id_usuario = $1",
      [userId]
    )
  ]);
  return { despesasRes, mesesRes, categoriasRes };
};

const existsCategoria = async (userId, categoriaId) => {
  const res = await pool.query(
    "SELECT 1 FROM admhomefinance.categorias WHERE id_usuario = $1 AND id = $2",
    [userId, categoriaId]
  );
  return res.rowCount > 0;
};

const existsOrcamento = async (userId, orcamentoId) => {
  const res = await pool.query(
    "SELECT 1 FROM admhomefinance.orcamentos WHERE id_usuario = $1 AND id = $2",
    [userId, orcamentoId]
  );
  return res.rowCount > 0;
};

const existsDespesa = async (userId, despesaId) => {
  const res = await pool.query(
    "SELECT 1 FROM admhomefinance.despesas WHERE id_usuario = $1 AND id = $2",
    [userId, despesaId]
  );
  return res.rowCount > 0;
};

const insertDespesa = async (client, payload) => {
  const result = await client.query(
    "INSERT INTO admhomefinance.despesas (orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
    [
      payload.orcamentoId,
      payload.categoriaId,
      payload.descricao,
      payload.complemento,
      payload.valor,
      payload.mesReferencia,
      payload.data,
      payload.status,
      payload.tipoRecorrencia,
      payload.parcelaAtual,
      payload.totalParcelas,
      payload.userId
    ]
  );
  return result.rows[0].id;
};

const updateDespesa = async (client, payload) => {
  const result = await client.query(
    "UPDATE admhomefinance.despesas SET orcamento_id = $1, categoria_id = $2, descricao = $3, complemento = $4, valor = $5, mes_referencia = $6, data = $7, status = $8, tipo_recorrencia = $9, parcela_atual = $10, total_parcelas = $11 WHERE id = $12 AND id_usuario = $13 RETURNING id",
    [
      payload.orcamentoId,
      payload.categoriaId,
      payload.descricao,
      payload.complemento,
      payload.valor,
      payload.mesReferencia,
      payload.data,
      payload.status,
      payload.tipoRecorrencia,
      payload.parcelaAtual,
      payload.totalParcelas,
      payload.id,
      payload.userId
    ]
  );
  return result.rowCount > 0;
};

const updateDespesaStatus = async (client, { id, status, userId }) => {
  const result = await client.query(
    "UPDATE admhomefinance.despesas SET status = $1 WHERE id = $2 AND id_usuario = $3 RETURNING id",
    [status, id, userId]
  );
  return result.rowCount > 0;
};

const clearDespesaMeses = async (client, despesaId, userId) => {
  await client.query(
    "DELETE FROM admhomefinance.despesas_meses WHERE despesa_id = $1 AND id_usuario = $2",
    [despesaId, userId]
  );
};

const insertDespesaMes = async (client, { despesaId, mes, userId }) => {
  await client.query(
    "INSERT INTO admhomefinance.despesas_meses (despesa_id, mes, id_usuario) VALUES ($1, $2, $3)",
    [despesaId, mes, userId]
  );
};

const deleteDespesa = async (client, { id, userId }) => {
  await client.query(
    "DELETE FROM admhomefinance.despesas_meses WHERE despesa_id = $1 AND id_usuario = $2",
    [id, userId]
  );
  const result = await client.query(
    "DELETE FROM admhomefinance.despesas WHERE id = $1 AND id_usuario = $2 RETURNING id",
    [id, userId]
  );
  return result.rowCount > 0;
};

module.exports = {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  releaseClient,
  listDespesas,
  existsCategoria,
  existsOrcamento,
  existsDespesa,
  insertDespesa,
  updateDespesa,
  updateDespesaStatus,
  clearDespesaMeses,
  insertDespesaMes,
  deleteDespesa
};
