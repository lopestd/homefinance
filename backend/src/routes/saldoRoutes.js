const express = require("express");
const saldoController = require("../controllers/saldoController");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.get("/saldo-acumulado", authenticate, saldoController.getSaldoAcumulado);
router.put("/saldo-inicial-orcamento", authenticate, saldoController.updateSaldoInicialOrcamento);
router.get("/saldo-inicial-orcamento", authenticate, saldoController.listSaldosIniciaisOrcamento);

module.exports = router;
