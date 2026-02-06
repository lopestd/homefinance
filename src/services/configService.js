const {
  createCategoria,
  updateCategoria,
  listCategorias,
  createGastoPredefinido,
  updateGastoPredefinido,
  listGastosPredefinidos,
  createTipoReceita,
  listTiposReceita
} = require("../modules/config");

const ConfigService = {
  createCategoria: async (input) => {
    return createCategoria(input);
  },
  updateCategoria: async (input) => {
    return updateCategoria(input);
  },
  listCategorias: async (input) => {
    return listCategorias(input);
  },
  createGastoPredefinido: async (input) => {
    return createGastoPredefinido(input);
  },
  updateGastoPredefinido: async (input) => {
    return updateGastoPredefinido(input);
  },
  listGastosPredefinidos: async (input) => {
    return listGastosPredefinidos(input);
  },
  createTipoReceita: async (input) => {
    return createTipoReceita(input);
  },
  listTiposReceita: async (input) => {
    return listTiposReceita(input);
  }
};

module.exports = {
  ConfigService
};
