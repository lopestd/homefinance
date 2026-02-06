const {
  createDespesa,
  createDespesaFromGastoPredefinido,
  setDespesaPaga,
  listDespesasPorMes
} = require("../modules/despesas");

const DespesasService = {
  createDespesa: async (input) => {
    return createDespesa(input);
  },
  createDespesaFromGastoPredefinido: async (input) => {
    return createDespesaFromGastoPredefinido(input);
  },
  setDespesaPaga: async (input) => {
    return setDespesaPaga(input);
  },
  listDespesasPorMes: async (input) => {
    return listDespesasPorMes(input);
  }
};

module.exports = {
  DespesasService
};
