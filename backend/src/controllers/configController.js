const configService = require("../services/configService");
const {
  idParamSchema,
  categoriaSchema,
  gastoPredefinidoSchema,
  tipoReceitaSchema,
  configSchema,
  validate
} = require("../validators/schemas");

// Função auxiliar para respostas de erro seguras
const errorResponse = (message, error) => {
  const isDev = process.env.NODE_ENV === "development";
  return {
    error: message,
    ...(isDev && { detalhe: error?.message })
  };
};

const getConfig = async (req, res) => {
  try {
    const config = await configService.loadConfig(req.user.id);
    return res.json(config);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to load configuration", error));
  }
};

const saveConfig = async (req, res) => {
  const { valid, error, value } = validate(configSchema, req.body);
  if (!valid) {
    return res.status(400).json({ error: `Dados inválidos: ${error}` });
  }
  try {
    await configService.saveConfig(value, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to save configuration", error));
  }
};

const getCategorias = async (req, res) => {
  try {
    const categorias = await configService.listCategorias(req.user.id);
    return res.json(categorias);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to load categories", error));
  }
};

const createCategoria = async (req, res) => {
  const { valid, error, value } = validate(categoriaSchema, req.body);
  if (!valid) {
    return res.status(400).json({ error: `Dados inválidos: ${error}` });
  }
  try {
    const categoria = await configService.createCategoria(value, req.user.id);
    return res.status(201).json(categoria);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json(errorResponse("Failed to create category", error));
  }
};

const updateCategoria = async (req, res) => {
  const { valid: idValid, error: idError } = validate(idParamSchema, req.params);
  if (!idValid) {
    return res.status(400).json({ error: `ID inválido: ${idError}` });
  }
  
  const { valid, error, value } = validate(categoriaSchema, req.body);
  if (!valid) {
    return res.status(400).json({ error: `Dados inválidos: ${error}` });
  }
  try {
    const categoria = await configService.updateCategoria(
      parseInt(req.params.id, 10),
      value,
      req.user.id
    );
    if (!categoria) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    return res.json(categoria);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json(errorResponse("Failed to update category", error));
  }
};

const deleteCategoria = async (req, res) => {
  const { valid: idValid, error: idError } = validate(idParamSchema, req.params);
  if (!idValid) {
    return res.status(400).json({ error: `ID inválido: ${idError}` });
  }
  try {
    const deleted = await configService.deleteCategoria(
      parseInt(req.params.id, 10),
      req.user.id
    );
    if (!deleted) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to delete category", error));
  }
};

const getGastosPredefinidos = async (req, res) => {
  try {
    const gastos = await configService.listGastosPredefinidos(req.user.id);
    return res.json(gastos);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to load default expenses", error));
  }
};

const createGastoPredefinido = async (req, res) => {
  const { valid, error, value } = validate(gastoPredefinidoSchema, req.body);
  if (!valid) {
    return res.status(400).json({ error: `Dados inválidos: ${error}` });
  }
  try {
    const gasto = await configService.createGastoPredefinido(value, req.user.id);
    return res.status(201).json(gasto);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to create default expense", error));
  }
};

const updateGastoPredefinido = async (req, res) => {
  const { valid: idValid, error: idError } = validate(idParamSchema, req.params);
  if (!idValid) {
    return res.status(400).json({ error: `ID inválido: ${idError}` });
  }
  
  const { valid, error, value } = validate(gastoPredefinidoSchema, req.body);
  if (!valid) {
    return res.status(400).json({ error: `Dados inválidos: ${error}` });
  }
  try {
    const gasto = await configService.updateGastoPredefinido(
      parseInt(req.params.id, 10),
      value,
      req.user.id
    );
    if (!gasto) {
      return res.status(404).json({ error: "Gasto pré-definido não encontrado" });
    }
    return res.json(gasto);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to update default expense", error));
  }
};

const deleteGastoPredefinido = async (req, res) => {
  const { valid: idValid, error: idError } = validate(idParamSchema, req.params);
  if (!idValid) {
    return res.status(400).json({ error: `ID inválido: ${idError}` });
  }
  try {
    const deleted = await configService.deleteGastoPredefinido(
      parseInt(req.params.id, 10),
      req.user.id
    );
    if (!deleted) {
      return res.status(404).json({ error: "Gasto pré-definido não encontrado" });
    }
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to delete default expense", error));
  }
};

const getTiposReceita = async (req, res) => {
  try {
    const tipos = await configService.listTiposReceita(req.user.id);
    return res.json(tipos);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to load income types", error));
  }
};

const createTipoReceita = async (req, res) => {
  const { valid, error, value } = validate(tipoReceitaSchema, req.body);
  if (!valid) {
    return res.status(400).json({ error: `Dados inválidos: ${error}` });
  }
  try {
    const tipo = await configService.createTipoReceita(value, req.user.id);
    return res.status(201).json(tipo);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to create income type", error));
  }
};

const updateTipoReceita = async (req, res) => {
  const { valid: idValid, error: idError } = validate(idParamSchema, req.params);
  if (!idValid) {
    return res.status(400).json({ error: `ID inválido: ${idError}` });
  }
  
  const { valid, error, value } = validate(tipoReceitaSchema, req.body);
  if (!valid) {
    return res.status(400).json({ error: `Dados inválidos: ${error}` });
  }
  try {
    const tipo = await configService.updateTipoReceita(
      parseInt(req.params.id, 10),
      value,
      req.user.id
    );
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de receita não encontrado" });
    }
    return res.json(tipo);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to update income type", error));
  }
};

const deleteTipoReceita = async (req, res) => {
  const { valid: idValid, error: idError } = validate(idParamSchema, req.params);
  if (!idValid) {
    return res.status(400).json({ error: `ID inválido: ${idError}` });
  }
  try {
    const deleted = await configService.deleteTipoReceita(
      parseInt(req.params.id, 10),
      req.user.id
    );
    if (!deleted) {
      return res.status(404).json({ error: "Tipo de receita não encontrado" });
    }
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json(errorResponse("Failed to delete income type", error));
  }
};

module.exports = {
  getConfig,
  saveConfig,
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getGastosPredefinidos,
  createGastoPredefinido,
  updateGastoPredefinido,
  deleteGastoPredefinido,
  getTiposReceita,
  createTipoReceita,
  updateTipoReceita,
  deleteTipoReceita
};
