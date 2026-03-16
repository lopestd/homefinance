import api from "./api";

const loadDespesasFromApi = async () => {
  const response = await api.get("/despesas");
  return Array.isArray(response?.data) ? response.data : [];
};

const createDespesa = async (payload) => {
  await api.post("/despesas", payload);
};

const createDespesasBatch = async (payload) => {
  await api.post("/despesas/lote", payload);
};

const updateDespesa = async (id, payload) => {
  await api.put(`/despesas/${id}`, payload);
};

const updateDespesaStatus = async (id, status) => {
  await api.put(`/despesas/${id}/status`, { status });
};

const deleteDespesa = async (id) => {
  await api.delete(`/despesas/${id}`);
};

export {
  loadDespesasFromApi,
  createDespesa,
  createDespesasBatch,
  updateDespesa,
  updateDespesaStatus,
  deleteDespesa
};
