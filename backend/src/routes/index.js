const authRoutes = require("./authRoutes");
const configRoutes = require("./configRoutes");

const registerRoutes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/config", configRoutes);
};

module.exports = {
  registerRoutes
};
