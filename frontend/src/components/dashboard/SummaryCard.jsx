import React from 'react';
import { DonutChart } from '../charts';
import { formatCurrency } from '../../utils/appUtils';

/**
 * SummaryCard - Card de resumo com mini gráfico donut
 * @param {string} title - Título do card
 * @param {string} icon - Emoji ou ícone
 * @param {number} previsto - Valor previsto
 * @param {number} realizado - Valor realizado
 * @param {string} color - Cor do gráfico
 * @param {string} labelPrevisto - Label para previsto
 * @param {string} labelRealizado - Label para realizado
 */
const SummaryCard = ({
  title,
  icon,
  previsto = 0,
  realizado = 0,
  color = '#10B981',
  labelPrevisto = 'Previsto',
  labelRealizado = 'Realizado',
  showProgress = true
}) => {
  const percent = previsto > 0 ? Math.min((realizado / previsto) * 100, 100) : 0;
  const difference = realizado - previsto;
  const differencePercent = previsto > 0 ? ((difference / previsto) * 100).toFixed(1) : 0;

  return (
    <div className="summary-card-modern">
      <div className="summary-card-modern__header">
        {icon && <span className="summary-card-modern__icon">{icon}</span>}
        <h4 className="summary-card-modern__title">{title}</h4>
      </div>

      <div className="summary-card-modern__chart-container">
        <DonutChart
          value={realizado}
          total={previsto}
          color={color}
          size={100}
          showPercentage={true}
        />
      </div>

      <div className="summary-card-modern__values">
        <div className="summary-card-modern__row">
          <span className="summary-card-modern__label">{labelPrevisto}:</span>
          <strong className="summary-card-modern__value">{formatCurrency(previsto)}</strong>
        </div>
        <div className="summary-card-modern__row">
          <span className="summary-card-modern__label">{labelRealizado}:</span>
          <strong className="summary-card-modern__value" style={{ color }}>
            {formatCurrency(realizado)}
          </strong>
        </div>
      </div>

      {showProgress && (
        <div className="summary-card-modern__progress-container">
          <div className="summary-card-modern__progress">
            <div
              className="summary-card-modern__progress-fill"
              style={{ width: `${percent}%`, backgroundColor: color }}
            />
          </div>
          <span className="summary-card-modern__progress-text">
            {percent.toFixed(0)}% realizado
          </span>
        </div>
      )}

      {difference !== 0 && (
        <div className={`summary-card-modern__difference ${difference > 0 ? 'positive' : 'negative'}`}>
          {difference > 0 ? '+' : ''}{formatCurrency(difference)} ({difference > 0 ? '+' : ''}{differencePercent}%)
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
