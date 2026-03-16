const batchCreateService = require("../services/batchCreateService");

const listReceitas = async (req, res) => {
  try {
    const receitas = await batchCreateService.listReceitas(req.user.id);
    return res.json(receitas);
  } catch (error) {
    return res.status(500).json({ error: "Falha ao carregar receitas." });
  }
};

const createReceitasBatch = async (req, res) => {
  try {
    const result = await batchCreateService.createReceitasBatch(req.body, req.user.id);
    return res.status(201).json(result);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao criar receitas em lote." });
  }
};

const createReceita = async (req, res) => {
  try {
    await batchCreateService.createReceita(req.body, req.user.id);
    return res.sendStatus(201);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao criar receita." });
  }
};

const updateReceita = async (req, res) => {
  try {
    await batchCreateService.updateReceita(req.params.id, req.body, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao atualizar receita." });
  }
};

const updateReceitaStatus = async (req, res) => {
  try {
    await batchCreateService.updateReceitaStatus(req.params.id, req.body?.status, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao atualizar status da receita." });
  }
};

const deleteReceita = async (req, res) => {
  try {
    await batchCreateService.deleteReceita(req.params.id, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao excluir receita." });
  }
};

module.exports = {
  listReceitas,
  createReceita,
  createReceitasBatch,
  updateReceita,
  updateReceitaStatus,
  deleteReceita
};
