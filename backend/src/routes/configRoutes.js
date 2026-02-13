const express = require("express");
const configController = require("../controllers/configController");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.get("/", authenticate, configController.getConfig);
router.put("/", authenticate, configController.saveConfig);
router.get("/categorias", authenticate, configController.getCategorias);
router.post("/categorias", authenticate, configController.createCategoria);
router.put("/categorias/:id", authenticate, configController.updateCategoria);
router.delete("/categorias/:id", authenticate, configController.deleteCategoria);
router.get("/gastos-predefinidos", authenticate, configController.getGastosPredefinidos);
router.post("/gastos-predefinidos", authenticate, configController.createGastoPredefinido);
router.put("/gastos-predefinidos/:id", authenticate, configController.updateGastoPredefinido);
router.delete("/gastos-predefinidos/:id", authenticate, configController.deleteGastoPredefinido);
router.get("/tipos-receita", authenticate, configController.getTiposReceita);
router.post("/tipos-receita", authenticate, configController.createTipoReceita);
router.put("/tipos-receita/:id", authenticate, configController.updateTipoReceita);
router.delete("/tipos-receita/:id", authenticate, configController.deleteTipoReceita);

module.exports = router;
