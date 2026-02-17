import React, { useRef, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const DonutChartTooltip = ({ active, payload }) => {
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

/**
 * DonutChart - Gráfico de rosca reutilizável
 * SEM ResponsiveContainer para evitar warnings de dimensões negativas
 */
const DonutChart = ({
  value = 0,
  total = 100,
  color = '#10B981',
  size = 120,
  showPercentage = true
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

    const rafId = requestAnimationFrame(() => {
      updateDimensions();
    });

    window.addEventListener('resize', updateDimensions);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const percent = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const remaining = 100 - percent;
  
  const data = [
    { name: 'Realizado', value: percent },
    { name: 'Restante', value: remaining }
  ];

  const { width, height: computedHeight } = dimensions;

  return (
    <div className="donut-chart" ref={containerRef} style={{ width: size, height: size }}>
      {width > 0 && computedHeight > 0 && (
        <PieChart width={width} height={computedHeight}>
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
          <Tooltip content={<DonutChartTooltip />} />
        </PieChart>
      )}
      {showPercentage && (
        <div className="donut-chart__center">
          <span className="donut-chart__percent">{percent.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
