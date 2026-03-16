const despesasService = require("../services/despesasService");

const listDespesas = async (req, res) => {
  try {
    const despesas = await despesasService.listDespesas(req.user.id);
    return res.json(despesas);
  } catch (error) {
    return res.status(500).json({ error: "Falha ao carregar despesas." });
  }
};

const createDespesa = async (req, res) => {
  try {
    await despesasService.createDespesa(req.body, req.user.id);
    return res.sendStatus(201);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao criar despesa." });
  }
};

const createDespesasBatch = async (req, res) => {
  try {
    const result = await despesasService.createDespesasBatch(req.body, req.user.id);
    return res.status(201).json(result);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao criar despesas em lote." });
  }
};

const updateDespesa = async (req, res) => {
  try {
    await despesasService.updateDespesa(req.params.id, req.body, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao atualizar despesa." });
  }
};

const updateDespesaStatus = async (req, res) => {
  try {
    await despesasService.updateDespesaStatus(req.params.id, req.body?.status, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao atualizar status da despesa." });
  }
};

const deleteDespesa = async (req, res) => {
  try {
    await despesasService.deleteDespesa(req.params.id, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao excluir despesa." });
  }
};

module.exports = {
  listDespesas,
  createDespesa,
  createDespesasBatch,
  updateDespesa,
  updateDespesaStatus,
  deleteDespesa
};
