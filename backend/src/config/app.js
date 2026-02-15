const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { registerRoutes } = require("../routes");
const { apiLimiter } = require("../middlewares/rateLimiters");

const createApp = () => {
  const app = express();

  // Configuração de CORS com restrições de origem
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim());

  app.use(cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (mobile apps, postman, etc)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origem não permitida pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(helmet());
  app.use(express.json({ limit: process.env.PAYLOAD_LIMIT || "1mb" }));
  
  // Rate limiter geral para todas as rotas da API
  app.use("/api", apiLimiter);

  registerRoutes(app);

  const frontendDistPath = path.join(__dirname, "..", "..", "..", "frontend", "dist");
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });

  return app;
};

module.exports = {
  createApp
};
