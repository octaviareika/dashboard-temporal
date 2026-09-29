import React from 'react';

export default function Indicadores() {
  return (
    <div className="card indicadores-card">
      <h2 className="card-title">Indicadores de Minas Gerais</h2>
      
      <div className="indicadores-list">
        <div className="indicador-item">
          <div className="accent-line"></div>
          <div className="indicador-info">
            <div className="indicador-valor">259 mm</div>
            <div className="indicador-rotulo">Precipitação na última semana</div>
          </div>
        </div>

        <div className="indicador-item">
          <div className="accent-line"></div>
          <div className="indicador-info">
            <div className="indicador-valor">4.261 m³/s</div>
            <div className="indicador-rotulo">Vazão média (últimas 4 semanas)</div>
          </div>
        </div>

        <div className="indicador-item">
          <div className="accent-line"></div>
          <div className="indicador-info">
            <div className="indicador-valor">180.227 mm</div>
            <div className="indicador-rotulo">Acumulado pluviométrico no ano</div>
          </div>
        </div>

        <div className="indicador-item">
          <div className="accent-line"></div>
          <div className="indicador-info">
            <div className="indicador-valor">0</div>
            <div className="indicador-rotulo">Bacias em situação de alerta</div>
          </div>
        </div>
      </div>

      <div className="indicadores-footer">
        <p className="footer-line">Dados atualizados em 31/08/2026</p>
        <p className="footer-line">
          Fonte: <a href="https://info.dengue.mat.br" target="_blank" rel="noopener noreferrer">info.hidroclima.mg.gov.br</a>
        </p>
      </div>
    </div>
  );
}
