const { relatorioPorPeriodo } = require("../services/contracts");

const obterRelatorioPeriodo = async ({ id_orcamento }) => {
  return relatorioPorPeriodo({ id_orcamento });
};

const getRelatorioPeriodo = async ({ orcamentoId }) => {
  const relatorio = await relatorioPorPeriodo({ id_orcamento: orcamentoId });
  const meses = relatorio.totaisPorMes.map((item) => ({
    mes: item.mes,
    receitas: {
      lancado: item.receitasLancadas,
      recebido: item.receitasRecebidas
    },
    despesas: {
      lancado: item.despesasLancadas,
      pago: item.despesasPagas
    },
    cartao: item.cartaoLancado,
    saldo: item.saldoMes
  }));
  return { meses };
};

module.exports = {
  getRelatorioPeriodo,
  obterRelatorioPeriodo
};
