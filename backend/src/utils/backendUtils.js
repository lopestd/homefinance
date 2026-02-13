const crypto = require("crypto");

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

const monthNumberToName = (num) => MONTHS[num - 1] || "";
const monthNameToNumber = (name) => {
  const idx = MONTHS.indexOf(name);
  return idx >= 0 ? idx + 1 : null;
};

const toId = (value) => (value === null || value === undefined ? value : String(value));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
};

module.exports = {
  MONTHS,
  monthNumberToName,
  monthNameToNumber,
  toId,
  sleep,
  hashToken,
  getRequestIp
};
