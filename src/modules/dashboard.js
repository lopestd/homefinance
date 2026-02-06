const { resumoMensal, relatorioPorPeriodo } = require("../services/contracts");
const { loadStore } = require("../storage/fileStore");

const assert = (c, m) => {
  if (!c) throw new Error(m);
};

const obterResumoMensal = async ({ id_orcamento_mes }) => {
  return resumoMensal({ id_orcamento_mes });
};

const obterResumoPeriodo = async ({ id_orcamento }) => {
  return relatorioPorPeriodo({ id_orcamento });
};

const getResumoMes = async ({ orcamentoId, mes }) => {
  assert(Number.isInteger(mes), "Mês inválido");
  assert(mes >= 1 && mes <= 12, "Mês fora de faixa");
  const store = await loadStore();
  const orcamento = store.orcamentos.find((o) => o.id_orcamento === orcamentoId);
  assert(orcamento, "Orçamento inexistente");
  const orcamentoMes = store.orcamentoMeses.find(
    (m) => m.id_orcamento === orcamentoId && m.mes === mes
  );
  assert(orcamentoMes, "Mês não pertence ao orçamento");
  const resumo = await resumoMensal({ id_orcamento_mes: orcamentoMes.id_orcamento_mes });
  return {
    receitas: {
      totalLancado: resumo.totalReceitasLancadas,
      totalRecebido: resumo.totalReceitasRecebidas
    },
    despesas: {
      totalLancado: resumo.totalDespesasLancadas,
      totalPago: resumo.totalDespesasPagas
    },
    cartao: {
      totalFatura: resumo.totalCartao
    },
    saldoMes: resumo.saldoMes
  };
};

module.exports = {
  getResumoMes,
  obterResumoMensal,
  obterResumoPeriodo
};
