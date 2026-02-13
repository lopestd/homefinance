import { useState } from "react";
import { EMAIL_REGEX } from "../utils/appUtils";

const LoginScreen = ({ onLogin, loading, errorMessage }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    if (!EMAIL_REGEX.test(email.trim())) {
      setLocalError("Informe um email válido.");
      return;
    }
    if (!senha) {
      setLocalError("Informe sua senha.");
      return;
    }
    const result = await onLogin({
      email: email.trim(),
      senha,
      lembrar
    });
    if (result?.erro) {
      setLocalError(result.erro);
      return;
    }
    if (result?.ok) {
      window.location.hash = "dashboard";
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">HomeFinance</span>
          <h1>Controle financeiro simples</h1>
          <p>Organize receitas, despesas e cartões em um painel leve e responsivo.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              placeholder="voce@email.com"
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="auth-field auth-field--password">
            <span>Senha</span>
            <div className="auth-input">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                placeholder="Sua senha"
                onChange={(event) => setSenha(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setMostrarSenha((prev) => !prev)}
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(event) => setLembrar(event.target.checked)}
            />
            <span>Lembrar de mim</span>
          </label>
          {(localError || errorMessage) && (
            <div className="auth-error">{localError || errorMessage}</div>
          )}
          <button type="submit" className="primary auth-submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export { LoginScreen };
