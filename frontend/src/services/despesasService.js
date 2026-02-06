import {
  createDespesa,
  createDespesaFromGastoPredefinido,
  setDespesaPaga,
  listDespesasPorMes
} from "../mocks/despesasMock";

const DespesasService = {
  createDespesa: async (input) => {
    return createDespesa(input);
  },
  createDespesaFromGastoPredefinido: async (input) => {
    return createDespesaFromGastoPredefinido(input);
  },
  setDespesaPaga: async (input) => {
    return setDespesaPaga(input);
  },
  listDespesasPorMes: async (input) => {
    return listDespesasPorMes(input);
  }
};

export { DespesasService };
