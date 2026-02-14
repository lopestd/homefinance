import React from 'react';

/**
 * ProgressBar - Barra de progresso simples
 * @param {number} value - Valor atual
 * @param {number} max - Valor máximo
 * @param {string} color - Cor da barra
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} showLabel - Mostrar label com percentual
 * @param {string} label - Texto do label personalizado
 */
const ProgressBar = ({
  value = 0,
  max = 100,
  color = '#10B981',
  size = 'medium',
  showLabel = false,
  label = null,
  animated = false
}) => {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const sizeMap = {
    small: '4px',
    medium: '8px',
    large: '12px'
  };

  return (
    <div className="progress-bar">
      <div
        className="progress-bar__track"
        style={{ height: sizeMap[size] || sizeMap.medium }}
      >
        <div
          className={`progress-bar__fill ${animated ? 'progress-bar__fill--animated' : ''}`}
          style={{
            width: `${percent}%`,
            backgroundColor: color
          }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar__label">
          {label || `${percent.toFixed(0)}%`}
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
