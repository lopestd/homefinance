const rateLimit = require("express-rate-limit");

// Rate limiter para autenticação (login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    erro: "RATE_LIMIT",
    mensagem: "Muitas tentativas. Tente novamente mais tarde."
  }
});

// Rate limiter geral para API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições. Tente novamente mais tarde."
  }
});

// Rate limiter para operações de escrita (POST, PUT, DELETE)
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 operações de escrita por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas operações. Tente novamente mais tarde."
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  writeLimiter
};
