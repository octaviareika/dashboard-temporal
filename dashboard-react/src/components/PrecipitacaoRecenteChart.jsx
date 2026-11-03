import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  buscarSeriePrecipitacao,
  ESTACOES_VALE_RIO_DOCE
} from '../api_controller/hidroWebService';

const PERIODOS = [
  { valor: 'HORA_24', label: 'Últimas 24h' },
  { valor: 'DIAS_7', label: 'Últimos 7 dias' },
  { valor: 'DIAS_14', label: 'Últimos 14 dias' },
  { valor: 'DIAS_30', label: 'Últimos 30 dias (Máx)' },
];

const MODOS_VISUALIZACAO = [
  { id: 'leituras', label: 'Leituras em Tempo Real (15 min)' },
  { id: 'diario', label: 'Acumulado por Dia (mm/dia)' },
  { id: 'acumulado', label: 'Curva Acumulada (mm total)' },
];

function classificarChuva(mm) {
  if (mm <= 0) return { texto: 'Sem chuva', cor: '#94a3b8' };
  if (mm < 2.5) return { texto: 'Chuva muito fraca', cor: '#38bdf8' };
  if (mm < 10) return { texto: 'Chuva fraca a moderada', cor: '#0284c7' };
  if (mm < 25) return { texto: 'Chuva moderada', cor: '#f59e0b' };
  return { texto: 'Chuva forte / intensa', cor: '#ef4444' };
}

// Tooltip customizado elegante e seguro
const CustomTooltip = ({ active, payload, label, modo }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;
    const chuvaVal = payload[0].value ?? 0;
    const classificacao = classificarChuva(chuvaVal);

    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        padding: '12px 16px',
        borderRadius: '10px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        fontSize: '13px',
        minWidth: '220px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
          <span style={{ fontWeight: '700', color: '#1e293b' }}>
            {dataItem.dataFormatada || dataItem.dia || label}
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: `${classificacao.cor}18`,
            color: classificacao.cor,
            fontWeight: '600'
          }}>
            {classificacao.texto}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>
              {modo === 'diario' ? 'Total no Dia:' : modo === 'acumulado' ? 'Total Acumulado:' : 'Precipitação:'}
            </span>
            <strong style={{ color: '#0284c7', fontSize: '15px' }}>
              {chuvaVal.toFixed(1)} mm
            </strong>
          </div>

          {modo === 'leituras' && dataItem.chuvaAcumulada !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
              <span>Acumulado até o momento:</span>
              <span style={{ fontWeight: '600', color: '#334155' }}>
                {dataItem.chuvaAcumulada.toFixed(1)} mm
              </span>
            </div>
          )}

          {modo === 'diario' && dataItem.leituras && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
              <span>Registros telemétricos:</span>
              <span style={{ fontWeight: '600', color: '#334155' }}>
                {dataItem.leituras} medições
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Etiqueta vermelha do marcador "Dia atual" (estilo badge)
const LabelDiaAtual = ({ viewBox }) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  const largura = 70;
  const altura = 20;
  return (
    <g>
      <rect x={x - largura / 2} y={y - altura - 2} width={largura} height={altura} rx={5} fill="#ef4444" />
      <text x={x} y={y - altura / 2 - 2} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={11} fontWeight={700}>
        Dia atual
      </text>
    </g>
  );
};

export default function PrecipitacaoRecenteChart({ codigoEstacaoInicial = '56850000' }) {
  const [codigoEstacao, setCodigoEstacao] = useState(codigoEstacaoInicial);
  const [periodo, setPeriodo] = useState('DIAS_7');
  const [modoVisualizacao, setModoVisualizacao] = useState('leituras');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [dadosPrecipitacao, setDadosPrecipitacao] = useState({
    medicoes: [],
    dadosDiarios: [],
    estatisticas: {
      totalChuva: 0,
      maximaChuva: 0,
      momentoMaxima: null,
      ultimaLeitura: null,
      totalLeituras: 0,
    }
  });

  const estacaoInfo = useMemo(() => {
    return ESTACOES_VALE_RIO_DOCE.find(e => String(e.codigo) === String(codigoEstacao)) || {
      nome: `Estação Telemétrica ANA ${codigoEstacao}`,
      municipio: 'Bacia Hidrográfica',
      rio: 'Rede Hidrometeorológica Nacional',
      uf: 'MG'
    };
  }, [codigoEstacao]);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const res = await buscarSeriePrecipitacao({
        codigoEstacao,
        range: periodo
      });

      if (res.sucesso) {
        setDadosPrecipitacao(res);
      } else {
        setErro(res.erro || 'Não foi possível carregar os dados de telemetria desta estação.');
      }
    } catch (err) {
      setErro(err.message || 'Erro inesperado ao consultar o HidroWebService.');
    } finally {
      setCarregando(false);
    }
  }, [codigoEstacao, periodo]);

  useEffect(() => {
    let ativo = true;

    async function executarBusca() {
      setCarregando(true);
      setErro(null);
      try {
        const res = await buscarSeriePrecipitacao({
          codigoEstacao,
          range: periodo
        });
        if (ativo) {
          if (res.sucesso) {
            setDadosPrecipitacao(res);
          } else {
            setErro(res.erro || 'Não foi possível carregar os dados de telemetria desta estação.');
          }
        }
      } catch (err) {
        if (ativo) {
          setErro(err.message || 'Erro inesperado ao consultar o HidroWebService.');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    executarBusca();

    return () => {
      ativo = false;
    };
  }, [codigoEstacao, periodo]);


  const { estatisticas, medicoes, dadosDiarios } = dadosPrecipitacao;

  // Marcador "Dia atual": rótulo dd/mm de hoje e primeira leitura do dia no eixo X
  const diaAtualLabel = useMemo(() => {
    const hoje = new Date();
    return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const xDiaAtualLeituras = useMemo(() => {
    const primeira = medicoes.find(m => m.dataFormatada?.startsWith(diaAtualLabel));
    return primeira ? primeira.dataFormatada : null;
  }, [medicoes, diaAtualLabel]);

  const temDiaAtualDiario = dadosDiarios.some(d => d.dia === diaAtualLabel);

  // Formatação da última leitura para o badge
  const ultimaLeituraTexto = useMemo(() => {
    if (!estatisticas.ultimaLeitura) return 'Aguardando sincronização';
    return `${estatisticas.ultimaLeitura.dataFormatada} (${estatisticas.ultimaLeitura.chuva.toFixed(1)} mm)`;
  }, [estatisticas.ultimaLeitura]);

  return (
    <div className="precipitacao-chart-card" style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '22px 24px',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
      border: '1px solid #e2e8f0',
      marginTop: '20px',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '20px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              fontSize: '18px'
            }}>
              🌧️
            </span>
            <h3 style={{
              margin: 0,
              fontSize: '19px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.3px'
            }}>
              Monitoramento Recente de Precipitação (ANA)
            </h3>
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              Telemetria Ativa
            </span>
          </div>
          <p style={{ margin: '4px 0 0 42px', fontSize: '13px', color: '#64748b' }}>
            Série telemétrica adotada (chuva acumulada em mm) via <code>GET /HidroinfoanaSerieTelemetricaAdotada/v1</code>
          </p>
        </div>

        {/* Controles de Estação e Período */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div>
            <select
              id="select-estacao-precipitacao"
              value={codigoEstacao}
              onChange={(e) => setCodigoEstacao(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {ESTACOES_VALE_RIO_DOCE.map((est) => (
                <option key={est.codigo} value={est.codigo}>
                  {est.nome} ({est.codigo}) - {est.municipio}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Range (Janela temporal até 30 dias) */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                id={`btn-periodo-${p.valor}`}
                type="button"
                onClick={() => setPeriodo(p.valor)}
                style={{
                  border: 'none',
                  background: periodo === p.valor ? '#ffffff' : 'transparent',
                  color: periodo === p.valor ? '#0284c7' : '#64748b',
                  fontWeight: periodo === p.valor ? '700' : '500',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: periodo === p.valor ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botão de Atualizar */}
          <button
            type="button"
            id="btn-recarregar-telemetria"
            onClick={carregarDados}
            disabled={carregando}
            title="Atualizar dados telemétricos"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontSize: '13px',
              fontWeight: '600',
              cursor: carregando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {carregando ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Cards de Métricas / KPIs Hidrológicos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Card 1: Total Precipitado */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Acumulado ({periodo.replace('DIAS_', '').replace('HORA_', '')} {periodo.includes('HORA') ? 'horas' : 'dias'})
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0c4a6e', marginTop: '4px' }}>
            {estatisticas.totalChuva.toFixed(1)} <span style={{ fontSize: '15px', fontWeight: '500' }}>mm</span>
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>
            Volume total registrado na estação
          </div>
        </div>

        {/* Card 2: Pico Máximo */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pico Máximo em Leitura
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
            {estatisticas.maximaChuva.toFixed(1)} <span style={{ fontSize: '15px', fontWeight: '500' }}>mm</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {estatisticas.momentoMaxima ? `Registrado em: ${estatisticas.momentoMaxima.split(' ')[0]}` : 'Sem picos no período'}
          </div>
        </div>

        {/* Card 3: Última Medição */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Última Medição Recebida
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginTop: '8px', wordBreak: 'break-word' }}>
            {ultimaLeituraTexto}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '600' }}>
            ● Transmissão telemétrica ativa
          </div>
        </div>

        {/* Card 4: Detalhes da Estação */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Estação Selecionada
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '6px' }}>
            {estacaoInfo.nome}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {estacaoInfo.rio} • {estacaoInfo.municipio} - {estacaoInfo.uf}
          </div>
        </div>
      </div>

      {/* Barra de Seleção de Modo de Visualização */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {MODOS_VISUALIZACAO.map(modo => (
            <button
              key={modo.id}
              id={`modo-${modo.id}`}
              type="button"
              onClick={() => setModoVisualizacao(modo.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: modoVisualizacao === modo.id ? '#0284c7' : '#e2e8f0',
                backgroundColor: modoVisualizacao === modo.id ? '#e0f2fe' : '#ffffff',
                color: modoVisualizacao === modo.id ? '#0369a1' : '#475569',
                fontWeight: modoVisualizacao === modo.id ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {modo.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Total de {estatisticas.totalLeituras} medições no período
        </div>
      </div>

      {/* Feedback de Erro se houver */}
      {erro && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '13px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {erro}</span>
          <button
            type="button"
            onClick={carregarDados}
            style={{
              background: '#991b1b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Área do Gráfico */}
      <div style={{ width: '100%', height: 350, position: 'relative' }}>
        {carregando && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#0284c7'
          }}>
            Carregando série telemétrica da ANA...
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {modoVisualizacao === 'diario' ? (
            /* Visualização por Dia: Gráfico de Barras / Linhas */
            <BarChart
              data={dadosDiarios}
              margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dia"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                label={{
                  value: 'Dia (dd/mm)',
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
                unit=" mm"
                label={{
                  value: 'Precipitação Diária (mm)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  fill: '#64748b',
                  fontSize: 12,
                  fontWeight: 500
                }}
              />
              <Tooltip content={<CustomTooltip modo="diario" />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px' }} />
              <Bar
                dataKey="chuvaTotal"
                name="Chuva Total no Dia (mm)"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
              />
              {temDiaAtualDiario && (
                <ReferenceLine x={diaAtualLabel} stroke="#ef4444" strokeWidth={2} label={<LabelDiaAtual />} />
              )}
            </BarChart>
          ) : modoVisualizacao === 'acumulado' ? (
            /* Visualização Curva Acumulada: Área / Linha */
            <AreaChart
              data={medicoes}
              margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
            >
              <defs>
                <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dataFormatada"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                minTickGap={40}
                label={{
                  value: 'Data e Hora da Medição',
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
                unit=" mm"
                label={{
                  value: 'Chuva Acumulada (mm)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  fill: '#64748b',
                  fontSize: 12,
                  fontWeight: 500
                }}
              />
              <Tooltip content={<CustomTooltip modo="acumulado" />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px' }} />
              <Area
                type="monotone"
                dataKey="chuvaAcumulada"
                name="Acumulado Progressivo (mm)"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAcumulado)"
              />
              {xDiaAtualLeituras && (
                <ReferenceLine x={xDiaAtualLeituras} stroke="#ef4444" strokeWidth={2} label={<LabelDiaAtual />} />
              )}
            </AreaChart>
          ) : (
            /* Visualização Padrão: Linha de Leituras em Tempo Real */
            <LineChart
              data={medicoes}
              margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
            >
              <defs>
                <linearGradient id="colorChuva" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dataFormatada"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                minTickGap={45}
                label={{
                  value: 'Data e Hora da Leitura (Intervalo 15 min)',
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
                unit=" mm"
                label={{
                  value: 'Precipitação na Leitura (mm)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  fill: '#64748b',
                  fontSize: 12,
                  fontWeight: 500
                }}
              />
              <Tooltip content={<CustomTooltip modo="leituras" />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px' }} />

              {/* Linha de referência para chuvas intensas se o pico ultrapassar 5mm */}
              {estatisticas.maximaChuva > 5 && (
                <ReferenceLine
                  y={5}
                  label={{ value: 'Alerta Chuva Moderada (5 mm)', fill: '#f59e0b', fontSize: 11, position: 'top' }}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                />
              )}

              <Line
                type="monotone"
                dataKey="chuva"
                name="Precipitação (mm)"
                stroke="#0284c7"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.chuva > 0) {
                    return (
                      <circle
                        key={`dot-${payload.dataHoraOriginal}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    );
                  }
                  return null;
                }}
                activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
              />
              {xDiaAtualLeituras && (
                <ReferenceLine x={xDiaAtualLeituras} stroke="#ef4444" strokeWidth={2} label={<LabelDiaAtual />} />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #f1f5f9',
        fontSize: '12px',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <span>
          <strong>Fonte Oficial:</strong> API HidroWeb
        </span>
      </div>
    </div>
  );
}
