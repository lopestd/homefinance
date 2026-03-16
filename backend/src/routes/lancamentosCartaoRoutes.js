const express = require("express");
const authenticate = require("../middlewares/authenticate");
const lancamentosCartaoController = require("../controllers/lancamentosCartaoController");

const router = express.Router();

router.get("/lancamentos-cartao", authenticate, lancamentosCartaoController.listLancamentosCartao);
router.post("/lancamentos-cartao", authenticate, lancamentosCartaoController.createLancamentoCartao);
router.post("/lancamentos-cartao/lote", authenticate, lancamentosCartaoController.createLancamentosCartaoBatch);
router.put("/lancamentos-cartao/:id", authenticate, lancamentosCartaoController.updateLancamentoCartao);
router.delete("/lancamentos-cartao/:id", authenticate, lancamentosCartaoController.deleteLancamentoCartao);

module.exports = router;
