const { pool } = require("../storage/db");

const insertAuditLog = async ({ userId, acao, detalhes, ip, userAgent }) => {
  await pool.query(
    "INSERT INTO admhomefinance.audit_log (id_usuario, acao, detalhes, ip_origem, user_agent) VALUES ($1, $2, $3, $4, $5)",
    [userId || null, acao, detalhes ? JSON.stringify(detalhes) : null, ip, userAgent]
  );
};

module.exports = {
  insertAuditLog
};
