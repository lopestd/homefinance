const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    erro: "RATE_LIMIT",
    mensagem: "Muitas tentativas. Tente novamente mais tarde."
  }
});

module.exports = authLimiter;
