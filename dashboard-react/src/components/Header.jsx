import React from 'react';

export default function Header() {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="logo-container">
          <svg className="hydro-logo" viewBox="0 0 36 36" width="34" height="34">
            <defs>
              <linearGradient id="hydroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00c6ff" />
                <stop offset="100%" stopColor="#0072ff" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="17" fill="url(#hydroGrad)" />
            {/* Water Drop Icon */}
            <path
              d="M18 7 C18 7, 11 16, 11 21 C11 24.8 14.1 28 18 28 C21.9 28 25 24.8 25 21 C25 16, 18 7, 18 7 Z"
              fill="#ffffff"
            />
            <path
              d="M14 22 C16 20.5 18 22.5 20 21.5"
              stroke="#0072ff"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <div className="logo-text-group">
            <span className="logo-title">HidroClima</span>
            <span className="logo-badge">MG</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        <h1 className="header-title">
          Dashboard para Monitoramento Hidroclimático e Visualização Georreferenciada de Séries Temporais e Predições
        </h1>
      </div>

      <div className="header-right">
        <div className="status-badge">
          <span className="status-dot"></span>
          <span>Séries Ativas</span>
        </div>
      </div>
    </header>
  );
}
