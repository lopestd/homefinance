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

const HorizontalBarTooltip = ({ active, payload, formatCurrency }) => {
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
          setWidth((prevWidth) => (prevWidth === offsetWidth ? prevWidth : offsetWidth));
        }
      }
    };

    let rafId = requestAnimationFrame(updateDimensions);
    let resizeObserver = null;

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateDimensions);
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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

  // Calcular valor máximo se não fornecido
  const calculatedMaxValue = maxValue || (data.length > 0 
    ? Math.max(...data.map(d => d.value)) * 1.1 
    : 100);
  const compactMode = width > 0 && width < 460;
  const yAxisWidth = compactMode ? 78 : 120;
  const rightMargin = compactMode ? 16 : 84;
  const shouldShowValueLabels = showValues && !compactMode;
  const formatCategoryLabel = (label) => {
    const text = String(label || '');
    const maxLength = compactMode ? 14 : 22;
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
  };

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
          margin={{ top: 0, right: rightMargin, left: 0, bottom: 0 }}
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
            tickFormatter={formatCategoryLabel}
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
          />
          <Tooltip content={<HorizontalBarTooltip formatCurrency={formatCurrency} />} cursor={{ fill: 'transparent' }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            background={{ fill: '#F1F5F9', radius: [0, 4, 4, 0] }}
            label={shouldShowValueLabels
              ? {
                  position: 'right',
                  formatter: (value) => formatCurrency(value),
                  fontSize: 11,
                  fill: '#64748B'
                }
              : false}
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
