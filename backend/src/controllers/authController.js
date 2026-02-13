const authService = require("../services/authService");

const register = async (req, res) => {
  try {
    const result = await authService.register({ ...req.body, req });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login({ ...req.body, req });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
};

const logout = async (req, res) => {
  try {
    const result = await authService.logout({
      userId: req.user.id,
      tokenHash: req.tokenHash,
      req
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
};

const verify = async (req, res) => {
  return res.json({
    valido: true,
    usuario: { id: req.user.id, nome: req.user.nome, email: req.user.email }
  });
};

const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword({
      userId: req.user.id,
      senhaAtual: req.body?.senhaAtual,
      novaSenha: req.body?.novaSenha,
      confirmarNovaSenha: req.body?.confirmarNovaSenha,
      req
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "ERRO_INTERNO" });
  }
};

module.exports = {
  register,
  login,
  logout,
  verify,
  changePassword
};
