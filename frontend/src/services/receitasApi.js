import api from "./api";

const loadReceitasFromApi = async () => {
  const response = await api.get("/receitas");
  return Array.isArray(response?.data) ? response.data : [];
};

const createReceita = async (payload) => {
  await api.post("/receitas", payload);
};

const createReceitasBatch = async (payload) => {
  await api.post("/receitas/lote", payload);
};

const updateReceita = async (id, payload) => {
  await api.put(`/receitas/${id}`, payload);
};

const updateReceitaStatus = async (id, status) => {
  await api.put(`/receitas/${id}/status`, { status });
};

const deleteReceita = async (id) => {
  await api.delete(`/receitas/${id}`);
};

export {
  loadReceitasFromApi,
  createReceita,
  createReceitasBatch,
  updateReceita,
  updateReceitaStatus,
  deleteReceita
};
