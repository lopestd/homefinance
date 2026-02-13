import api from "./api";

const loadConfigFromApi = async () => {
  try {
    const [configResponse, categoriasResponse, gastosResponse, tiposResponse] = await Promise.all([
      api.get("/config"),
      api.get("/config/categorias"),
      api.get("/config/gastos-predefinidos"),
      api.get("/config/tipos-receita")
    ]);
    const data = configResponse.data;
    return {
      categorias: Array.isArray(categoriasResponse?.data) ? categoriasResponse.data : [],
      gastosPredefinidos: Array.isArray(gastosResponse?.data) ? gastosResponse.data : [],
      tiposReceita: Array.isArray(tiposResponse?.data) ? tiposResponse.data : [],
      receitas: Array.isArray(data?.receitas) ? data.receitas : [],
      despesas: Array.isArray(data?.despesas) ? data.despesas : [],
      orcamentos: Array.isArray(data?.orcamentos) ? data.orcamentos : [],
      cartoes: Array.isArray(data?.cartoes) ? data.cartoes : [],
      lancamentosCartao: Array.isArray(data?.lancamentosCartao) ? data.lancamentosCartao : []
    };
  } catch (error) {
    if (error?.response?.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    return null;
  }
};

const persistConfigToApi = async (payload) => {
  try {
    await api.put("/config", payload);
  } catch (error) {
    if (error?.response?.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    const message =
      error?.response?.data?.detalhe ||
      error?.response?.data?.error ||
      "Falha ao salvar configurações.";
    throw new Error(message);
  }
};

const persistPartialConfigToApi = async (payload) => {
  return persistConfigToApi({ ...(payload || {}), _partial: true });
};

const handleConfigError = (error, fallbackMessage) => {
  if (error?.response?.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  const message =
    error?.response?.data?.detalhe ||
    error?.response?.data?.error ||
    fallbackMessage;
  throw new Error(message);
};

const loadCategoriasFromApi = async () => {
  try {
    const response = await api.get("/config/categorias");
    return Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    handleConfigError(error, "Falha ao carregar categorias.");
  }
};

const createCategoria = async (payload) => {
  try {
    const response = await api.post("/config/categorias", payload);
    return response.data;
  } catch (error) {
    handleConfigError(error, "Falha ao criar categoria.");
  }
};

const updateCategoria = async (id, payload) => {
  try {
    const response = await api.put(`/config/categorias/${id}`, payload);
    return response.data;
  } catch (error) {
    handleConfigError(error, "Falha ao atualizar categoria.");
  }
};

const deleteCategoria = async (id) => {
  try {
    await api.delete(`/config/categorias/${id}`);
  } catch (error) {
    handleConfigError(error, "Falha ao excluir categoria.");
  }
};

const loadGastosPredefinidosFromApi = async () => {
  try {
    const response = await api.get("/config/gastos-predefinidos");
    return Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    handleConfigError(error, "Falha ao carregar gastos pré-definidos.");
  }
};

const createGastoPredefinido = async (payload) => {
  try {
    const response = await api.post("/config/gastos-predefinidos", payload);
    return response.data;
  } catch (error) {
    handleConfigError(error, "Falha ao criar gasto pré-definido.");
  }
};

const updateGastoPredefinido = async (id, payload) => {
  try {
    const response = await api.put(`/config/gastos-predefinidos/${id}`, payload);
    return response.data;
  } catch (error) {
    handleConfigError(error, "Falha ao atualizar gasto pré-definido.");
  }
};

const deleteGastoPredefinido = async (id) => {
  try {
    await api.delete(`/config/gastos-predefinidos/${id}`);
  } catch (error) {
    handleConfigError(error, "Falha ao excluir gasto pré-definido.");
  }
};

const loadTiposReceitaFromApi = async () => {
  try {
    const response = await api.get("/config/tipos-receita");
    return Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    handleConfigError(error, "Falha ao carregar tipos de receita.");
  }
};

const createTipoReceita = async (payload) => {
  try {
    const response = await api.post("/config/tipos-receita", payload);
    return response.data;
  } catch (error) {
    handleConfigError(error, "Falha ao criar tipo de receita.");
  }
};

const updateTipoReceita = async (id, payload) => {
  try {
    const response = await api.put(`/config/tipos-receita/${id}`, payload);
    return response.data;
  } catch (error) {
    handleConfigError(error, "Falha ao atualizar tipo de receita.");
  }
};

const deleteTipoReceita = async (id) => {
  try {
    await api.delete(`/config/tipos-receita/${id}`);
  } catch (error) {
    handleConfigError(error, "Falha ao excluir tipo de receita.");
  }
};

export {
  loadConfigFromApi,
  persistConfigToApi,
  persistPartialConfigToApi,
  loadCategoriasFromApi,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  loadGastosPredefinidosFromApi,
  createGastoPredefinido,
  updateGastoPredefinido,
  deleteGastoPredefinido,
  loadTiposReceitaFromApi,
  createTipoReceita,
  updateTipoReceita,
  deleteTipoReceita
};
