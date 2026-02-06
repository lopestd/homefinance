const {
  createReceita,
  createReceitaRecorrente,
  setReceitaRecebida,
  listReceitasPorMes
} = require("../modules/receitas");

const ReceitasService = {
  createReceita: async (input) => {
    return createReceita(input);
  },
  createReceitaRecorrente: async (input) => {
    return createReceitaRecorrente(input);
  },
  setReceitaRecebida: async (input) => {
    return setReceitaRecebida(input);
  },
  listReceitasPorMes: async (input) => {
    return listReceitasPorMes(input);
  }
};

module.exports = {
  ReceitasService
};
