import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * PieChart - Gráfico de pizza para distribuição de categorias
 * @param {Array} data - Dados no formato [{ name: 'Moradia', value: 1500 }, ...]
 * @param {number} height - Altura do gráfico
 * @param {Array} colors - Array de cores para as fatias
 * @param {boolean} showLegend - Mostrar legenda
 * @param {boolean} showLabels - Mostrar labels nas fatias
 */
const PieChart = ({
  data = [],
  height = 250,
  colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
  showLegend = true,
  showLabels = false,
  currencyFormat = true,
  innerRadius = 0
}) => {
  const formatCurrency = (value) => {
    if (!currencyFormat) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="chart-tooltip chart-tooltip--pie">
          <p className="chart-tooltip__title">{item.name}</p>
          <p className="chart-tooltip__value">{formatCurrency(item.value)}</p>
          <p className="chart-tooltip__percent">{percent}% do total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty" style={{ height }}>
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="pie-chart" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={height * 0.32}
            dataKey="value"
            paddingAngle={2}
            label={showLabels ? renderCustomLabel : false}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 12, paddingLeft: 10 }}
              iconType="circle"
              iconSize={8}
              formatter={(value, entry) => (
                <span className="pie-chart__legend-item">
                  {value}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;
