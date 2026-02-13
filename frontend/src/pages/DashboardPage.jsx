import { useMemo, useState } from "react";
import { formatCurrency, getCurrentMonthName } from "../utils/appUtils";

const DashboardPage = ({ receitas, despesas, orcamentos }) => {
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState("");
  const [selectedMes, setSelectedMes] = useState("");
  const initialOrcamentoId = orcamentos[0]?.id ?? "";
  const effectiveOrcamentoId = selectedOrcamentoId || initialOrcamentoId;
  const currentOrcamento = orcamentos.find((o) => o.id === effectiveOrcamentoId);
  const mesesDisponiveis = useMemo(
    () => currentOrcamento?.meses || [],
    [currentOrcamento]
  );
  const defaultMes = useMemo(() => {
    if (mesesDisponiveis.length === 0) return "";
    const currentMonth = getCurrentMonthName();
    return mesesDisponiveis.includes(currentMonth) ? currentMonth : mesesDisponiveis[0];
  }, [mesesDisponiveis]);
  const effectiveMes = selectedMes && mesesDisponiveis.includes(selectedMes) ? selectedMes : defaultMes;

  const resumoMensal = useMemo(() => {
    if (!effectiveOrcamentoId || !effectiveMes) {
      return { recLancadas: 0, recRecebidas: 0, despLancadas: 0, despPagas: 0, saldo: 0 };
    }

    let recLancadas = 0;
    let recRecebidas = 0;
    let despLancadas = 0;
    let despPagas = 0;

    receitas.forEach((r) => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = r.mes === effectiveMes || (r.meses && r.meses.includes(effectiveMes));
      if (isActive) {
        const val = parseFloat(r.valor) || 0;
        recLancadas += val;
        if (r.status === "Recebido") recRecebidas += val;
      }
    });

    despesas.forEach((d) => {
      if (d.orcamentoId !== effectiveOrcamentoId) return;
      const isActive = d.mes === effectiveMes || (d.meses && d.meses.includes(effectiveMes));
      if (isActive) {
        const val = parseFloat(d.valor) || 0;
        despLancadas += val;
        if (d.status === "Pago") despPagas += val;
      }
    });

    return {
      recLancadas,
      recRecebidas,
      despLancadas,
      despPagas,
      saldo: recRecebidas - despPagas
    };
  }, [receitas, despesas, effectiveOrcamentoId, effectiveMes]);

  const resumoAnual = useMemo(() => {
    if (!effectiveOrcamentoId) {
      return {
        recPrevisto: 0,
        recRecebido: 0,
        despPrevisto: 0,
        despPago: 0,
        saldoPrevisto: 0,
        saldoRealizado: 0
      };
    }

    let recPrevisto = 0;
    let recRecebido = 0;
    let despPrevisto = 0;
    let despPago = 0;

    receitas.forEach((r) => {
      if (r.orcamentoId !== effectiveOrcamentoId) return;
      const val = parseFloat(r.valor) || 0;
      const occurrences = (r.meses && r.meses.length > 0) ? r.meses.length : (r.mes ? 1 : 0);
      recPrevisto += val * occurrences;
      if (r.status === "Recebido") {
        recRecebido += val * occurrences;
      }
    });

    despesas.forEach((d) => {
      if (d.orcamentoId !== effectiveOrcamentoId) return;
      const val = parseFloat(d.valor) || 0;
      const occurrences = (d.meses && d.meses.length > 0) ? d.meses.length : (d.mes ? 1 : 0);
      despPrevisto += val * occurrences;
      if (d.status === "Pago") {
        despPago += val * occurrences;
      }
    });

    return {
      recPrevisto,
      recRecebido,
      despPrevisto,
      despPago,
      saldoPrevisto: recPrevisto - despPrevisto,
      saldoRealizado: recRecebido - despPago
    };
  }, [receitas, despesas, effectiveOrcamentoId]);

  return (
    <div className="page-grid">
      <section className="panel filters-panel">
        <div className="panel-header">
          <div>
            <h2>Resumo Financeiro</h2>
          </div>
        </div>
        <form className="form-inline" onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            Orçamento
            <select value={effectiveOrcamentoId} onChange={(e) => setSelectedOrcamentoId(e.target.value)}>
              {orcamentos.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <label className="field">
            Mês
            <select value={effectiveMes} onChange={(e) => setSelectedMes(e.target.value)}>
              {mesesDisponiveis.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </form>
      </section>

      <section className="panel">
        <h3 className="panel-title">
          Resumo financeiro do mês de <span className="badge-month">{effectiveMes}</span>
        </h3>
        <div className="dashboard-grid">
          <div className="summary-card">
            <h4 className="summary-card-title">Receitas</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Previsto:</span>
              <strong className="summary-card-value">{formatCurrency(resumoMensal.recLancadas)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Recebido:</span>
              <strong className="summary-card-value summary-card-value--positive">{formatCurrency(resumoMensal.recRecebidas)}</strong>
            </div>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Despesas</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Previsto:</span>
              <strong className="summary-card-value">{formatCurrency(resumoMensal.despLancadas)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Pago:</span>
              <strong className="summary-card-value summary-card-value--negative">{formatCurrency(resumoMensal.despPagas)}</strong>
            </div>
          </div>

          <div className="summary-card saldo-mes-card">
            <h4 className="summary-card-title">Saldo do Mês</h4>
            <div className="saldo-row summary-card-row">
              <span className="summary-card-label">Saldo do Mês (Previsto):</span>
              <strong className="summary-card-value">{formatCurrency(resumoMensal.recLancadas - resumoMensal.despLancadas)}</strong>
            </div>
            <div className="saldo-row summary-card-row">
              <span className="summary-card-label">Saldo em Conta (Mês):</span>
              <strong className={`summary-card-value ${resumoMensal.saldo >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}`}>
                {formatCurrency(resumoMensal.saldo)}
              </strong>
            </div>
            <div className="saldo-row summary-card-row">
              <span className="summary-card-label">Saldo Acumulado (Mês):</span>
              <strong className={`summary-card-value ${resumoMensal.recLancadas - resumoMensal.despLancadas >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}`}>
                {formatCurrency(resumoMensal.recLancadas - resumoMensal.despLancadas)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel-title">
          Resumo financeiro do orçamento anual <span className="badge-year">{currentOrcamento?.label}</span>
        </h3>
        <div className="dashboard-grid">
          <div className="summary-card">
            <h4 className="summary-card-title">Receitas do Ano</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Previsto:</span>
              <strong className="summary-card-value">{formatCurrency(resumoAnual.recPrevisto)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Recebido:</span>
              <strong className="summary-card-value summary-card-value--positive">{formatCurrency(resumoAnual.recRecebido)}</strong>
            </div>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Despesas do Ano</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Previsto:</span>
              <strong className="summary-card-value">{formatCurrency(resumoAnual.despPrevisto)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Pago:</span>
              <strong className="summary-card-value summary-card-value--negative">{formatCurrency(resumoAnual.despPago)}</strong>
            </div>
          </div>

          <div className="summary-card">
            <h4 className="summary-card-title">Saldo Anual</h4>
            <div className="summary-card-row">
              <span className="summary-card-label">Saldo Anual (Previsão):</span>
              <strong className="summary-card-value">{formatCurrency(resumoAnual.saldoPrevisto)}</strong>
            </div>
            <div className="summary-card-row">
              <span className="summary-card-label">Saldo Acumulado (Previsão):</span>
              <strong className={`summary-card-value ${resumoAnual.saldoRealizado >= 0 ? "summary-card-value--positive" : "summary-card-value--negative"}`}>
                {formatCurrency(resumoAnual.saldoRealizado)}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export { DashboardPage };
