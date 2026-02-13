const MONTHS_ORDER = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const getCurrentMonthName = () => {
  return MONTHS_ORDER[new Date().getMonth()];
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

let idSeed = 0;
const createId = (prefix) => {
  idSeed += 1;
  return `${prefix}-${idSeed}`;
};

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const AUTH_TOKEN_KEY = "hf_token";

const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || "";
const saveStoredToken = (token) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const clearStoredToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

export {
  MONTHS_ORDER,
  getCurrentMonthName,
  formatCurrency,
  createId,
  EMAIL_REGEX,
  getStoredToken,
  saveStoredToken,
  clearStoredToken
};
