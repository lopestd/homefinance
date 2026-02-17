const authRoutes = require("./authRoutes");
const configRoutes = require("./configRoutes");
const saldoRoutes = require("./saldoRoutes");

const registerRoutes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/config", configRoutes);
  app.use("/api", saldoRoutes);
};

module.exports = {
  registerRoutes
};
