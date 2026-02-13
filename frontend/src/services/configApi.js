import api from "./api";

const loadConfigFromApi = async () => {
  try {
    const response = await api.get("/config");
    const data = response.data;
    return {
      categorias: Array.isArray(data?.categorias) ? data.categorias : [],
      gastosPredefinidos: Array.isArray(data?.gastosPredefinidos) ? data.gastosPredefinidos : [],
      tiposReceita: Array.isArray(data?.tiposReceita) ? data.tiposReceita : [],
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

export { loadConfigFromApi, persistConfigToApi };
