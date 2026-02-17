import { useCallback, useEffect, useState } from "react";
import { MONTHS_ORDER } from "../utils/appUtils";
import {
  getSaldoAcumulado,
  updateSaldoInicialOrcamento
} from "../services/saldoApi";

const useSaldoAcumulado = (orcamentoId, ano) => {
  const [saldos, setSaldos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSaldos = useCallback(async () => {
    const parsedAno = Number(ano);
    if (orcamentoId === null || orcamentoId === undefined || orcamentoId === "" || Number.isNaN(parsedAno)) {
      setSaldos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSaldoAcumulado(orcamentoId, ano);
      setSaldos(Array.isArray(data?.saldos) ? data.saldos : []);
    } catch (err) {
      setError(err?.message || "Falha ao carregar saldo acumulado.");
      setSaldos([]);
    } finally {
      setLoading(false);
    }
  }, [orcamentoId, ano]);

  useEffect(() => {
    fetchSaldos();
  }, [fetchSaldos]);

  const updateSaldoInicial = useCallback(async (saldoInicial) => {
    const parsedAno = Number(ano);
    if (orcamentoId === null || orcamentoId === undefined || orcamentoId === "" || Number.isNaN(parsedAno)) {
      return null;
    }
    try {
      const result = await updateSaldoInicialOrcamento(orcamentoId, ano, saldoInicial);
      await fetchSaldos();
      return result;
    } catch (err) {
      setError(err?.message || "Falha ao atualizar saldo inicial.");
      throw err;
    }
  }, [orcamentoId, ano, fetchSaldos]);

  const getSaldoDoMes = useCallback((mesNome) => {
    if (!mesNome) return null;
    return saldos.find((saldo) => saldo.mesNome === mesNome) || null;
  }, [saldos]);

  const getSaldoFinalDoMes = useCallback((mesNome) => {
    const saldo = getSaldoDoMes(mesNome);
    if (!saldo) return 0;
    const value = parseFloat(saldo.saldoFinal);
    return Number.isNaN(value) ? 0 : value;
  }, [getSaldoDoMes]);

  const getSaldoAcumuladoAteMes = useCallback((mesNome) => {
    if (!mesNome) return 0;
    const targetIndex = MONTHS_ORDER.indexOf(mesNome);
    if (targetIndex === -1) return 0;
    let latestIndex = -1;
    let latestSaldo = 0;
    saldos.forEach((saldo) => {
      const index = MONTHS_ORDER.indexOf(saldo.mesNome);
      if (index === -1 || index > targetIndex || index <= latestIndex) return;
      const value = parseFloat(saldo.saldoFinal);
      latestSaldo = Number.isNaN(value) ? 0 : value;
      latestIndex = index;
    });
    return latestSaldo;
  }, [saldos]);

  return {
    saldos,
    loading,
    error,
    refetch: fetchSaldos,
    updateSaldoInicial,
    getSaldoDoMes,
    getSaldoFinalDoMes,
    getSaldoAcumuladoAteMes
  };
};

export default useSaldoAcumulado;
