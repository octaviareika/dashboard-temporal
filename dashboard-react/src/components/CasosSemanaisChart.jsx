import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';


const generateData = () => {
  const data = [];
  for (let week = 1; week <= 52; week++) {
    const factor = Math.exp(-Math.pow(week - 12, 2) / 45);
    const baseline = 5000 + Math.sin(week / 3) * 1000;

    data.push({
      semana: week,
      2020: Math.round(baseline + factor * 25000 + (week % 4) * 800),
      2021: Math.round(baseline + factor * 18000 + (week % 3) * 600),
      2022: Math.round(baseline + factor * 30000 + (week % 5) * 1200),
      2023: Math.round(baseline + factor * 48000 + (week % 2) * 1500),
      2024: Math.round(baseline + factor * 165000 + (week % 3) * 3000), // Ano epidêmico de 2024
      2025: Math.round(baseline + factor * 35000 + (week % 4) * 1100),
      2026: week <= 35 ? Math.round(baseline + factor * 28000 + (week % 3) * 900) : null, // Dados até a semana atual
    });
  }
  return data;
};

const chartData = generateData();

// Configuração das séries por ano (cores aproximadas ao painel oficial DengueMG)
const seriesConfig = [
  { key: '2020', color: '#ff758f', label: '2020' },
  { key: '2021', color: '#e07a5f', label: '2021' },
  { key: '2022', color: '#f4a261', label: '2022' },
  { key: '2023', color: '#2a9d8f', label: '2023' },
  { key: '2024', color: '#48cae4', label: '2024' },
  { key: '2025', color: '#0077b6', label: '2025' },
  { key: '2026', color: '#8d99ae', label: '2026' },
];

const semanaAtual = 35;

const CustomReferenceLabel = (props) => {
  const { viewBox } = props;
  if (!viewBox) return null;
  const { x } = viewBox;
  return (
    <g transform={`translate(${x - 45}, 5)`}>
      <rect
        x="0"
        y="0"
        width="90"
        height="24"
        rx="12"
        fill="#ff4d4f"
      />
      <text
        x="45"
        y="16"
        fill="#ffffff"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
      >
        Dia de hoje
      </text>
    </g>
  );
};

// Tooltip customizado em Português
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '13px'
      }}>
        <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#334155' }}>
          Semana Epidemiológica: {label}
        </p>
        {payload.map((entry, index) => (
          entry.value !== null && entry.value !== undefined && (
            <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: entry.color }}></span>
              <span style={{ color: '#475569', minWidth: '40px' }}>{entry.name}:</span>
              <strong style={{ color: '#0f172a' }}>{entry.value.toLocaleString('pt-BR')} casos</strong>
            </div>
          )
        ))}
      </div>
    );
  }
  return null;
};

export default function CasosSemanaisChart() {
  return (
    <div className="casos-chart-container" style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: '16px 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
      marginTop: '16px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: '#1e293b'
      }}>
        Casos Semanais por Ano
      </h3>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 30, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis
              dataKey="semana"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              label={{
                value: 'Semana Epidemiológica',
                position: 'insideBottom',
                offset: -15,
                fill: '#64748b',
                fontSize: 12,
                fontWeight: 500
              }}
            />
            
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              tickFormatter={(val) => val.toLocaleString('pt-BR')}
              domain={[0, 200000]}
              label={{
                value: 'Casos',
                angle: -90,
                position: 'insideLeft',
                offset: -10,
                fill: '#64748b',
                fontSize: 12,
                fontWeight: 500
              }}
            />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              verticalAlign="top"
              align="right"
              iconType="square"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '13px' }}
            />

            {/* Linhas para cada ano */}
            {seriesConfig.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}

            {/* Linha vertical vermelha indicando o Dia de hoje */}
            <ReferenceLine
              x={semanaAtual}
              stroke="#ff4d4f"
              strokeWidth={2}
              label={<CustomReferenceLabel />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
