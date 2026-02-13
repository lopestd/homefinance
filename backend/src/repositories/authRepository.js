const { pool } = require("../storage/db");

const findUserIdByEmail = async (email) => {
  return pool.query(
    "SELECT id_usuario FROM admhomefinance.usuarios WHERE LOWER(email) = LOWER($1)",
    [email]
  );
};

const findUserForLogin = async (email) => {
  return pool.query(
    "SELECT id_usuario, email, nome, senha_hash, ativo, tentativas_login, bloqueado_ate FROM admhomefinance.usuarios WHERE LOWER(email) = LOWER($1)",
    [email]
  );
};

const createUser = async ({ email, senhaHash, saltHex, nome }) => {
  return pool.query(
    "INSERT INTO admhomefinance.usuarios (email, senha_hash, salt, nome, ativo, email_verificado) VALUES ($1, $2, $3, $4, TRUE, FALSE) RETURNING id_usuario, nome, email",
    [email, senhaHash, saltHex, nome || null]
  );
};

const updateLoginAttempts = async ({ userId, tentativas, bloqueadoAte }) => {
  return pool.query(
    "UPDATE admhomefinance.usuarios SET tentativas_login = $1, bloqueado_ate = $2 WHERE id_usuario = $3",
    [tentativas, bloqueadoAte, userId]
  );
};

const resetLoginAttempts = async (userId) => {
  return pool.query(
    "UPDATE admhomefinance.usuarios SET tentativas_login = 0, bloqueado_ate = NULL, ultimo_login = NOW() WHERE id_usuario = $1",
    [userId]
  );
};

const createSession = async ({ userId, tokenHash, userAgent, ip, expiraEm }) => {
  return pool.query(
    "INSERT INTO admhomefinance.sessoes (id_usuario, token_hash, dispositivo, ip_origem, data_expiracao, ativa) VALUES ($1, $2, $3, $4, $5, TRUE)",
    [userId, tokenHash, userAgent || null, ip, expiraEm]
  );
};

const findActiveSession = async ({ tokenHash, userId }) => {
  return pool.query(
    "SELECT id_sessao, data_criacao, data_expiracao, ativa FROM admhomefinance.sessoes WHERE token_hash = $1 AND id_usuario = $2 AND ativa = TRUE",
    [tokenHash, userId]
  );
};

const deactivateSessionById = async (sessionId) => {
  return pool.query(
    "UPDATE admhomefinance.sessoes SET ativa = FALSE WHERE id_sessao = $1",
    [sessionId]
  );
};

const updateSessionExpiry = async ({ sessionId, newExpiry }) => {
  return pool.query(
    "UPDATE admhomefinance.sessoes SET data_expiracao = $1 WHERE id_sessao = $2",
    [newExpiry, sessionId]
  );
};

const findUserSummaryById = async (userId) => {
  return pool.query(
    "SELECT id_usuario, nome, email, ativo FROM admhomefinance.usuarios WHERE id_usuario = $1",
    [userId]
  );
};

const deactivateSessionByToken = async ({ tokenHash, userId }) => {
  return pool.query(
    "UPDATE admhomefinance.sessoes SET ativa = FALSE WHERE token_hash = $1 AND id_usuario = $2",
    [tokenHash, userId]
  );
};

const findUserPasswordById = async (userId) => {
  return pool.query(
    "SELECT id_usuario, senha_hash FROM admhomefinance.usuarios WHERE id_usuario = $1",
    [userId]
  );
};

const updateUserPassword = async ({ userId, senhaHash, saltHex }) => {
  return pool.query(
    "UPDATE admhomefinance.usuarios SET senha_hash = $1, salt = $2, data_atualizacao = NOW() WHERE id_usuario = $3",
    [senhaHash, saltHex, userId]
  );
};

const deactivateSessionsByUser = async (userId) => {
  return pool.query(
    "UPDATE admhomefinance.sessoes SET ativa = FALSE WHERE id_usuario = $1",
    [userId]
  );
};

module.exports = {
  findUserIdByEmail,
  findUserForLogin,
  createUser,
  updateLoginAttempts,
  resetLoginAttempts,
  createSession,
  findActiveSession,
  deactivateSessionById,
  updateSessionExpiry,
  findUserSummaryById,
  deactivateSessionByToken,
  findUserPasswordById,
  updateUserPassword,
  deactivateSessionsByUser
};
