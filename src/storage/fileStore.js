const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");
const tempPath = path.join(dataDir, "store.tmp.json");

const createEmptyStore = () => ({
  meta: {
    version: 1,
    lastIds: {
      orcamento: 0,
      orcamentoMes: 0,
      categoria: 0,
      gastoPredefinido: 0,
      tipoReceita: 0,
      receita: 0,
      despesa: 0,
      cartao: 0,
      cartaoMes: 0,
      cartaoLancamento: 0
    }
  },
  orcamentos: [],
  orcamentoMeses: [],
  categorias: [],
  gastosPredefinidos: [],
  tiposReceita: [],
  receitas: [],
  despesas: [],
  cartoes: [],
  cartaoMeses: [],
  cartaoLancamentos: []
});

const allocateId = (store, key) => {
  if (!store.meta || !store.meta.lastIds) {
    store.meta = createEmptyStore().meta;
  }
  const current = store.meta.lastIds[key] ?? 0;
  const next = current + 1;
  store.meta.lastIds[key] = next;
  return next;
};

const loadStore = async () => {
  try {
    const raw = await fs.readFile(storePath, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return createEmptyStore();
    }
    throw error;
  }
};

const saveStore = async (store) => {
  await fs.mkdir(dataDir, { recursive: true });
  const payload = JSON.stringify(store, null, 2);
  await fs.writeFile(tempPath, payload, "utf-8");
  await fs.rename(tempPath, storePath);
};

module.exports = {
  createEmptyStore,
  allocateId,
  loadStore,
  saveStore,
  storePath
};
