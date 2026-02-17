const saldoService = require("../services/saldoService");

const errorResponse = (message, error) => {
  const isDev = process.env.NODE_ENV === "development";
  return {
    error: message,
    ...(isDev && { detalhe: error?.message })
  };
};

const getSaldoAcumulado = async (req, res) => {
  const orcamentoId = Number(req.query.orcamentoId);
  const ano = Number(req.query.ano);

  if (Number.isNaN(orcamentoId) || Number.isNaN(ano)) {
    return res.status(400).json({ error: "orcamentoId e ano são obrigatórios" });
  }

  try {
    const result = await saldoService.calcularSaldoAcumulado(req.user.id, orcamentoId, ano);
    return res.json(result);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to load saldo acumulado", error));
  }
};

const updateSaldoInicialOrcamento = async (req, res) => {
  const { orcamentoId, ano, saldoInicial } = req.body || {};
  const parsedOrcamentoId = Number(orcamentoId);
  const parsedAno = Number(ano);
  const parsedSaldoInicial = Number(saldoInicial);

  if (Number.isNaN(parsedOrcamentoId) || Number.isNaN(parsedAno) || Number.isNaN(parsedSaldoInicial)) {
    return res.status(400).json({ error: "orcamentoId, ano e saldoInicial são obrigatórios" });
  }

  try {
    const registro = await saldoService.atualizarSaldoInicialOrcamento(
      req.user.id,
      parsedOrcamentoId,
      parsedAno,
      parsedSaldoInicial
    );
    return res.json({
      id: registro.id,
      orcamentoId: registro.orcamento_id,
      ano: registro.ano,
      saldoInicial: Number(registro.saldo_inicial)
    });
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to update saldo inicial", error));
  }
};

const listSaldosIniciaisOrcamento = async (req, res) => {
  try {
    const registros = await saldoService.listarSaldosIniciaisOrcamento(req.user.id);
    const payload = registros.map((registro) => ({
      id: registro.id,
      orcamentoId: registro.orcamento_id,
      ano: registro.ano,
      saldoInicial: Number(registro.saldo_inicial),
      criadoEm: registro.criado_em,
      atualizadoEm: registro.atualizado_em
    }));
    return res.json(payload);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to load saldo inicial", error));
  }
};

module.exports = {
  getSaldoAcumulado,
  updateSaldoInicialOrcamento,
  listSaldosIniciaisOrcamento
};
