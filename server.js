const express = require("express");
const cors = require("cors");
const { pool } = require("./src/storage/db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

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

const loadConfigFromDb = async () => {
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
    pool.query("SELECT id, ano, ativo FROM admhomefinance.orcamentos ORDER BY ano"),
    pool.query("SELECT orcamento_id, mes FROM admhomefinance.orcamento_meses"),
    pool.query("SELECT id, nome, tipo, ativa FROM admhomefinance.categorias ORDER BY id"),
    pool.query("SELECT id, descricao, categoria_id, ativo FROM admhomefinance.gastos_predefinidos ORDER BY id"),
    pool.query("SELECT id, descricao, recorrente, ativo FROM admhomefinance.tipos_receita ORDER BY id"),
    pool.query("SELECT id, nome, limite, ativo FROM admhomefinance.cartoes ORDER BY id"),
    pool.query("SELECT cartao_id, mes, limite FROM admhomefinance.cartao_limites_mensais"),
    pool.query("SELECT cartao_id, mes FROM admhomefinance.cartao_faturas_fechadas"),
    pool.query("SELECT id, orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.receitas ORDER BY id"),
    pool.query("SELECT receita_id, mes FROM admhomefinance.receitas_meses"),
    pool.query("SELECT id, orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.despesas ORDER BY id"),
    pool.query("SELECT despesa_id, mes FROM admhomefinance.despesas_meses"),
    pool.query("SELECT id, cartao_id, categoria_id, descricao, complemento, valor, data, mes_referencia, tipo_recorrencia, parcela_atual, total_parcelas FROM admhomefinance.lancamentos_cartao ORDER BY id"),
    pool.query("SELECT lancamento_id, mes FROM admhomefinance.lancamentos_cartao_meses")
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

const saveConfigToDb = async (payload) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE admhomefinance.orcamento_meses, admhomefinance.receitas_meses, admhomefinance.despesas_meses, admhomefinance.cartao_limites_mensais, admhomefinance.cartao_faturas_fechadas, admhomefinance.cartao_meses, admhomefinance.cartao_lancamentos, admhomefinance.lancamentos_cartao_meses, admhomefinance.lancamentos_cartao, admhomefinance.receitas, admhomefinance.despesas, admhomefinance.gastos_predefinidos, admhomefinance.tipos_receita, admhomefinance.categorias, admhomefinance.cartoes, admhomefinance.orcamentos RESTART IDENTITY CASCADE"
    );

    const orcamentoIdMap = new Map();
    for (const orcamento of payload.orcamentos || []) {
      const ano = Number(orcamento.label || orcamento.ano);
      if (!ano) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.orcamentos (ano, ativo) VALUES ($1, $2) RETURNING id",
        [ano, orcamento.ativo !== false]
      );
      const id = result.rows[0].id;
      orcamentoIdMap.set(orcamento.id, id);
      const meses = Array.isArray(orcamento.meses) ? orcamento.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.orcamento_meses (orcamento_id, mes) VALUES ($1, $2)",
          [id, mes]
        );
      }
    }

    const categoriaIdMap = new Map();
    for (const categoria of payload.categorias || []) {
      if (!categoria?.nome || !categoria?.tipo) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.categorias (nome, tipo, ativa) VALUES ($1, $2, $3) RETURNING id",
        [categoria.nome, categoria.tipo, categoria.ativa !== false]
      );
      categoriaIdMap.set(categoria.id, result.rows[0].id);
    }

    const gastoIdMap = new Map();
    for (const gasto of payload.gastosPredefinidos || []) {
      const categoriaId = categoriaIdMap.get(gasto.categoriaId);
      if (!categoriaId || !gasto?.descricao) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.gastos_predefinidos (descricao, categoria_id, ativo) VALUES ($1, $2, $3) RETURNING id",
        [gasto.descricao, categoriaId, gasto.ativo !== false]
      );
      gastoIdMap.set(gasto.id, result.rows[0].id);
    }

    const tipoReceitaIdMap = new Map();
    for (const tipo of payload.tiposReceita || []) {
      if (!tipo?.descricao) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.tipos_receita (descricao, recorrente, ativo) VALUES ($1, $2, $3) RETURNING id",
        [tipo.descricao, Boolean(tipo.recorrente), tipo.ativo !== false]
      );
      tipoReceitaIdMap.set(tipo.id, result.rows[0].id);
    }

    const cartaoIdMap = new Map();
    for (const cartao of payload.cartoes || []) {
      if (!cartao?.nome) continue;
      const result = await client.query(
        "INSERT INTO admhomefinance.cartoes (nome, limite, ativo) VALUES ($1, $2, $3) RETURNING id",
        [cartao.nome, Number(cartao.limite) || 0, cartao.ativo !== false]
      );
      const cartaoId = result.rows[0].id;
      cartaoIdMap.set(cartao.id, cartaoId);
      const limites = cartao.limitesMensais || {};
      for (const [mesNome, limite] of Object.entries(limites)) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.cartao_limites_mensais (cartao_id, mes, limite) VALUES ($1, $2, $3)",
          [cartaoId, mes, Number(limite) || 0]
        );
      }
      const faturasFechadas = Array.isArray(cartao.faturasFechadas) ? cartao.faturasFechadas : [];
      for (const mesNome of faturasFechadas) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.cartao_faturas_fechadas (cartao_id, mes) VALUES ($1, $2)",
          [cartaoId, mes]
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
        "INSERT INTO admhomefinance.receitas (orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
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
          totalParcelas
        ]
      );
      const receitaId = result.rows[0].id;
      const meses = Array.isArray(receita.meses) ? receita.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.receitas_meses (receita_id, mes) VALUES ($1, $2)",
          [receitaId, mes]
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
        "INSERT INTO admhomefinance.despesas (orcamento_id, categoria_id, descricao, complemento, valor, mes_referencia, data, status, tipo_recorrencia, parcela_atual, total_parcelas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
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
          totalParcelas
        ]
      );
      const despesaId = result.rows[0].id;
      const meses = Array.isArray(despesa.meses) ? despesa.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.despesas_meses (despesa_id, mes) VALUES ($1, $2)",
          [despesaId, mes]
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
        "INSERT INTO admhomefinance.lancamentos_cartao (cartao_id, categoria_id, descricao, complemento, valor, data, mes_referencia, tipo_recorrencia, parcela_atual, total_parcelas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
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
          lancamento.totalParcelas || null
        ]
      );
      const lancamentoId = result.rows[0].id;
      const meses = Array.isArray(lancamento.meses) ? lancamento.meses : [];
      for (const mesNome of meses) {
        const mes = monthNameToNumber(mesNome);
        if (!mes) continue;
        await client.query(
          "INSERT INTO admhomefinance.lancamentos_cartao_meses (lancamento_id, mes) VALUES ($1, $2)",
          [lancamentoId, mes]
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

app.get('/api/config', async (req, res) => {
  try {
    const config = await loadConfigFromDb();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to load configuration" });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    await saveConfigToDb(req.body || {});
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
