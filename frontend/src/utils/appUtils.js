const MONTHS_ORDER = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const getCurrentMonthName = () => {
  return MONTHS_ORDER[new Date().getMonth()];
};

const calculateDateForMonth = (monthName, baseDate) => {
  if (!monthName || !baseDate) return baseDate;
  
  const monthIndex = MONTHS_ORDER.indexOf(monthName);
  if (monthIndex === -1) return baseDate;
  
  const [year, month, day] = baseDate.split('-').map(Number);
  if (!year || !month || !day) return baseDate;
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  let targetYear = currentYear;
  const targetMonth = monthIndex;
  
  if (targetMonth < currentMonth) {
    targetYear = currentYear + 1;
  }
  
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const adjustedDay = Math.min(day, lastDayOfTargetMonth);
  
  const targetDate = new Date(targetYear, targetMonth, adjustedDay);
  return targetDate.toISOString().slice(0, 10);
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
  calculateDateForMonth,
  formatCurrency,
  createId,
  EMAIL_REGEX,
  getStoredToken,
  saveStoredToken,
  clearStoredToken
};
