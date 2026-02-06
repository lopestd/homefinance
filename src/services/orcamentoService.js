const { createOrcamento, getOrcamento } = require("../modules/orcamento");

const OrcamentoService = {
  createOrcamento: async (input) => {
    return createOrcamento(input);
  },
  getOrcamento: async (input) => {
    return getOrcamento(input);
  }
};

module.exports = {
  OrcamentoService
};
