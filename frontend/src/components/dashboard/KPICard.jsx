import React from 'react';

/**
 * KPICard - Card de KPI principal com destaque
 * @param {string} title - Titulo do KPI
 * @param {string} value - Valor principal formatado
 * @param {string} subtitle - Subtitulo ou descricao
 * @param {string} trend - 'up' | 'down' | 'neutral'
 * @param {string} trendValue - Valor da tendencia
 * @param {string} color - 'positive' | 'negative' | 'neutral'
 * @param {ReactNode} icon - Icone opcional
 */
const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'neutral',
  icon,
  children
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '\u25B2';
      case 'down':
        return '\u25BC';
      default:
        return null;
    }
  };

  return (
    <div className={`kpi-card kpi-card--${color}`}>
      <div className="kpi-card__header">
        {icon && <span className="kpi-card__icon">{icon}</span>}
        <span className="kpi-card__title">{title}</span>
      </div>

      <div className="kpi-card__body">
        <div className="kpi-card__value">{value}</div>

        {subtitle && (
          <span className="kpi-card__subtitle">{subtitle}</span>
        )}

        {trend && trendValue && (
          <div className={`kpi-card__trend kpi-card__trend--${trend}`}>
            <span className="kpi-card__trend-icon">{getTrendIcon()}</span>
            <span className="kpi-card__trend-value">{trendValue}</span>
          </div>
        )}
      </div>

      {children && (
        <div className="kpi-card__footer">
          {children}
        </div>
      )}
    </div>
  );
};

export default KPICard;
