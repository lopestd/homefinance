const express = require("express");
const authenticate = require("../middlewares/authenticate");
const receitasController = require("../controllers/receitasController");

const router = express.Router();

router.get("/receitas", authenticate, receitasController.listReceitas);
router.post("/receitas", authenticate, receitasController.createReceita);
router.post("/receitas/lote", authenticate, receitasController.createReceitasBatch);
router.put("/receitas/:id", authenticate, receitasController.updateReceita);
router.put("/receitas/:id/status", authenticate, receitasController.updateReceitaStatus);
router.delete("/receitas/:id", authenticate, receitasController.deleteReceita);

module.exports = router;
