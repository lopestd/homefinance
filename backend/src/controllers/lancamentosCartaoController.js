const batchCreateService = require("../services/batchCreateService");

const listLancamentosCartao = async (req, res) => {
  try {
    const lancamentos = await batchCreateService.listLancamentosCartao(req.user.id);
    return res.json(lancamentos);
  } catch (error) {
    return res.status(500).json({ error: "Falha ao carregar lançamentos do cartão." });
  }
};

const createLancamentosCartaoBatch = async (req, res) => {
  try {
    const result = await batchCreateService.createLancamentosCartaoBatch(req.body, req.user.id);
    return res.status(201).json(result);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao criar lançamentos em lote." });
  }
};

const createLancamentoCartao = async (req, res) => {
  try {
    await batchCreateService.createLancamentoCartao(req.body, req.user.id);
    return res.sendStatus(201);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao criar lançamento." });
  }
};

const updateLancamentoCartao = async (req, res) => {
  try {
    await batchCreateService.updateLancamentoCartao(req.params.id, req.body, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao atualizar lançamento." });
  }
};

const deleteLancamentoCartao = async (req, res) => {
  try {
    await batchCreateService.deleteLancamentoCartao(req.params.id, req.user.id);
    return res.sendStatus(204);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: "Falha ao excluir lançamento." });
  }
};

module.exports = {
  listLancamentosCartao,
  createLancamentoCartao,
  updateLancamentoCartao,
  deleteLancamentoCartao,
  createLancamentosCartaoBatch
};
