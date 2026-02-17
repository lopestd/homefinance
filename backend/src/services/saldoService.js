const saldoRepository = require("../repositories/saldoRepository");
const { monthNumberToName } = require("../utils/backendUtils");

const buildMonthlyMap = (items, validMonths) => {
  const map = new Map();
  items.forEach((item) => {
    const valor = Number(item.valor) || 0;
    const mesesRaw = Array.isArray(item.meses) ? item.meses : [];
    const mesesBase = mesesRaw.length > 0 ? mesesRaw : [item.mes_referencia];
    const meses = mesesBase
      .map((mes) => Number(mes))
      .filter((mes) => Number.isFinite(mes) && validMonths.has(mes));
    if (meses.length === 0) {
      return;
    }
    const valorPorMes = valor / meses.length;
    meses.forEach((mes) => {
      map.set(mes, (map.get(mes) || 0) + valorPorMes);
    });
  });
  return map;
};

const calcularSaldoAcumulado = async (userId, orcamentoId, ano) => {
  const [saldoInicialOrcamento, mesesOrcamento] = await Promise.all([
    saldoRepository.getSaldoInicialOrcamento(userId, orcamentoId, ano),
    saldoRepository.getOrcamentoMeses(userId, orcamentoId)
  ]);

  if (!mesesOrcamento || mesesOrcamento.length === 0) {
    return { orcamentoId, ano, saldos: [] };
  }

  const mesesOrdenados = [...mesesOrcamento].sort((a, b) => a - b);
  const mesesSet = new Set(mesesOrdenados);

  const [receitas, despesas] = await Promise.all([
    saldoRepository.listReceitasRecebidas(userId, orcamentoId),
    saldoRepository.listDespesasPagas(userId, orcamentoId)
  ]);

  const receitasPorMes = buildMonthlyMap(receitas, mesesSet);
  const despesasPorMes = buildMonthlyMap(despesas, mesesSet);

  const saldos = [];
  let saldoAnterior = saldoInicialOrcamento;

  mesesOrdenados.forEach((mes, index) => {
    const saldoInicial = index === 0 ? saldoInicialOrcamento : saldoAnterior;
    const receitasRecebidas = receitasPorMes.get(mes) || 0;
    const despesasPagas = despesasPorMes.get(mes) || 0;
    const saldoFinal = saldoInicial + receitasRecebidas - despesasPagas;
    saldos.push({
      mes,
      mesNome: monthNumberToName(mes),
      saldoInicial,
      receitasRecebidas,
      despesasPagas,
      saldoFinal
    });
    saldoAnterior = saldoFinal;
  });

  return { orcamentoId, ano, saldos };
};

const atualizarSaldoInicialOrcamento = async (userId, orcamentoId, ano, saldoInicial) => {
  return saldoRepository.upsertSaldoInicialOrcamento(userId, orcamentoId, ano, saldoInicial);
};

const listarSaldosIniciaisOrcamento = async (userId) => {
  return saldoRepository.listSaldosIniciaisOrcamento(userId);
};

module.exports = {
  calcularSaldoAcumulado,
  atualizarSaldoInicialOrcamento,
  listarSaldosIniciaisOrcamento
};
