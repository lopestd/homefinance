const {
  createCartao,
  createLancamentoCartao,
  listFaturaMes
} = require("../modules/cartao");

const CartaoService = {
  createCartao: async (input) => {
    return createCartao(input);
  },
  createLancamentoCartao: async (input) => {
    return createLancamentoCartao(input);
  },
  listFaturaMes: async (input) => {
    return listFaturaMes(input);
  }
};

module.exports = {
  CartaoService
};
