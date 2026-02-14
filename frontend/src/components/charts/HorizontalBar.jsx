import React, { useRef, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

/**
 * HorizontalBar - Gráfico de barras horizontais
 * SEM ResponsiveContainer para evitar warnings de dimensões negativas
 */
const HorizontalBar = ({
  data = [],
  height = 200,
  colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  showGrid = false,
  showValues = true,
  currencyFormat = true,
  maxValue = null
}) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth } = containerRef.current;
        if (offsetWidth > 0) {
          setWidth(offsetWidth);
        }
      }
    };

    const rafId = requestAnimationFrame(() => {
      updateDimensions();
    });

    window.addEventListener('resize', updateDimensions);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const formatCurrency = (value) => {
    if (!currencyFormat) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip__text">
            {payload[0].payload.name}: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calcular valor máximo se não fornecido
  const calculatedMaxValue = maxValue || (data.length > 0 
    ? Math.max(...data.map(d => d.value)) * 1.1 
    : 100);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty" style={{ height }}>
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="horizontal-bar" ref={containerRef} style={{ width: '100%', height }}>
      {width > 0 && (
        <BarChart
          width={width}
          height={height}
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          maxBarSize={28}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
          )}
          <XAxis
            type="number"
            domain={[0, calculatedMaxValue]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            background={{ fill: '#F1F5F9', radius: [0, 4, 4, 0] }}
            label={{
              position: 'right',
              formatter: (value) => showValues ? formatCurrency(value) : '',
              fontSize: 11,
              fill: '#64748B'
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      )}
    </div>
  );
};

export default HorizontalBar;
