const { getResumoMes } = require("../modules/dashboard");

const DashboardService = {
  getResumoMes: async (input) => {
    return getResumoMes(input);
  }
};

module.exports = {
  DashboardService
};
