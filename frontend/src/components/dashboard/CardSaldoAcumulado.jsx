import React from "react";
import { formatCurrency } from "../../utils/appUtils";

const CardSaldoAcumulado = ({
  mesAtual,
  saldoInicial,
  receitasRecebidas,
  despesasPagas,
  saldoFinal
}) => {
  const saldoFinalClass =
    saldoFinal >= 0
      ? "saldo-acumulado-card__value saldo-acumulado-card__value--positive"
      : "saldo-acumulado-card__value saldo-acumulado-card__value--negative";

  return (
    <div className="saldo-acumulado-card">
      <div className="saldo-acumulado-card__header">
        <div className="saldo-acumulado-card__title-group">
          <span className="saldo-acumulado-card__icon">💰</span>
          <div className="saldo-acumulado-card__title-text">
            <span className="saldo-acumulado-card__title">Saldo Acumulado</span>
            <span className="saldo-acumulado-card__subtitle">Resumo do período</span>
          </div>
        </div>
        {mesAtual ? <span className="badge-month">{mesAtual}</span> : null}
      </div>
      <div className="saldo-acumulado-card__grid">
        <div className="saldo-acumulado-card__item">
          <span className="saldo-acumulado-card__label">
            Saldo Inicial (inclui meses anteriores)
          </span>
          <strong className="saldo-acumulado-card__value">
            {formatCurrency(saldoInicial)}
          </strong>
        </div>
        <div className="saldo-acumulado-card__item">
          <span className="saldo-acumulado-card__label">Receitas Recebidas</span>
          <strong className="saldo-acumulado-card__value saldo-acumulado-card__value--positive">
            {formatCurrency(receitasRecebidas)}
          </strong>
        </div>
        <div className="saldo-acumulado-card__item">
          <span className="saldo-acumulado-card__label">Despesas Pagas</span>
          <strong className="saldo-acumulado-card__value saldo-acumulado-card__value--negative">
            {formatCurrency(despesasPagas)}
          </strong>
        </div>
      </div>
      <div className="saldo-acumulado-card__total">
        <span className="saldo-acumulado-card__label">Saldo Final (acumulado)</span>
        <strong className={saldoFinalClass}>{formatCurrency(saldoFinal)}</strong>
      </div>
    </div>
  );
};

export default CardSaldoAcumulado;
