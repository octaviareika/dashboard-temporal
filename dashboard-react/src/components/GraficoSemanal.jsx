import React, { useState } from 'react';

export default function GraficoSemanal() {
  const [hoveredWeek, setHoveredWeek] = useState(null);

  // Epidemiological / Hydrological weeks 1 to 37
  const totalWeeks = 37;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  // Year series metadata with exact matching colors from reference screenshot
  const years = [
    { year: 2020, color: '#f67280', label: '2020' },
    { year: 2021, color: '#e06d53', label: '2021' },
    { year: 2022, color: '#f8a055', label: '2022' },
    { year: 2023, color: '#4ecdc4', label: '2023' },
    { year: 2024, color: '#38b6ff', label: '2024' },
    { year: 2025, color: '#2d98da', label: '2025' },
    { year: 2026, color: '#95a5a6', label: '2026' },
  ];

  // Generator function for mocked time series data per year
  const getCases = (year, week) => {
    if (year === 2024) {
      // 2024 peak series reaching ~175,000 m³/s or mm volume around week 10
      if (week <= 10) return 25000 + (week - 1) * 16500;
      if (week <= 20) return 175000 - (week - 10) * 14500;
      if (week <= 30) return 30000 - (week - 20) * 2500;
      return 5000;
    }
    if (year === 2023) {
      if (week <= 15) return 10000 + (week - 1) * 2500;
      if (week <= 28) return 45000 - (week - 15) * 3000;
      return 6000;
    }
    if (year === 2022) {
      if (week <= 12) return 8000 + (week - 1) * 1500;
      if (week <= 25) return 26500 - (week - 12) * 1800;
      return 4000;
    }
    if (year === 2020 || year === 2021) {
      return 5000 + Math.sin(week / 4) * 8000 + (week > 25 ? 0 : week * 300);
    }
    if (year === 2025) {
      return 7000 + Math.sin(week / 3) * 6000;
    }
    if (year === 2026) {
      // Current active prediction series up to week 35
      if (week > 35) return null;
      return 4000 + Math.sin(week / 5) * 4500;
    }
    return 5000;
  };

  const maxY = 200000;

  // SVG Dimensions
  const svgWidth = 820;
  const svgHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (week) => paddingLeft + ((week - 1) / (totalWeeks - 1)) * chartWidth;
  const getY = (val) => paddingTop + chartHeight - (val / maxY) * chartHeight;

  // Smooth cubic bezier path generator
  const generatePath = (points) => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1X = curr.x + (next.x - curr.x) / 2;
      const cp1Y = curr.y;
      const cp2X = curr.x + (next.x - curr.x) / 2;
      const cp2Y = next.y;
      path += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const currentWeek = 35; // Week 35 marked as "Semana Atual"

  return (
    <div className="card grafico-semanal-card">
      <div className="card-header">
        <h2 className="card-title">Casos Semanais por Ano</h2>
        <div className="years-legend">
          {years.map((y) => (
            <div key={y.year} className="year-pill" style={{ backgroundColor: y.color }}>
              {y.label}
            </div>
          ))}
        </div>
      </div>

      <div className="chart-container-relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="semanal-svg"
          onMouseLeave={() => setHoveredWeek(null)}
        >
          {/* Grid Lines Y */}
          {[0, 50000, 100000, 150000, 200000].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3,3"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="axis-text"
                >
                  {val.toLocaleString('pt-BR')}
                </text>
              </g>
            );
          })}

          {/* Y Axis Label */}
          <text
            x={15}
            y={svgHeight / 2}
            className="axis-title-vertical"
            transform={`rotate(-90 15 ${svgHeight / 2})`}
            textAnchor="middle"
          >
            Casos
          </text>

          {/* Render time series lines */}
          {years.map((yObj) => {
            const points = weeks
              .map((w) => {
                const val = getCases(yObj.year, w);
                if (val === null) return null;
                return { x: getX(w), y: getY(val), val, week: w };
              })
              .filter(Boolean);

            const d = generatePath(points);

            return (
              <g key={yObj.year}>
                <path
                  d={d}
                  fill="none"
                  stroke={yObj.color}
                  strokeWidth={yObj.year === 2024 ? 2.5 : 1.8}
                  strokeLinecap="round"
                />
                {points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredWeek === pt.week ? 4.5 : 1.5}
                    fill={yObj.color}
                  />
                ))}
              </g>
            );
          })}

          {/* Red Line for "Semana Atual" */}
          <g>
            <line
              x1={getX(currentWeek)}
              y1={paddingTop - 5}
              x2={getX(currentWeek)}
              y2={svgHeight - paddingBottom}
              stroke="#ff3333"
              strokeWidth="2"
            />
          </g>

          {/* X Axis Ticks (Weeks) */}
          {weeks.map((w) => {
            const x = getX(w);
            return (
              <g
                key={w}
                onMouseEnter={() => setHoveredWeek(w)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={x - 6}
                  y={paddingTop}
                  width="12"
                  height={chartHeight + 20}
                  fill="transparent"
                />
                <text
                  x={x}
                  y={svgHeight - paddingBottom + 16}
                  textAnchor="middle"
                  className={`week-tick ${w === currentWeek ? 'active-week' : ''}`}
                >
                  {w}
                </text>
              </g>
            );
          })}

          {/* X Axis Title */}
          <text
            x={svgWidth / 2}
            y={svgHeight - 6}
            textAnchor="middle"
            className="axis-title-horizontal"
          >
            Semana Epidemiológica
          </text>
        </svg>

        {/* Floating Badge for "Semana Atual" over the red vertical line */}
        <div
          className="semana-atual-badge"
          style={{
            left: `${((getX(currentWeek) - paddingLeft) / chartWidth) * 85 + 9.5}%`,
          }}
        >
          Semana Atual
        </div>

        {/* Tooltip on Hover */}
        {hoveredWeek && (
          <div
            className="chart-tooltip"
            style={{
              left: `${((getX(hoveredWeek) - paddingLeft) / chartWidth) * 80 + 10}%`,
            }}
          >
            <div className="tooltip-header">Semana {hoveredWeek}</div>
            {years.map((y) => {
              const val = getCases(y.year, hoveredWeek);
              if (val === null) return null;
              return (
                <div key={y.year} className="tooltip-row">
                  <span className="tooltip-dot" style={{ backgroundColor: y.color }}></span>
                  <span className="tooltip-year">{y.year}:</span>
                  <span className="tooltip-val">{Math.round(val).toLocaleString('pt-BR')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
