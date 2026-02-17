import api from "./api";

const handleSaldoError = (error, fallbackMessage) => {
  if (error?.response?.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  const message =
    error?.response?.data?.detalhe ||
    error?.response?.data?.error ||
    fallbackMessage;
  throw new Error(message);
};

const getSaldoAcumulado = async (orcamentoId, ano) => {
  try {
    const response = await api.get("/saldo-acumulado", {
      params: { orcamentoId, ano }
    });
    return response.data;
  } catch (error) {
    handleSaldoError(error, "Falha ao carregar saldo acumulado.");
  }
};

const updateSaldoInicialOrcamento = async (orcamentoId, ano, saldoInicial) => {
  try {
    const response = await api.put("/saldo-inicial-orcamento", {
      orcamentoId,
      ano,
      saldoInicial
    });
    return response.data;
  } catch (error) {
    handleSaldoError(error, "Falha ao salvar saldo inicial.");
  }
};

const listSaldosIniciaisOrcamento = async () => {
  try {
    const response = await api.get("/saldo-inicial-orcamento");
    return Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    handleSaldoError(error, "Falha ao carregar saldos iniciais.");
  }
};

export {
  getSaldoAcumulado,
  updateSaldoInicialOrcamento,
  listSaldosIniciaisOrcamento
};
