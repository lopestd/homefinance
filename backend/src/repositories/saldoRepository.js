const { pool } = require("../storage/db");

const getSaldoInicialOrcamento = async (userId, orcamentoId, ano) => {
  const result = await pool.query(
    `SELECT saldo_inicial
     FROM admhomefinance.saldo_inicial_orcamento
     WHERE id_usuario = $1 AND orcamento_id = $2 AND ano = $3
     LIMIT 1`,
    [userId, orcamentoId, ano]
  );
  if (result.rows.length === 0) {
    return 0;
  }
  return Number(result.rows[0].saldo_inicial) || 0;
};

const upsertSaldoInicialOrcamento = async (userId, orcamentoId, ano, saldoInicial) => {
  const result = await pool.query(
    `INSERT INTO admhomefinance.saldo_inicial_orcamento (id_usuario, orcamento_id, ano, saldo_inicial)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id_usuario, orcamento_id, ano)
     DO UPDATE SET saldo_inicial = EXCLUDED.saldo_inicial, atualizado_em = NOW()
     RETURNING id, orcamento_id, ano, saldo_inicial, criado_em, atualizado_em`,
    [userId, orcamentoId, ano, saldoInicial]
  );
  return result.rows[0];
};

const listSaldosIniciaisOrcamento = async (userId) => {
  const result = await pool.query(
    `SELECT id, orcamento_id, ano, saldo_inicial, criado_em, atualizado_em
     FROM admhomefinance.saldo_inicial_orcamento
     WHERE id_usuario = $1
     ORDER BY ano, orcamento_id`,
    [userId]
  );
  return result.rows;
};

const getOrcamentoMeses = async (userId, orcamentoId) => {
  const result = await pool.query(
    `SELECT mes
     FROM admhomefinance.orcamento_meses
     WHERE id_usuario = $1 AND orcamento_id = $2
     ORDER BY mes`,
    [userId, orcamentoId]
  );
  return result.rows.map((row) => Number(row.mes)).filter((mes) => Number.isFinite(mes));
};

const listReceitasRecebidas = async (userId, orcamentoId) => {
  const result = await pool.query(
    `SELECT r.id,
            r.valor,
            r.mes_referencia,
            COALESCE(
              array_agg(rm.mes ORDER BY rm.mes) FILTER (WHERE rm.mes IS NOT NULL),
              '{}'
            ) AS meses
     FROM admhomefinance.receitas r
     LEFT JOIN admhomefinance.receitas_meses rm
       ON rm.receita_id = r.id AND rm.id_usuario = r.id_usuario
     WHERE r.id_usuario = $1
       AND r.orcamento_id = $2
       AND r.status = 'Recebido'
     GROUP BY r.id`,
    [userId, orcamentoId]
  );
  return result.rows;
};

const listDespesasPagas = async (userId, orcamentoId) => {
  const result = await pool.query(
    `SELECT d.id,
            d.valor,
            d.mes_referencia,
            COALESCE(
              array_agg(dm.mes ORDER BY dm.mes) FILTER (WHERE dm.mes IS NOT NULL),
              '{}'
            ) AS meses
     FROM admhomefinance.despesas d
     LEFT JOIN admhomefinance.despesas_meses dm
       ON dm.despesa_id = d.id AND dm.id_usuario = d.id_usuario
     WHERE d.id_usuario = $1
       AND d.orcamento_id = $2
       AND d.status = 'Pago'
     GROUP BY d.id`,
    [userId, orcamentoId]
  );
  return result.rows;
};

module.exports = {
  getSaldoInicialOrcamento,
  upsertSaldoInicialOrcamento,
  listSaldosIniciaisOrcamento,
  getOrcamentoMeses,
  listReceitasRecebidas,
  listDespesasPagas
};
