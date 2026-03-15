const express = require("express");
const authenticate = require("../middlewares/authenticate");
const despesasController = require("../controllers/despesasController");

const router = express.Router();

router.get("/despesas", authenticate, despesasController.listDespesas);
router.post("/despesas", authenticate, despesasController.createDespesa);
router.put("/despesas/:id", authenticate, despesasController.updateDespesa);
router.put("/despesas/:id/status", authenticate, despesasController.updateDespesaStatus);
router.delete("/despesas/:id", authenticate, despesasController.deleteDespesa);

module.exports = router;
