import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * DonutChart - Gráfico de rosca reutilizável
 * @param {number} value - Valor atual (ex: realizado)
 * @param {number} total - Valor total (ex: previsto)
 * @param {string} color - Cor do preenchimento
 * @param {number} size - Tamanho do gráfico
 * @param {boolean} showPercentage - Mostrar percentual no centro
 */
const DonutChart = ({
  value = 0,
  total = 100,
  color = '#10B981',
  size = 120,
  showPercentage = true,
  tooltipFormatter
}) => {
  const percent = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const remaining = 100 - percent;
  
  const data = [
    { name: 'Realizado', value: percent },
    { name: 'Restante', value: remaining }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip__text">
            {payload[0].name}: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.42}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
          >
            <Cell fill={color} stroke="none" />
            <Cell fill="#E2E8F0" stroke="none" />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {showPercentage && (
        <div className="donut-chart__center">
          <span className="donut-chart__percent">{percent.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
