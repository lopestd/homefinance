const authService = require("../services/authService");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ sucesso: false, erro: "TOKEN_AUSENTE" });
  }
  const result = await authService.validateToken(token);
  if (!result.ok) {
    return res.status(result.status).json({ sucesso: false, erro: result.erro });
  }
  req.user = result.user;
  req.token = token;
  req.tokenHash = result.tokenHash;
  return next();
};

module.exports = authenticate;
