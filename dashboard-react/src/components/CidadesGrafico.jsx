import React from 'react';

export default function CidadesGrafico() {
  const cidades = [
    { nome: 'Belo Horizonte', casos: 54, destaque: true },
    { nome: 'Montes Claros', casos: 21, destaque: false },
    { nome: 'Contagem', casos: 11, destaque: false },
    { nome: 'Patos de Minas', casos: 10, destaque: false },
    { nome: 'Pará de Minas', casos: 9, destaque: false },
  ];

  const maxCasos = 60;

  return (
    <div className="card cidades-card">
      <div className="card-header">
        <h2 className="card-title">Cidades (Última Semana)</h2>
        <button className="btn-select-casos">
          Acumulado (mm) <span className="caret">▸</span>
        </button>
      </div>

      <div className="cidades-list">
        {cidades.map((item, index) => {
          const widthPercent = (item.casos / maxCasos) * 100;
          return (
            <div key={index} className="cidade-item">
              <div className="cidade-label">
                <span className="cidade-nome">{item.nome}:</span>{' '}
                <span className="cidade-valor">{item.casos} mm</span>
              </div>
              <div className="cidade-bar-track">
                <div
                  className={`cidade-bar-fill ${item.destaque ? 'highlight' : ''}`}
                  style={{ width: `${widthPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cidades-axis">
        <div className="axis-ticks">
          <span>0</span>
          <span>20</span>
          <span>40</span>
          <span>60</span>
        </div>
        <div className="axis-caption">Volume pluviométrico (mm)</div>
      </div>
    </div>
  );
}
