const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const crypto = require("crypto");
const path = require("path");
const { pool } = require("./src/storage/db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "50mb" }));

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_MIN = process.env.JWT_EXPIRES_MIN ? Number(process.env.JWT_EXPIRES_MIN) : 30;
const JWT_MAX_HOURS = process.env.JWT_MAX_HOURS ? Number(process.env.JWT_MAX_HOURS) : 24;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    erro: "RATE_LIMIT",
    mensagem: "Muitas tentativas. Tente novamente mais tarde."
  }
});

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

const monthNumberToName = (num) => MONTHS[num - 1] || "";
const monthNameToNumber = (name) => {
  const idx = MONTHS.indexOf(name);
  return idx >= 0 ? idx + 1 : null;
};

const toId = (value) => (value === null || value === undefined ? value : String(value));

const insertAuditLog = async ({ userId, acao, detalhes, req }) => {
  const ip = req ? getRequestIp(req) : null;
  const userAgent = req?.headers?.["user-agent"] || null;
  await pool.query(
    "INSERT INTO admhomefinance.audit_log (id_usuario, acao, detalhes, ip_origem, user_agent) VALUES ($1, $2, $3, $4, $5)",
    [userId || null, acao, detalhes ? JSON.stringify(detalhes) : null, ip, userAgent]
  );
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ sucesso: false, erro: "TOKEN_AUSENTE" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = Number(payload.sub);
    if (!userId) {
      return res.status(401).json({ sucesso: false, erro: "TOKEN_INVALIDO" });
    }
    const tokenHash = hashToken(token);
    const sessionRes = await pool.query(
      "SELECT id_sessao, data_criacao, data_expiracao, ativa FROM admhomefinance.sessoes WHERE token_hash = $1 AND id_usuario = $2 AND ativa = TRUE",
      [tokenHash, userId]
    );
    if (sessionRes.rowCount === 0) {
      return res.status(401).json({ sucesso: false, erro: "SESSAO_INVALIDA" });
    }
    const session = sessionRes.rows[0];
    const now = new Date();
    if (session.data_expiracao && session.data_expiracao <= now) {
      await pool.query(
        "UPDATE admhomefinance.sessoes SET ativa = FALSE WHERE id_sessao = $1",
        [session.id_sessao]
      );
      return res.status(401).json({ sucesso: false, erro: "SESSAO_EXPIRADA" });
    }
    const maxAgeLimit = new Date(session.data_criacao);
    maxAgeLimit.setHours(maxAgeLimit.getHours() + JWT_MAX_HOURS);
    if (maxAgeLimit <= now) {
      await pool.query(
        "UPDATE admhomefinance.sessoes SET ativa = FALSE WHERE id_sessao = $1",
        [session.id_sessao]
      );
      return res.status(401).json({ sucesso: false, erro: "SESSAO_EXPIRADA" });
    }
    const userRes = await pool.query(
      "SELECT id_usuario, nome, email, ativo FROM admhomefinance.usuarios WHERE id_usuario = $1",
      [userId]
    );
    if (userRes.rowCount === 0 || userRes.rows[0].ativo === false) {
      return res.status(401).json({ sucesso: false, erro: "USUARIO_INVALIDO" });
    }
    const newExpiry = new Date(now.getTime() + JWT_EXPIRES_MIN * 60 * 1000);
    await pool.query(
      "UPDATE admhomefinance.sessoes SET data_expiracao = $1 WHERE id_sessao = $2",
      [newExpiry, session.id_sessao]
    );
    req.user = {
      id: userRes.rows[0].id_usuario,
      email: userRes.rows[0].email,
      nome: userRes.rows[0].nome
    };
    req.token = token;
    req.tokenHash = tokenHash;
    return next();
  } catch (error) {
    return res.status(401).json({ sucesso: false, erro: "TOKEN_INVALIDO" });
  }
};

const loadConfigFromDb = async (userId) => {
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
    receitas: receitasRes.rows.map((row) => ({
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
    })),
    despesas: despesasRes.rows.map((row) => ({
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
    })),
    lancamentosCartao: lancamentosRes.rows.map((row) => ({
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
    }))
  };
};

const saveConfigToDb = async (payload, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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

    const orcamentoIdMap = new Map();
    for (const orcamento of payload.orcamentos || []) {
      const anoTexto = String(orcamento.label ?? orcamento.ano ?? "").trim();
      const anoMatch = anoTexto.match(/\d{4}/);
      const ano = Number(anoMatch ? anoMatch[0] : anoTexto);
      if (!Number.isFinite(ano) || ano <= 0) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.orcamentos (ano, ativo, id_usuario) VALUES ($1, $2, $3) RETURNING id",
        [ano, orcamento.ativo !== false, userId]
      );
      const id = result.rows[0].id;
      orcamentoIdMap.set(orcamento.id, id);
      const meses = Array.isArray(orcamento.meses) ? orcamento.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.orcamento_meses (orcamento_id, mes, id_usuario) VALUES ($1, $2, $3)",
          [id, mes, userId]
        );
      }
    }

    const categoriaIdMap = new Map();
    for (const categoria of payload.categorias || []) {
      if (!categoria?.nome || !categoria?.tipo) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.categorias (nome, tipo, ativa, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
        [categoria.nome, categoria.tipo, categoria.ativa !== false, userId]
      );
      categoriaIdMap.set(categoria.id, result.rows[0].id);
    }

    const gastoIdMap = new Map();
    for (const gasto of payload.gastosPredefinidos || []) {
      const categoriaId = categoriaIdMap.get(gasto.categoriaId);
      if (!categoriaId || !gasto?.descricao) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.gastos_predefinidos (descricao, categoria_id, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
        [gasto.descricao, categoriaId, gasto.ativo !== false, userId]
      );
      gastoIdMap.set(gasto.id, result.rows[0].id);
    }

    const tipoReceitaIdMap = new Map();
    for (const tipo of payload.tiposReceita || []) {
      if (!tipo?.descricao) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.tipos_receita (descricao, recorrente, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
        [tipo.descricao, Boolean(tipo.recorrente), tipo.ativo !== false, userId]
      );
      tipoReceitaIdMap.set(tipo.id, result.rows[0].id);
    }

    const cartaoIdMap = new Map();
    for (const cartao of payload.cartoes || []) {
      if (!cartao?.nome) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.cartoes (nome, limite, ativo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id",
        [cartao.nome, Number(cartao.limite) || 0, cartao.ativo !== false, userId]
      );
      const cartaoId = result.rows[0].id;
      cartaoIdMap.set(cartao.id, cartaoId);
      const limites = cartao.limitesMensais || {};
      for (const [mesNome, limite] of Object.entries(limites)) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.cartao_limites_mensais (cartao_id, mes, limite, id_usuario) VALUES ($1, $2, $3, $4)",
          [cartaoId, mes, Number(limite) || 0, userId]
        );
      }
      const faturasFechadas = Array.isArray(cartao.faturasFechadas) ? cartao.faturasFechadas : [];
      for (const mesNome of faturasFechadas) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.cartao_faturas_fechadas (cartao_id, mes, id_usuario) VALUES ($1, $2, $3)",
          [cartaoId, mes, userId]
        );
      }
    }

    for (const receita of payload.receitas || []) {
      const orcamentoId = orcamentoIdMap.get(receita.orcamentoId);
      const categoriaId = categoriaIdMap.get(receita.categoriaId);
      if (!orcamentoId || !categoriaId || !receita?.descricao) continue;
      const mesReferencia =
        monthNameToNumber(receita.mes) ||
        monthNameToNumber((receita.meses || [])[0]);
      if (!mesReferencia) continue;
      const totalParcelas =
        receita.totalParcelas ?? (receita.qtdParcelas ? Number(receita.qtdParcelas) : null);
      const result = await client.query(
        "INSERT INTO admhomefinance.receitas (orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
        [
          orcamentoId,
          categoriaId,
          receita.descricao,
          receita.complemento || null,
          Number(receita.valor) || 0,
          mesReferencia,
          receita.data || null,
          receita.status || "Pendente",
          receita.tipoRecorrencia || null,
          receita.parcela || null,
          totalParcelas,
          userId
        ]
      );
      const receitaId = result.rows[0].id;
      const meses = Array.isArray(receita.meses) ? receita.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.receitas_meses (receita_id, mes, id_usuario) VALUES ($1, $2, $3)",
          [receitaId, mes, userId]
        );
      }
    }

    for (const despesa of payload.despesas || []) {
      const orcamentoId = orcamentoIdMap.get(despesa.orcamentoId);
      const categoriaId = categoriaIdMap.get(despesa.categoriaId);
      if (!orcamentoId || !categoriaId || !despesa?.descricao) continue;
      const mesReferencia =
        monthNameToNumber(despesa.mes) ||
        monthNameToNumber((despesa.meses || [])[0]);
      if (!mesReferencia) continue;
      const totalParcelas =
        despesa.totalParcelas ?? (despesa.qtdParcelas ? Number(despesa.qtdParcelas) : null);
      const result = await client.query(
        "INSERT INTO admhomefinance.despesas (orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
        [
          orcamentoId,
          categoriaId,
          despesa.descricao,
          despesa.complemento || null,
          Number(despesa.valor) || 0,
          mesReferencia,
          despesa.data || null,
          despesa.status || "Pendente",
          despesa.tipoRecorrencia || null,
          despesa.parcela || null,
          totalParcelas,
          userId
        ]
      );
      const despesaId = result.rows[0].id;
      const meses = Array.isArray(despesa.meses) ? despesa.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.despesas_meses (despesa_id, mes, id_usuario) VALUES ($1, $2, $3)",
          [despesaId, mes, userId]
        );
      }
    }

    for (const lancamento of payload.lancamentosCartao || []) {
      const cartaoId = cartaoIdMap.get(lancamento.cartaoId);
      const categoriaId = categoriaIdMap.get(lancamento.categoriaId);
      if (!cartaoId || !categoriaId || !lancamento?.descricao) continue;
      const mesReferencia =
        monthNameToNumber(lancamento.mesReferencia) ||
        monthNameToNumber(lancamento.mes);
      if (!mesReferencia) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.lancamentos_cartao (cartao_id, categoria_id, descricao, complemento, valor, data, mes_referencia, tipo_recorrencia, parcela_atual, total_parcelas, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
        [
          cartaoId,
          categoriaId,
          lancamento.descricao,
          lancamento.complemento || null,
          Number(lancamento.valor) || 0,
          lancamento.data,
          mesReferencia,
          lancamento.tipoRecorrencia || null,
          lancamento.parcela || null,
          lancamento.totalParcelas || null,
          userId
        ]
      );
      const lancamentoId = result.rows[0].id;
      const meses = Array.isArray(lancamento.meses) ? lancamento.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.lancamentos_cartao_meses (lancamento_id, mes, id_usuario) VALUES ($1, $2, $3)",
          [lancamentoId, mes, userId]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

app.post("/api/auth/registrar", async (req, res) => {
  try {
    const { nome, email, senha, confirmarSenha } = req.body || {};
    const emailNormalizado = String(email || "").trim().toLowerCase();
    if (!emailNormalizado || !senha || !confirmarSenha) {
      return res.status(400).json({ sucesso: false, erro: "DADOS_INVALIDOS" });
    }
    if (senha !== confirmarSenha) {
      return res.status(400).json({ sucesso: false, erro: "SENHAS_DIFERENTES" });
    }
    if (!PASSWORD_REGEX.test(senha)) {
      return res.status(400).json({ sucesso: false, erro: "SENHA_FRACA" });
    }
    const existing = await pool.query(
      "SELECT id_usuario FROM admhomefinance.usuarios WHERE LOWER(email) = LOWER($1)",
      [emailNormalizado]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ sucesso: false, erro: "EMAIL_JA_EXISTE" });
    }
    const salt = crypto.randomBytes(32);
    const senhaHash = await argon2.hash(senha, { type: argon2.argon2id, salt });
    const result = await pool.query(
      "INSERT INTO admhomefinance.usuarios (email, senha_hash, salt, nome, ativo, email_verificado) VALUES ($1, $2, $3, $4, TRUE, FALSE) RETURNING id_usuario, nome, email",
      [emailNormalizado, senhaHash, salt.toString("hex"), nome || null]
    );
    await insertAuditLog({
      userId: result.rows[0].id_usuario,
      acao: "REGISTRO",
      detalhes: { email: emailNormalizado },
      req
    });
    return res.status(201).json({
      sucesso: true,
      mensagem: "Conta criada com sucesso. Verifique seu email."
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, senha, lembrar } = req.body || {};
    const emailNormalizado = String(email || "").trim().toLowerCase();
    if (!emailNormalizado || !senha) {
      return res.status(400).json({ sucesso: false, erro: "DADOS_INVALIDOS" });
    }
    const userRes = await pool.query(
      "SELECT id_usuario, email, nome, senha_hash, ativo, tentativas_login, bloqueado_ate FROM admhomefinance.usuarios WHERE LOWER(email) = LOWER($1)",
      [emailNormalizado]
    );
    if (userRes.rowCount === 0) {
      await sleep(300);
      await insertAuditLog({
        userId: null,
        acao: "LOGIN_FALHA",
        detalhes: { email: emailNormalizado },
        req
      });
      return res.status(401).json({ sucesso: false, erro: "CREDENCIAIS_INVALIDAS" });
    }
    const user = userRes.rows[0];
    if (user.ativo === false) {
      return res.status(403).json({ sucesso: false, erro: "CONTA_INATIVA" });
    }
    const now = new Date();
    if (user.bloqueado_ate && new Date(user.bloqueado_ate) > now) {
      const diffMs = new Date(user.bloqueado_ate) - now;
      const minutos = Math.max(1, Math.ceil(diffMs / 60000));
      return res.status(423).json({
        sucesso: false,
        erro: "CONTA_BLOQUEADA",
        mensagem: `Conta temporariamente bloqueada. Tente novamente em ${minutos} minutos`
      });
    }
    const senhaOk = await argon2.verify(user.senha_hash, senha);
    if (!senhaOk) {
      const tentativas = Number(user.tentativas_login || 0) + 1;
      const bloqueadoAte =
        tentativas >= 5 ? new Date(now.getTime() + 30 * 60 * 1000) : null;
      await pool.query(
        "UPDATE admhomefinance.usuarios SET tentativas_login = $1, bloqueado_ate = $2 WHERE id_usuario = $3",
        [tentativas, bloqueadoAte, user.id_usuario]
      );
      await insertAuditLog({
        userId: user.id_usuario,
        acao: "LOGIN_FALHA",
        detalhes: { tentativas },
        req
      });
      await sleep(Math.min(1000, 200 * tentativas));
      return res.status(401).json({ sucesso: false, erro: "CREDENCIAIS_INVALIDAS" });
    }
    await pool.query(
      "UPDATE admhomefinance.usuarios SET tentativas_login = 0, bloqueado_ate = NULL, ultimo_login = NOW() WHERE id_usuario = $1",
      [user.id_usuario]
    );
    const sessionMinutes = lembrar ? JWT_MAX_HOURS * 60 : JWT_EXPIRES_MIN;
    const token = jwt.sign(
      { sub: user.id_usuario, email: user.email, jti: crypto.randomUUID() },
      JWT_SECRET,
      { expiresIn: sessionMinutes * 60 }
    );
    const expiraEm = new Date(now.getTime() + sessionMinutes * 60 * 1000);
    await pool.query(
      "INSERT INTO admhomefinance.sessoes (id_usuario, token_hash, dispositivo, ip_origem, data_expiracao, ativa) VALUES ($1, $2, $3, $4, $5, TRUE)",
      [user.id_usuario, hashToken(token), req.headers["user-agent"] || null, getRequestIp(req), expiraEm]
    );
    await insertAuditLog({
      userId: user.id_usuario,
      acao: "LOGIN_SUCESSO",
      detalhes: { lembrar: Boolean(lembrar) },
      req
    });
    return res.json({
      sucesso: true,
      usuario: { id: user.id_usuario, nome: user.nome, email: user.email },
      token,
      expiraEm: expiraEm.toISOString()
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
});

app.post("/api/auth/logout", authenticate, async (req, res) => {
  try {
    await pool.query(
      "UPDATE admhomefinance.sessoes SET ativa = FALSE WHERE token_hash = $1 AND id_usuario = $2",
      [req.tokenHash, req.user.id]
    );
    await insertAuditLog({ userId: req.user.id, acao: "LOGOUT", detalhes: null, req });
    return res.json({ sucesso: true, mensagem: "Logout realizado com sucesso" });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
});

app.get("/api/auth/verificar", authenticate, async (req, res) => {
  return res.json({
    valido: true,
    usuario: { id: req.user.id, nome: req.user.nome, email: req.user.email }
  });
});

app.post("/api/auth/alterar-senha", authenticate, async (req, res) => {
  try {
    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body || {};
    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      return res.status(400).json({ sucesso: false, erro: "DADOS_INVALIDOS" });
    }
    if (novaSenha !== confirmarNovaSenha) {
      return res.status(400).json({ sucesso: false, erro: "SENHAS_DIFERENTES" });
    }
    if (!PASSWORD_REGEX.test(novaSenha)) {
      return res.status(400).json({ sucesso: false, erro: "SENHA_FRACA" });
    }
    const userRes = await pool.query(
      "SELECT id_usuario, senha_hash FROM admhomefinance.usuarios WHERE id_usuario = $1",
      [req.user.id]
    );
    if (userRes.rowCount === 0) {
      return res.status(401).json({ sucesso: false, erro: "USUARIO_INVALIDO" });
    }
    const senhaOk = await argon2.verify(userRes.rows[0].senha_hash, senhaAtual);
    if (!senhaOk) {
      return res.status(401).json({ sucesso: false, erro: "CREDENCIAIS_INVALIDAS" });
    }
    const salt = crypto.randomBytes(32);
    const senhaHash = await argon2.hash(novaSenha, { type: argon2.argon2id, salt });
    await pool.query(
      "UPDATE admhomefinance.usuarios SET senha_hash = $1, salt = $2, data_atualizacao = NOW() WHERE id_usuario = $3",
      [senhaHash, salt.toString("hex"), req.user.id]
    );
    await pool.query(
      "UPDATE admhomefinance.sessoes SET ativa = FALSE WHERE id_usuario = $1",
      [req.user.id]
    );
    await insertAuditLog({ userId: req.user.id, acao: "ALTERAR_SENHA", detalhes: null, req });
    return res.json({ sucesso: true, mensagem: "Senha alterada com sucesso" });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
});

app.get("/api/config", authenticate, async (req, res) => {
  try {
    const config = await loadConfigFromDb(req.user.id);
    res.json(config);
  } catch (error) {
    console.error("GET /api/config failed", error);
    res.status(500).json({ error: "Failed to load configuration", detalhe: error?.message || "Erro interno" });
  }
});

app.put("/api/config", authenticate, async (req, res) => {
  try {
    await saveConfigToDb(req.body || {}, req.user.id);
    res.sendStatus(204);
  } catch (error) {
    console.error("PUT /api/config failed", error);
    res.status(500).json({ error: "Failed to save configuration", detalhe: error?.message || "Erro interno" });
  }
});

const frontendDistPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(frontendDistPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
