import api from "./api";

const loadLancamentosCartaoFromApi = async () => {
  const response = await api.get("/lancamentos-cartao");
  return Array.isArray(response?.data) ? response.data : [];
};

const createLancamentoCartao = async (payload) => {
  await api.post("/lancamentos-cartao", payload);
};

const createLancamentosCartaoBatch = async (payload) => {
  await api.post("/lancamentos-cartao/lote", payload);
};

const updateLancamentoCartao = async (id, payload) => {
  await api.put(`/lancamentos-cartao/${id}`, payload);
};

const deleteLancamentoCartao = async (id) => {
  await api.delete(`/lancamentos-cartao/${id}`);
};

export {
  loadLancamentosCartaoFromApi,
  createLancamentoCartao,
  createLancamentosCartaoBatch,
  updateLancamentoCartao,
  deleteLancamentoCartao
};
