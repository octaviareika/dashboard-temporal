import React from 'react';
import Header from './components/Header';
import Indicadores from './components/Indicadores';
import PesquisaCidade from './components/PesquisaCidade';
import CidadesGrafico from './components/CidadesGrafico';
import MapaAlertas from './components/MapaAlertas';
import GraficoSemanal from './components/GraficoSemanal';
import './App.css';

export default function App() {
  return (
    <div className="dashboard-app">
      <Header />
      <main className="dashboard-content">
        <aside className="dashboard-sidebar">
          <Indicadores />
          <PesquisaCidade />
          <CidadesGrafico />
        </aside>

        <section className="dashboard-main">
          <MapaAlertas />
          <GraficoSemanal />
        </section>
      </main>
    </div>
  );
}
