import { useMemo, useState } from "react";
import { MONTHS_ORDER, getCurrentMonthName } from "../utils/appUtils";

const useRelatorios = (orcamentos) => {
  const initialOrcamentoId = orcamentos[0]?.id ?? "";
  const [filters, setFilters] = useState({
    orcamentoId: initialOrcamentoId,
    mesInicio: "",
    mesFim: "",
    visao: "Acumulada"
  });

  const effectiveOrcamentoId = filters.orcamentoId || initialOrcamentoId;
  const currentOrcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
  const mesesOrcamento = MONTHS_ORDER.filter((mes) => currentOrcamento?.meses?.includes(mes));
  const defaultMes = useMemo(() => {
    if (mesesOrcamento.length === 0) return "";
    const currentMonth = getCurrentMonthName();
    return mesesOrcamento.includes(currentMonth) ? currentMonth : mesesOrcamento[0];
  }, [mesesOrcamento]);
  const mesInicio = filters.mesInicio && mesesOrcamento.includes(filters.mesInicio) ? filters.mesInicio : defaultMes;
  const mesFim = filters.mesFim && mesesOrcamento.includes(filters.mesFim) ? filters.mesFim : mesInicio;

  const mesesIntervalo = useMemo(() => {
    if (!mesInicio) return [];
    const startIndex = mesesOrcamento.indexOf(mesInicio);
    const endIndex = mesesOrcamento.indexOf(mesFim);
    if (startIndex === -1 || endIndex === -1) return mesInicio ? [mesInicio] : [];
    const from = Math.min(startIndex, endIndex);
    const to = Math.max(startIndex, endIndex);
    return mesesOrcamento.slice(from, to + 1);
  }, [mesInicio, mesFim, mesesOrcamento]);

  const mesesSelecionados = useMemo(() => {
    return filters.visao === "Mensal"
      ? (mesInicio ? [mesInicio] : [])
      : mesesIntervalo;
  }, [filters.visao, mesInicio, mesesIntervalo]);

  return {
    filters,
    setFilters,
    effectiveOrcamentoId,
    mesesOrcamento,
    mesInicio,
    mesFim,
    mesesSelecionados
  };
};

export default useRelatorios;
