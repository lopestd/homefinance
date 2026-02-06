const { getRelatorioPeriodo } = require("../modules/relatorios");

const RelatoriosService = {
  getRelatorioPeriodo: async (input) => {
    return getRelatorioPeriodo(input);
  }
};

module.exports = {
  RelatoriosService
};
