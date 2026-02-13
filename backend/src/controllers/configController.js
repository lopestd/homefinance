const configService = require("../services/configService");

const getConfig = async (req, res) => {
  try {
    const config = await configService.loadConfig(req.user.id);
    return res.json(config);
  } catch (error) {
    console.error("GET /api/config failed", error);
    return res.status(500).json({ error: "Failed to load configuration", detalhe: error?.message || "Erro interno" });
  }
};

const saveConfig = async (req, res) => {
  try {
    await configService.saveConfig(req.body || {}, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    console.error("PUT /api/config failed", error);
    return res.status(500).json({ error: "Failed to save configuration", detalhe: error?.message || "Erro interno" });
  }
};

const getCategorias = async (req, res) => {
  try {
    const categorias = await configService.listCategorias(req.user.id);
    return res.json(categorias);
  } catch (error) {
    console.error("GET /api/config/categorias failed", error);
    return res.status(500).json({ error: "Failed to load categories", detalhe: error?.message || "Erro interno" });
  }
};

const createCategoria = async (req, res) => {
  const nome = req.body?.nome?.trim();
  const tipo = req.body?.tipo;
  if (!nome || !tipo) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    const categoria = await configService.createCategoria({ nome, tipo }, req.user.id);
    return res.status(201).json(categoria);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("POST /api/config/categorias failed", error);
    return res.status(500).json({ error: "Failed to create category", detalhe: error?.message || "Erro interno" });
  }
};

const updateCategoria = async (req, res) => {
  const nome = req.body?.nome?.trim();
  const tipo = req.body?.tipo;
  if (!nome || !tipo) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    const categoria = await configService.updateCategoria(req.params.id, { nome, tipo }, req.user.id);
    if (!categoria) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    return res.json(categoria);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error("PUT /api/config/categorias failed", error);
    return res.status(500).json({ error: "Failed to update category", detalhe: error?.message || "Erro interno" });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const deleted = await configService.deleteCategoria(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error("DELETE /api/config/categorias failed", error);
    return res.status(500).json({ error: "Failed to delete category", detalhe: error?.message || "Erro interno" });
  }
};

const getGastosPredefinidos = async (req, res) => {
  try {
    const gastos = await configService.listGastosPredefinidos(req.user.id);
    return res.json(gastos);
  } catch (error) {
    console.error("GET /api/config/gastos-predefinidos failed", error);
    return res.status(500).json({ error: "Failed to load default expenses", detalhe: error?.message || "Erro interno" });
  }
};

const createGastoPredefinido = async (req, res) => {
  const descricao = req.body?.descricao?.trim();
  const categoriaId = req.body?.categoriaId;
  if (!descricao || !categoriaId) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    const gasto = await configService.createGastoPredefinido({ descricao, categoriaId }, req.user.id);
    return res.status(201).json(gasto);
  } catch (error) {
    console.error("POST /api/config/gastos-predefinidos failed", error);
    return res.status(500).json({ error: "Failed to create default expense", detalhe: error?.message || "Erro interno" });
  }
};

const updateGastoPredefinido = async (req, res) => {
  const descricao = req.body?.descricao?.trim();
  const categoriaId = req.body?.categoriaId;
  if (!descricao || !categoriaId) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    const gasto = await configService.updateGastoPredefinido(
      req.params.id,
      { descricao, categoriaId },
      req.user.id
    );
    if (!gasto) {
      return res.status(404).json({ error: "Gasto pré-definido não encontrado" });
    }
    return res.json(gasto);
  } catch (error) {
    console.error("PUT /api/config/gastos-predefinidos failed", error);
    return res.status(500).json({ error: "Failed to update default expense", detalhe: error?.message || "Erro interno" });
  }
};

const deleteGastoPredefinido = async (req, res) => {
  try {
    const deleted = await configService.deleteGastoPredefinido(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: "Gasto pré-definido não encontrado" });
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error("DELETE /api/config/gastos-predefinidos failed", error);
    return res.status(500).json({ error: "Failed to delete default expense", detalhe: error?.message || "Erro interno" });
  }
};

const getTiposReceita = async (req, res) => {
  try {
    const tipos = await configService.listTiposReceita(req.user.id);
    return res.json(tipos);
  } catch (error) {
    console.error("GET /api/config/tipos-receita failed", error);
    return res.status(500).json({ error: "Failed to load income types", detalhe: error?.message || "Erro interno" });
  }
};

const createTipoReceita = async (req, res) => {
  const descricao = req.body?.descricao?.trim();
  if (!descricao) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    const tipo = await configService.createTipoReceita(
      { descricao, recorrente: req.body?.recorrente },
      req.user.id
    );
    return res.status(201).json(tipo);
  } catch (error) {
    console.error("POST /api/config/tipos-receita failed", error);
    return res.status(500).json({ error: "Failed to create income type", detalhe: error?.message || "Erro interno" });
  }
};

const updateTipoReceita = async (req, res) => {
  const descricao = req.body?.descricao?.trim();
  if (!descricao) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    const tipo = await configService.updateTipoReceita(
      req.params.id,
      { descricao, recorrente: req.body?.recorrente },
      req.user.id
    );
    if (!tipo) {
      return res.status(404).json({ error: "Tipo de receita não encontrado" });
    }
    return res.json(tipo);
  } catch (error) {
    console.error("PUT /api/config/tipos-receita failed", error);
    return res.status(500).json({ error: "Failed to update income type", detalhe: error?.message || "Erro interno" });
  }
};

const deleteTipoReceita = async (req, res) => {
  try {
    const deleted = await configService.deleteTipoReceita(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: "Tipo de receita não encontrado" });
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error("DELETE /api/config/tipos-receita failed", error);
    return res.status(500).json({ error: "Failed to delete income type", detalhe: error?.message || "Erro interno" });
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
