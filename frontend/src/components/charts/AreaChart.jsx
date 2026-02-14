import React, { useRef, useState, useEffect } from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

/**
 * AreaChart - Gráfico de área para evolução temporal
 * SEM ResponsiveContainer para evitar warnings de dimensões negativas
 */
const AreaChart = ({
  data = [],
  series = [],
  height = 300,
  showGrid = true,
  showLegend = true,
  currencyFormat = true
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setDimensions({ width: offsetWidth, height: offsetHeight });
        }
      }
    };

    // Atualizar dimensões após mount
    const rafId = requestAnimationFrame(() => {
      updateDimensions();
    });

    // Listener para resize
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip chart-tooltip--area">
          <p className="chart-tooltip__title">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="chart-tooltip__value"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty" style={{ height }}>
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  const { width, height: computedHeight } = dimensions;

  return (
    <div className="area-chart" ref={containerRef} style={{ width: '100%', height }}>
      {width > 0 && computedHeight > 0 && (
        <RechartsAreaChart
          width={width}
          height={computedHeight}
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          )}
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={currencyFormat ? (value) => formatCurrency(value) : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {series.map((s, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RechartsAreaChart>
      )}
    </div>
  );
};

export default AreaChart;
