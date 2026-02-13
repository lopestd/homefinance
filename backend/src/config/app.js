const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { registerRoutes } = require("../routes");

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json({ limit: "50mb" }));

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
