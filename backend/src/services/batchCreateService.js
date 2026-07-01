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

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const parseMoneyToCents = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
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

const parseParcelamentoCartao = (payload) => {
  const orcamentoInicialId = toPositiveInt(payload?.orcamentoInicialId);
  const cartaoId = toPositiveInt(payload?.cartaoId);
  const categoriaId = toPositiveInt(payload?.categoriaId);
  const descricao = String(payload?.descricao || "").trim();
  const complemento = payload?.complemento ? String(payload.complemento).trim() : null;
  const valorTotalCents = parseMoneyToCents(payload?.valorTotal);
  const data = payload?.data ? String(payload.data).trim() : "";
  const mesReferenciaInicial = resolveMonth(payload?.mesReferenciaInicial);
  const qtdParcelas = toPositiveInt(payload?.qtdParcelas);

  if (!orcamentoInicialId || !cartaoId || !categoriaId || !descricao) {
    throwBadRequest("Dados de parcelamento inválidos.");
  }
  if (!valorTotalCents || valorTotalCents <= 0) {
    throwBadRequest("Valor total do parcelamento inválido.");
  }
  if (!data.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throwBadRequest("Data do lançamento de cartão inválida. Use o formato YYYY-MM-DD.");
  }
  if (!mesReferenciaInicial) {
    throwBadRequest("Mês inicial do parcelamento inválido.");
  }
  if (!qtdParcelas || qtdParcelas <= 1) {
    throwBadRequest("Informe uma quantidade de parcelas maior que 1.");
  }

  return {
    orcamentoInicialId,
    cartaoId,
    categoriaId,
    descricao,
    complemento,
    valorTotalCents,
    data,
    mesReferenciaInicial,
    qtdParcelas
  };
};

const distributeInstallments = (valorTotalCents, qtdParcelas) => {
  const base = Math.floor(valorTotalCents / qtdParcelas);
  const valores = [];
  for (let index = 0; index < qtdParcelas; index += 1) {
    const value = index === qtdParcelas - 1
      ? valorTotalCents - base * (qtdParcelas - 1)
      : base;
    if (value <= 0) {
      throwBadRequest("Valor de parcela inválido.");
    }
    valores.push(value);
  }
  return valores;
};

const resolveParcelasEntreOrcamentos = async (client, userId, parsed) => {
  const orcamentosRes = await client.query(
    "SELECT id, ano FROM admhomefinance.orcamentos WHERE id_usuario = $1 ORDER BY ano",
    [userId]
  );
  const orcamentos = orcamentosRes.rows;
  const initial = orcamentos.find((orcamento) => Number(orcamento.id) === parsed.orcamentoInicialId);
  if (!initial) {
    throwBadRequest("Orçamento inicial inválido.");
  }

  const mesesRes = await client.query(
    "SELECT orcamento_id, mes FROM admhomefinance.orcamento_meses WHERE id_usuario = $1",
    [userId]
  );
  const mesesPorOrcamento = new Map();
  mesesRes.rows.forEach((row) => {
    const orcamentoId = Number(row.orcamento_id);
    const set = mesesPorOrcamento.get(orcamentoId) || new Set();
    set.add(Number(row.mes));
    mesesPorOrcamento.set(orcamentoId, set);
  });

  const orcamentoPorAno = new Map(orcamentos.map((orcamento) => [Number(orcamento.ano), orcamento]));
  const initialYear = Number(initial.ano);
  const initialMonthIndex = parsed.mesReferenciaInicial - 1;
  const valores = distributeInstallments(parsed.valorTotalCents, parsed.qtdParcelas);

  return valores.map((valorCents, index) => {
    const absoluteMonth = initialMonthIndex + index;
    const ano = initialYear + Math.floor(absoluteMonth / 12);
    const mes = (absoluteMonth % 12) + 1;
    const orcamento = orcamentoPorAno.get(ano);
    if (!orcamento) {
      throwBadRequest(`Orçamento do ano ${ano} não encontrado para criar o parcelamento.`);
    }

    const meses = mesesPorOrcamento.get(Number(orcamento.id)) || new Set();
    if (!meses.has(mes)) {
      throwBadRequest(`${monthNumberToName(mes)} não existe no orçamento ${ano}.`);
    }

    return {
      orcamentoId: Number(orcamento.id),
      ano,
      mes,
      valor: valorCents / 100,
      parcelaAtual: index + 1
    };
  });
};

const assertFaturasAbertas = async (client, userId, cartaoId, parcelas) => {
  for (const parcela of parcelas) {
    const result = await client.query(
      `SELECT 1
         FROM admhomefinance.cartao_faturas_fechadas
        WHERE id_usuario = $1
          AND cartao_id = $2
          AND orcamento_id = $3
          AND mes = $4
        LIMIT 1`,
      [userId, cartaoId, parcela.orcamentoId, parcela.mes]
    );
    if (result.rowCount > 0) {
      throwBadRequest(`Fatura fechada para o cartão no mês ${monthNumberToName(parcela.mes)}/${parcela.ano}.`);
    }
  }
};

const resolveCategoriaDespesaTecnica = async (client, userId) => {
  const result = await client.query(
    `SELECT id, nome
       FROM admhomefinance.categorias
      WHERE id_usuario = $1
        AND tipo = 'DESPESA'
        AND ativa = true
      ORDER BY id`,
    [userId]
  );
  const categorias = result.rows;
  const target = categorias.find((categoria) => normalizeText(categoria.nome) === normalizeText("Bancos/Cartões"));
  const fallback = target || categorias[0];
  if (!fallback) {
    throwBadRequest("Categoria de despesa necessária para sincronizar a fatura não encontrada.");
  }
  return Number(fallback.id);
};

const isTechnicalCardInvoiceDescription = (cartaoNome) => `Fatura do cartão ${cartaoNome}`;

const syncDespesaTecnicaFaturas = async (client, { userId, cartaoId, pares }) => {
  if (!pares.length) return;

  const cartaoRes = await client.query(
    "SELECT id, nome FROM admhomefinance.cartoes WHERE id = $1 AND id_usuario = $2",
    [cartaoId, userId]
  );
  if (cartaoRes.rowCount === 0) {
    throwBadRequest("Cartão inválido.");
  }

  const cartaoNome = cartaoRes.rows[0].nome;
  const descricao = isTechnicalCardInvoiceDescription(cartaoNome);
  const categoriaId = await resolveCategoriaDespesaTecnica(client, userId);
  const today = new Date().toISOString().slice(0, 10);

  for (const pair of pares) {
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(
          CASE
            WHEN valor < 0 OR descricao LIKE '[CREDITO]%' THEN -ABS(valor)
            ELSE ABS(valor)
          END
        ), 0) AS total
         FROM admhomefinance.lancamentos_cartao
        WHERE id_usuario = $1
          AND cartao_id = $2
          AND orcamento_id = $3
          AND mes_referencia = $4`,
      [userId, cartaoId, pair.orcamentoId, pair.mes]
    );
    const totalLiquido = Math.max(Number(totalRes.rows[0]?.total || 0), 0);

    const fechadaRes = await client.query(
      `SELECT 1
         FROM admhomefinance.cartao_faturas_fechadas
        WHERE id_usuario = $1
          AND cartao_id = $2
          AND orcamento_id = $3
          AND mes = $4
        LIMIT 1`,
      [userId, cartaoId, pair.orcamentoId, pair.mes]
    );
    const isFechada = fechadaRes.rowCount > 0;

    const limiteRes = await client.query(
      `SELECT limite
         FROM admhomefinance.cartao_limites_mensais
        WHERE id_usuario = $1
          AND cartao_id = $2
          AND orcamento_id = $3
          AND mes = $4`,
      [userId, cartaoId, pair.orcamentoId, pair.mes]
    );
    const limite = Number(limiteRes.rows[0]?.limite || 0);
    const valorFinal = isFechada ? totalLiquido : Math.max(totalLiquido, limite);

    const existingRes = await client.query(
      `SELECT id, data, status
         FROM admhomefinance.despesas
        WHERE id_usuario = $1
          AND orcamento_id = $2
          AND mes_referencia = $3
          AND descricao = $4
        ORDER BY id
        LIMIT 1`,
      [userId, pair.orcamentoId, pair.mes, descricao]
    );
    const existing = existingRes.rows[0];

    if (valorFinal > 0) {
      if (existing) {
        await client.query(
          `UPDATE admhomefinance.despesas
              SET categoria_id = $1,
                  valor = $2,
                  data = COALESCE(data, $3)
            WHERE id = $4
              AND id_usuario = $5`,
          [categoriaId, valorFinal, today, existing.id, userId]
        );
      } else {
        await configRepository.insertDespesa(client, {
          orcamentoId: pair.orcamentoId,
          categoriaId,
          descricao,
          complemento: null,
          valor: valorFinal,
          mesReferencia: pair.mes,
          data: today,
          status: "Pendente",
          tipoRecorrencia: "EVENTUAL",
          parcelaAtual: null,
          totalParcelas: null,
          userId
        });
      }
      continue;
    }

    if (existing) {
      await client.query(
        "DELETE FROM admhomefinance.despesas_meses WHERE despesa_id = $1 AND id_usuario = $2",
        [existing.id, userId]
      );
      await client.query(
        "DELETE FROM admhomefinance.despesas WHERE id = $1 AND id_usuario = $2",
        [existing.id, userId]
      );
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

const createParcelamentoCartao = async (payload, userId) => {
  const parsed = parseParcelamentoCartao(payload);

  const client = await configRepository.beginTransaction();
  try {
    await configRepository.acquireUserLock(client, userId);
    await assertExistingIds(client, "cartoes", "id", userId, new Set([parsed.cartaoId]), "Cartão");
    await assertExistingIds(client, "orcamentos", "id", userId, new Set([parsed.orcamentoInicialId]), "Orçamento");

    const categoriaRes = await client.query(
      `SELECT id
         FROM admhomefinance.categorias
        WHERE id_usuario = $1
          AND id = $2
          AND tipo = 'DESPESA'
          AND ativa = true`,
      [userId, parsed.categoriaId]
    );
    if (categoriaRes.rowCount === 0) {
      throwBadRequest(`Categoria inválida: ${parsed.categoriaId}.`);
    }

    const parcelas = await resolveParcelasEntreOrcamentos(client, userId, parsed);
    await assertFaturasAbertas(client, userId, parsed.cartaoId, parcelas);

    const affectedPairs = new Map();
    for (const parcela of parcelas) {
      await configRepository.insertLancamentoCartao(client, {
        orcamentoId: parcela.orcamentoId,
        cartaoId: parsed.cartaoId,
        categoriaId: parsed.categoriaId,
        descricao: `${parsed.descricao} (${parcela.parcelaAtual}/${parsed.qtdParcelas})`,
        complemento: parsed.complemento,
        valor: parcela.valor,
        data: parsed.data,
        mesReferencia: parcela.mes,
        tipoRecorrencia: "PARCELADO",
        parcelaAtual: parcela.parcelaAtual,
        totalParcelas: parsed.qtdParcelas,
        userId
      });
      affectedPairs.set(`${parcela.orcamentoId}:${parcela.mes}`, {
        orcamentoId: parcela.orcamentoId,
        mes: parcela.mes
      });
    }

    await syncDespesaTecnicaFaturas(client, {
      userId,
      cartaoId: parsed.cartaoId,
      pares: Array.from(affectedPairs.values())
    });

    await configRepository.commitTransaction(client);
    return { created: parcelas.length };
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
  createParcelamentoCartao,
  updateLancamentoCartao,
  deleteLancamentoCartao,
  createLancamentosCartaoBatch,
  listReceitas,
  listLancamentosCartao
};
