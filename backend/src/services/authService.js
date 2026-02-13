const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const crypto = require("crypto");
const { JWT_SECRET, JWT_EXPIRES_MIN, JWT_MAX_HOURS, PASSWORD_REGEX } = require("../config/authConfig");
const authRepository = require("../repositories/authRepository");
const { insertAuditLog } = require("../repositories/auditRepository");
const { sleep, hashToken, getRequestIp } = require("../utils/backendUtils");

const register = async ({ nome, email, senha, confirmarSenha, req }) => {
  const emailNormalizado = String(email || "").trim().toLowerCase();
  if (!emailNormalizado || !senha || !confirmarSenha) {
    return { status: 400, body: { sucesso: false, erro: "DADOS_INVALIDOS" } };
  }
  if (senha !== confirmarSenha) {
    return { status: 400, body: { sucesso: false, erro: "SENHAS_DIFERENTES" } };
  }
  if (!PASSWORD_REGEX.test(senha)) {
    return { status: 400, body: { sucesso: false, erro: "SENHA_FRACA" } };
  }
  const existing = await authRepository.findUserIdByEmail(emailNormalizado);
  if (existing.rowCount > 0) {
    return { status: 409, body: { sucesso: false, erro: "EMAIL_JA_EXISTE" } };
  }
  const salt = crypto.randomBytes(32);
  const senhaHash = await argon2.hash(senha, { type: argon2.argon2id, salt });
  const result = await authRepository.createUser({
    email: emailNormalizado,
    senhaHash,
    saltHex: salt.toString("hex"),
    nome
  });
  await insertAuditLog({
    userId: result.rows[0].id_usuario,
    acao: "REGISTRO",
    detalhes: { email: emailNormalizado },
    ip: req ? getRequestIp(req) : null,
    userAgent: req?.headers?.["user-agent"] || null
  });
  return {
    status: 201,
    body: { sucesso: true, mensagem: "Conta criada com sucesso. Verifique seu email." }
  };
};

const login = async ({ email, senha, lembrar, req }) => {
  const emailNormalizado = String(email || "").trim().toLowerCase();
  if (!emailNormalizado || !senha) {
    return { status: 400, body: { sucesso: false, erro: "DADOS_INVALIDOS" } };
  }
  const userRes = await authRepository.findUserForLogin(emailNormalizado);
  if (userRes.rowCount === 0) {
    await sleep(300);
    await insertAuditLog({
      userId: null,
      acao: "LOGIN_FALHA",
      detalhes: { email: emailNormalizado },
      ip: req ? getRequestIp(req) : null,
      userAgent: req?.headers?.["user-agent"] || null
    });
    return { status: 401, body: { sucesso: false, erro: "CREDENCIAIS_INVALIDAS" } };
  }
  const user = userRes.rows[0];
  if (user.ativo === false) {
    return { status: 403, body: { sucesso: false, erro: "CONTA_INATIVA" } };
  }
  const now = new Date();
  if (user.bloqueado_ate && new Date(user.bloqueado_ate) > now) {
    const diffMs = new Date(user.bloqueado_ate) - now;
    const minutos = Math.max(1, Math.ceil(diffMs / 60000));
    return {
      status: 423,
      body: {
        sucesso: false,
        erro: "CONTA_BLOQUEADA",
        mensagem: `Conta temporariamente bloqueada. Tente novamente em ${minutos} minutos`
      }
    };
  }
  const senhaOk = await argon2.verify(user.senha_hash, senha);
  if (!senhaOk) {
    const tentativas = Number(user.tentativas_login || 0) + 1;
    const bloqueadoAte = tentativas >= 5 ? new Date(now.getTime() + 30 * 60 * 1000) : null;
    await authRepository.updateLoginAttempts({
      userId: user.id_usuario,
      tentativas,
      bloqueadoAte
    });
    await insertAuditLog({
      userId: user.id_usuario,
      acao: "LOGIN_FALHA",
      detalhes: { tentativas },
      ip: req ? getRequestIp(req) : null,
      userAgent: req?.headers?.["user-agent"] || null
    });
    await sleep(Math.min(1000, 200 * tentativas));
    return { status: 401, body: { sucesso: false, erro: "CREDENCIAIS_INVALIDAS" } };
  }
  await authRepository.resetLoginAttempts(user.id_usuario);
  const sessionMinutes = lembrar ? JWT_MAX_HOURS * 60 : JWT_EXPIRES_MIN;
  const token = jwt.sign(
    { sub: user.id_usuario, email: user.email, jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: sessionMinutes * 60 }
  );
  const expiraEm = new Date(now.getTime() + sessionMinutes * 60 * 1000);
  await authRepository.createSession({
    userId: user.id_usuario,
    tokenHash: hashToken(token),
    userAgent: req?.headers?.["user-agent"] || null,
    ip: req ? getRequestIp(req) : null,
    expiraEm
  });
  await insertAuditLog({
    userId: user.id_usuario,
    acao: "LOGIN_SUCESSO",
    detalhes: { lembrar: Boolean(lembrar) },
    ip: req ? getRequestIp(req) : null,
    userAgent: req?.headers?.["user-agent"] || null
  });
  return {
    status: 200,
    body: {
      sucesso: true,
      usuario: { id: user.id_usuario, nome: user.nome, email: user.email },
      token,
      expiraEm: expiraEm.toISOString()
    }
  };
};

const logout = async ({ userId, tokenHash, req }) => {
  await authRepository.deactivateSessionByToken({ tokenHash, userId });
  await insertAuditLog({
    userId,
    acao: "LOGOUT",
    detalhes: null,
    ip: req ? getRequestIp(req) : null,
    userAgent: req?.headers?.["user-agent"] || null
  });
  return { status: 200, body: { sucesso: true, mensagem: "Logout realizado com sucesso" } };
};

const changePassword = async ({ userId, senhaAtual, novaSenha, confirmarNovaSenha, req }) => {
  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
    return { status: 400, body: { sucesso: false, erro: "DADOS_INVALIDOS" } };
  }
  if (novaSenha !== confirmarNovaSenha) {
    return { status: 400, body: { sucesso: false, erro: "SENHAS_DIFERENTES" } };
  }
  if (!PASSWORD_REGEX.test(novaSenha)) {
    return { status: 400, body: { sucesso: false, erro: "SENHA_FRACA" } };
  }
  const userRes = await authRepository.findUserPasswordById(userId);
  if (userRes.rowCount === 0) {
    return { status: 401, body: { sucesso: false, erro: "USUARIO_INVALIDO" } };
  }
  const senhaOk = await argon2.verify(userRes.rows[0].senha_hash, senhaAtual);
  if (!senhaOk) {
    return { status: 401, body: { sucesso: false, erro: "CREDENCIAIS_INVALIDAS" } };
  }
  const salt = crypto.randomBytes(32);
  const senhaHash = await argon2.hash(novaSenha, { type: argon2.argon2id, salt });
  await authRepository.updateUserPassword({
    userId,
    senhaHash,
    saltHex: salt.toString("hex")
  });
  await authRepository.deactivateSessionsByUser(userId);
  await insertAuditLog({
    userId,
    acao: "ALTERAR_SENHA",
    detalhes: null,
    ip: req ? getRequestIp(req) : null,
    userAgent: req?.headers?.["user-agent"] || null
  });
  return { status: 200, body: { sucesso: true, mensagem: "Senha alterada com sucesso" } };
};

const validateToken = async (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = Number(payload.sub);
    if (!userId) {
      return { ok: false, status: 401, erro: "TOKEN_INVALIDO" };
    }
    const tokenHash = hashToken(token);
    const sessionRes = await authRepository.findActiveSession({ tokenHash, userId });
    if (sessionRes.rowCount === 0) {
      return { ok: false, status: 401, erro: "SESSAO_INVALIDA" };
    }
    const session = sessionRes.rows[0];
    const now = new Date();
    if (session.data_expiracao && session.data_expiracao <= now) {
      await authRepository.deactivateSessionById(session.id_sessao);
      return { ok: false, status: 401, erro: "SESSAO_EXPIRADA" };
    }
    const maxAgeLimit = new Date(session.data_criacao);
    maxAgeLimit.setHours(maxAgeLimit.getHours() + JWT_MAX_HOURS);
    if (maxAgeLimit <= now) {
      await authRepository.deactivateSessionById(session.id_sessao);
      return { ok: false, status: 401, erro: "SESSAO_EXPIRADA" };
    }
    const userRes = await authRepository.findUserSummaryById(userId);
    if (userRes.rowCount === 0 || userRes.rows[0].ativo === false) {
      return { ok: false, status: 401, erro: "USUARIO_INVALIDO" };
    }
    const newExpiry = new Date(now.getTime() + JWT_EXPIRES_MIN * 60 * 1000);
    await authRepository.updateSessionExpiry({ sessionId: session.id_sessao, newExpiry });
    return {
      ok: true,
      user: {
        id: userRes.rows[0].id_usuario,
        email: userRes.rows[0].email,
        nome: userRes.rows[0].nome
      },
      tokenHash
    };
  } catch (error) {
    return { ok: false, status: 401, erro: "TOKEN_INVALIDO" };
  }
};

module.exports = {
  register,
  login,
  logout,
  changePassword,
  validateToken
};
