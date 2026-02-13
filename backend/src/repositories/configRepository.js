const { pool } = require("../storage/db");

const fetchConfigData = async (userId) => {
  const [
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
  ] = await Promise.all([
    pool.query("SELECT id, ano, ativo FROM admhomefinance.orcamentos WHERE id_usuario = $1 ORDER BY ano", [userId]),
    pool.query("SELECT orcamento_id, mes FROM admhomefinance.orcamento_meses WHERE id_usuario = $1", [userId]),
    pool.query("SELECT id, nome, tipo, ativa FROM admhomefinance.categorias WHERE id_usuario = $1 ORDER BY id", [userId]),
    pool.query("SELECT id, descricao, categoria_id, ativo FROM admhomefinance.gastos_predefinidos WHERE id_usuario = $1 ORDER BY id", [userId]),
    pool.query("SELECT id, descricao, recorrente, ativo FROM admhomefinance.tipos_receita WHERE id_usuario = $1 ORDER BY id", [userId]),
    pool.query("SELECT id, nome, limite, ativo FROM admhomefinance.cartoes WHERE id_usuario = $1 ORDER BY id", [userId]),
    pool.query("SELECT cartao_id, mes, limite FROM admhomefinance.cartao_limites_mensais WHERE id_usuario = $1", [userId]),
    pool.query("SELECT cartao_id, mes FROM admhomefinance.cartao_faturas_fechadas WHERE id_usuario = $1", [userId]),
    pool.query("SELECT id, orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.receitas WHERE id_usuario = $1 ORDER BY id", [userId]),
    pool.query("SELECT receita_id, mes FROM admhomefinance.receitas_meses WHERE id_usuario = $1", [userId]),
    pool.query("SELECT id, orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.despesas WHERE id_usuario = $1 ORDER BY id", [userId]),
    pool.query("SELECT despesa_id, mes FROM admhomefinance.despesas_meses WHERE id_usuario = $1", [userId]),
    pool.query("SELECT id, cartao_id, categoria_id, descricao, complemento, valor, data, mes_referencia, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.lancamentos_cartao WHERE id_usuario = $1 ORDER BY id", [userId]),
    pool.query("SELECT lancamento_id, mes FROM admhomefinance.lancamentos_cartao_meses WHERE id_usuario = $1", [userId])
  ]);

  return {
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
  };
};

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

const clearConfigData = async (client, userId) => {
  await client.query("DELETE FROM admhomefinance.orcamento_meses WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.receitas_meses WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.despesas_meses WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.cartao_limites_mensais WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.cartao_faturas_fechadas WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.cartao_meses WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.cartao_lancamentos WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.lancamentos_cartao_meses WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.lancamentos_cartao WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.receitas WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.despesas WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.gastos_predefinidos WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.tipos_receita WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.categorias WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.cartoes WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.orcamentos WHERE id_usuario = $1", [userId]);
};

const clearOrcamentos = async (client, userId) => {
  await client.query(
    `DELETE FROM admhomefinance.receitas_meses
     WHERE receita_id IN (
       SELECT id FROM admhomefinance.receitas
       WHERE orcamento_id IN (
         SELECT id FROM admhomefinance.orcamentos WHERE id_usuario = $1
       )
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.receitas
     WHERE orcamento_id IN (
       SELECT id FROM admhomefinance.orcamentos WHERE id_usuario = $1
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.despesas_meses
     WHERE despesa_id IN (
       SELECT id FROM admhomefinance.despesas
       WHERE orcamento_id IN (
         SELECT id FROM admhomefinance.orcamentos WHERE id_usuario = $1
       )
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.despesas
     WHERE orcamento_id IN (
       SELECT id FROM admhomefinance.orcamentos WHERE id_usuario = $1
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.orcamento_meses
     WHERE orcamento_id IN (
       SELECT id FROM admhomefinance.orcamentos WHERE id_usuario = $1
     )`,
    [userId]
  );
  await client.query("DELETE FROM admhomefinance.orcamentos WHERE id_usuario = $1", [userId]);
};

const clearReceitas = async (client, userId) => {
  await client.query("DELETE FROM admhomefinance.receitas_meses WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.receitas WHERE id_usuario = $1", [userId]);
};

const clearDespesas = async (client, userId) => {
  await client.query("DELETE FROM admhomefinance.despesas_meses WHERE id_usuario = $1", [userId]);
  await client.query("DELETE FROM admhomefinance.despesas WHERE id_usuario = $1", [userId]);
};

const clearLancamentosCartao = async (client, userId) => {
  await client.query(
    `DELETE FROM admhomefinance.lancamentos_cartao_meses
     WHERE lancamento_id IN (
       SELECT id FROM admhomefinance.lancamentos_cartao
       WHERE cartao_id IN (
         SELECT id FROM admhomefinance.cartoes WHERE id_usuario = $1
       )
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.lancamentos_cartao
     WHERE cartao_id IN (
       SELECT id FROM admhomefinance.cartoes WHERE id_usuario = $1
     )`,
    [userId]
  );
};

const clearCartoes = async (client, userId) => {
  await client.query(
    `DELETE FROM admhomefinance.lancamentos_cartao_meses
     WHERE lancamento_id IN (
       SELECT id FROM admhomefinance.lancamentos_cartao
       WHERE cartao_id IN (
         SELECT id FROM admhomefinance.cartoes WHERE id_usuario = $1
       )
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.lancamentos_cartao
     WHERE cartao_id IN (
       SELECT id FROM admhomefinance.cartoes WHERE id_usuario = $1
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.cartao_limites_mensais
     WHERE cartao_id IN (
       SELECT id FROM admhomefinance.cartoes WHERE id_usuario = $1
     )`,
    [userId]
  );
  await client.query(
    `DELETE FROM admhomefinance.cartao_faturas_fechadas
     WHERE cartao_id IN (
       SELECT id FROM admhomefinance.cartoes WHERE id_usuario = $1
     )`,
    [userId]
  );
  await client.query("DELETE FROM admhomefinance.cartoes WHERE id_usuario = $1", [userId]);
};

const clearCategorias = async (client, userId) => {
  await client.query("DELETE FROM admhomefinance.categorias WHERE id_usuario = $1", [userId]);
};

const clearGastosPredefinidos = async (client, userId) => {
  await client.query("DELETE FROM admhomefinance.gastos_predefinidos WHERE id_usuario = $1", [userId]);
};

const clearTiposReceita = async (client, userId) => {
  await client.query("DELETE FROM admhomefinance.tipos_receita WHERE id_usuario = $1", [userId]);
};

const listCategorias = async (userId) => {
  return pool.query(
    "SELECT id, nome, tipo, ativa FROM admhomefinance.categorias WHERE id_usuario = $1 AND ativa = true ORDER BY id",
    [userId]
  );
};

const listCategoriaIds = async (userId) => {
  return pool.query(
    "SELECT id FROM admhomefinance.categorias WHERE id_usuario = $1",
    [userId]
  );
};

const createCategoria = async ({ nome, tipo, ativa, userId, lockKey }) => {
  return pool.query(
    `WITH locked AS (
      SELECT pg_advisory_xact_lock(hashtext($1)) AS locked
    ),
    existing AS (
      SELECT id, nome, tipo, ativa
      FROM admhomefinance.categorias
      WHERE id_usuario = $2 AND tipo = $3 AND lower(nome) = lower($4) AND ativa = true
      ORDER BY id
      LIMIT 1
    ),
    inserted AS (
      INSERT INTO admhomefinance.categorias (nome, tipo, ativa, id_usuario)
      SELECT $4, $3, $5, $2
      WHERE NOT EXISTS (SELECT 1 FROM existing)
      RETURNING id, nome, tipo, ativa
    )
    SELECT * FROM inserted
    UNION ALL
    SELECT * FROM existing
    LIMIT 1`,
    [lockKey, userId, tipo, nome, ativa]
  );
};

const mergeDuplicateCategorias = async (userId) => {
  const client = await beginTransaction();
  try {
    const baseCte = `
      WITH dupes AS (
        SELECT id, keep_id
        FROM (
          SELECT
            id,
            MIN(id) OVER (PARTITION BY id_usuario, tipo, lower(nome)) AS keep_id
          FROM admhomefinance.categorias
          WHERE id_usuario = $1 AND ativa = true
        ) ranked
        WHERE id <> keep_id
      )
    `;

    await client.query(
      `${baseCte}
       UPDATE admhomefinance.despesas d
       SET categoria_id = dupes.keep_id
       FROM dupes
       WHERE d.categoria_id = dupes.id AND d.id_usuario = $1`,
      [userId]
    );

    await client.query(
      `${baseCte}
       UPDATE admhomefinance.receitas r
       SET categoria_id = dupes.keep_id
       FROM dupes
       WHERE r.categoria_id = dupes.id AND r.id_usuario = $1`,
      [userId]
    );

    await client.query(
      `${baseCte}
       UPDATE admhomefinance.lancamentos_cartao l
       SET categoria_id = dupes.keep_id
       FROM dupes
       WHERE l.categoria_id = dupes.id AND l.id_usuario = $1`,
      [userId]
    );

    await client.query(
      `${baseCte}
       UPDATE admhomefinance.gastos_predefinidos g
       SET categoria_id = dupes.keep_id
       FROM dupes
       WHERE g.categoria_id = dupes.id AND g.id_usuario = $1`,
      [userId]
    );

    await client.query(
      `${baseCte}
       UPDATE admhomefinance.categorias c
       SET ativa = false
       FROM dupes
       WHERE c.id = dupes.id AND c.id_usuario = $1`,
      [userId]
    );

    await commitTransaction(client);
  } catch (error) {
    await rollbackTransaction(client);
    throw error;
  } finally {
    releaseClient(client);
  }
};

const updateCategoria = async ({ id, nome, tipo, ativa, userId }) => {
  return pool.query(
    "UPDATE admhomefinance.categorias SET nome = $1, tipo = $2, ativa = $3 WHERE id = $4 AND id_usuario = $5 RETURNING id, nome, tipo, ativa",
    [nome, tipo, ativa, id, userId]
  );
};

const deactivateCategoria = async ({ id, userId }) => {
  return pool.query(
    "UPDATE admhomefinance.categorias SET ativa = false WHERE id = $1 AND id_usuario = $2 RETURNING id",
    [id, userId]
  );
};

const listGastosPredefinidos = async (userId) => {
  return pool.query(
    "SELECT id, descricao, categoria_id, ativo FROM admhomefinance.gastos_predefinidos WHERE id_usuario = $1 AND ativo = true ORDER BY id",
    [userId]
  );
};

const createGastoPredefinido = async ({ descricao, categoriaId, ativo, userId }) => {
  return pool.query(
    "INSERT INTO admhomefinance.gastos_predefinidos (descricao, categoria_id, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id, descricao, categoria_id, ativo",
    [descricao, categoriaId, ativo, userId]
  );
};

const updateGastoPredefinido = async ({ id, descricao, categoriaId, ativo, userId }) => {
  return pool.query(
    "UPDATE admhomefinance.gastos_predefinidos SET descricao = $1, categoria_id = $2, ativo = $3 WHERE id = $4 AND id_usuario = $5 RETURNING id, descricao, categoria_id, ativo",
    [descricao, categoriaId, ativo, id, userId]
  );
};

const deactivateGastoPredefinido = async ({ id, userId }) => {
  return pool.query(
    "UPDATE admhomefinance.gastos_predefinidos SET ativo = false WHERE id = $1 AND id_usuario = $2 RETURNING id",
    [id, userId]
  );
};

const listTiposReceita = async (userId) => {
  return pool.query(
    "SELECT id, descricao, recorrente, ativo FROM admhomefinance.tipos_receita WHERE id_usuario = $1 AND ativo = true ORDER BY id",
    [userId]
  );
};

const createTipoReceita = async ({ descricao, recorrente, ativo, userId }) => {
  return pool.query(
    "INSERT INTO admhomefinance.tipos_receita (descricao, recorrente, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id, descricao, recorrente, ativo",
    [descricao, recorrente, ativo, userId]
  );
};

const updateTipoReceita = async ({ id, descricao, recorrente, ativo, userId }) => {
  return pool.query(
    "UPDATE admhomefinance.tipos_receita SET descricao = $1, recorrente = $2, ativo = $3 WHERE id = $4 AND id_usuario = $5 RETURNING id, descricao, recorrente, ativo",
    [descricao, recorrente, ativo, id, userId]
  );
};

const deactivateTipoReceita = async ({ id, userId }) => {
  return pool.query(
    "UPDATE admhomefinance.tipos_receita SET ativo = false WHERE id = $1 AND id_usuario = $2 RETURNING id",
    [id, userId]
  );
};

const insertOrcamento = async (client, { ano, ativo, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.orcamentos (ano, ativo, id_usuario) VALUES ($1, $2, $3) RETURNING id",
    [ano, ativo, userId]
  );
};

const insertOrcamentoMes = async (client, { orcamentoId, mes, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.orcamento_meses (orcamento_id, mes, id_usuario) VALUES ($1, $2, $3)",
    [orcamentoId, mes, userId]
  );
};

const insertCategoria = async (client, { nome, tipo, ativa, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.categorias (nome, tipo, ativa, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
    [nome, tipo, ativa, userId]
  );
};

const insertGastoPredefinido = async (client, { descricao, categoriaId, ativo, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.gastos_predefinidos (descricao, categoria_id, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
    [descricao, categoriaId, ativo, userId]
  );
};

const insertTipoReceita = async (client, { descricao, recorrente, ativo, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.tipos_receita (descricao, recorrente, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
    [descricao, recorrente, ativo, userId]
  );
};

const insertCartao = async (client, { nome, limite, ativo, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.cartoes (nome, limite, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
    [nome, limite, ativo, userId]
  );
};

const insertCartaoLimite = async (client, { cartaoId, mes, limite, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.cartao_limites_mensais (cartao_id, mes, limite, id_usuario) VALUES ($1, $2, $3, $4)",
    [cartaoId, mes, limite, userId]
  );
};

const insertCartaoFatura = async (client, { cartaoId, mes, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.cartao_faturas_fechadas (cartao_id, mes, id_usuario) VALUES ($1, $2, $3)",
    [cartaoId, mes, userId]
  );
};

const insertReceita = async (client, payload) => {
  return client.query(
    "INSERT INTO admhomefinance.receitas (orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
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
};

const insertReceitaMes = async (client, { receitaId, mes, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.receitas_meses (receita_id, mes, id_usuario) VALUES ($1, $2, $3)",
    [receitaId, mes, userId]
  );
};

const insertDespesa = async (client, payload) => {
  return client.query(
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
};

const insertDespesaMes = async (client, { despesaId, mes, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.despesas_meses (despesa_id, mes, id_usuario) VALUES ($1, $2, $3)",
    [despesaId, mes, userId]
  );
};

const insertLancamentoCartao = async (client, payload) => {
  return client.query(
    "INSERT INTO admhomefinance.lancamentos_cartao (cartao_id, categoria_id, descricao, complemento, valor, data, mes_referencia, tipo_recorrencia, parcela_atual, total_parcelas, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
    [
      payload.cartaoId,
      payload.categoriaId,
      payload.descricao,
      payload.complemento,
      payload.valor,
      payload.data,
      payload.mesReferencia,
      payload.tipoRecorrencia,
      payload.parcelaAtual,
      payload.totalParcelas,
      payload.userId
    ]
  );
};

const insertLancamentoCartaoMes = async (client, { lancamentoId, mes, userId }) => {
  return client.query(
    "INSERT INTO admhomefinance.lancamentos_cartao_meses (lancamento_id, mes, id_usuario) VALUES ($1, $2, $3)",
    [lancamentoId, mes, userId]
  );
};

module.exports = {
  fetchConfigData,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  releaseClient,
  clearConfigData,
  clearOrcamentos,
  clearReceitas,
  clearDespesas,
  clearLancamentosCartao,
  clearCartoes,
  clearCategorias,
  clearGastosPredefinidos,
  clearTiposReceita,
  insertOrcamento,
  insertOrcamentoMes,
  insertCategoria,
  insertGastoPredefinido,
  insertTipoReceita,
  insertCartao,
  insertCartaoLimite,
  insertCartaoFatura,
  insertReceita,
  insertReceitaMes,
  insertDespesa,
  insertDespesaMes,
  insertLancamentoCartao,
  insertLancamentoCartaoMes,
  listCategorias,
  listCategoriaIds,
  createCategoria,
  mergeDuplicateCategorias,
  updateCategoria,
  deactivateCategoria,
  listGastosPredefinidos,
  createGastoPredefinido,
  updateGastoPredefinido,
  deactivateGastoPredefinido,
  listTiposReceita,
  createTipoReceita,
  updateTipoReceita,
  deactivateTipoReceita
};
