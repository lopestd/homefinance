const express = require("express");
const authController = require("../controllers/authController");
const authenticate = require("../middlewares/authenticate");
const { authLimiter } = require("../middlewares/rateLimiters");

const router = express.Router();

router.post("/registrar", authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/verificar", authenticate, authController.verify);
router.post("/alterar-senha", authenticate, authController.changePassword);

module.exports = router;
