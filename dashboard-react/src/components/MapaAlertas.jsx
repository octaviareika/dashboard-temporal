import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function ZoomControls() {
  const map = useMap();

  return (
    <div className="custom-map-controls">
      <button className="map-btn" title="Aumentar Zoom" onClick={() => map.zoomIn()}>+</button>
      <button className="map-btn" title="Diminuir Zoom" onClick={() => map.zoomOut()}>−</button>
      <button className="map-btn" title="Centralizar MG" onClick={() => map.setView([-18.5138, -44.5550], 6)}>←</button>
    </div>
  );
}

export default function MapaAlertas() {
  const center = [-18.5138, -44.5550]; // Centered on Minas Gerais

  // Hydroclimatic stations and monitoring points across Minas Gerais
  const estaciones = [
    { name: 'Estação Belo Horizonte - Rio das Velhas', lat: -19.9167, lng: -43.9345, mm: 340, cor: '#800020', bacia: 'Bacia do Rio São Francisco' },
    { name: 'Estação Contagem - Paraopeba', lat: -19.9318, lng: -44.0539, mm: 250, cor: '#d32f2f', bacia: 'Bacia do Rio São Francisco' },
    { name: 'Estação Montes Claros - Rio Verde Grande', lat: -16.735, lng: -43.8617, mm: 215, cor: '#d32f2f', bacia: 'Bacia do Rio Verde Grande' },
    { name: 'Estação Uberlândia - Rio Araguari', lat: -18.9186, lng: -48.2772, mm: 175, cor: '#f57c00', bacia: 'Bacia do Rio Paranaíba' },
    { name: 'Estação Juiz de Fora - Rio Paraibuna', lat: -21.7642, lng: -43.3503, mm: 140, cor: '#f57c00', bacia: 'Bacia do Rio Paraíba do Sul' },
    { name: 'Estação Gov. Valadares - Rio Doce', lat: -18.8511, lng: -41.9442, mm: 125, cor: '#f57c00', bacia: 'Bacia do Rio Doce' },
    { name: 'Estação Patos de Minas - Alto Paranaíba', lat: -18.5789, lng: -46.5181, mm: 85, cor: '#ffb74d', bacia: 'Bacia do Rio Paranaíba' },
    { name: 'Estação Pará de Minas', lat: -19.8594, lng: -44.6083, mm: 70, cor: '#ffb74d', bacia: 'Bacia do Rio São Francisco' },
    { name: 'Estação Ipatinga - Vale do Aço', lat: -19.4686, lng: -42.5364, mm: 62, cor: '#ffb74d', bacia: 'Bacia do Rio Doce' },
    { name: 'Estação Varginha - Rio Grande', lat: -21.5519, lng: -45.4328, mm: 58, cor: '#ffb74d', bacia: 'Bacia do Rio Grande' },
  ];

  return (
    <div className="card mapa-card">
      <div className="card-header">
        <h2 className="card-title">Mapa de Alertas Hidroclimáticos na Última Semana</h2>
        <select className="select-casos" defaultValue="Precipitação (mm)">
          <option value="Precipitação (mm)">Precipitação (mm)</option>
          <option value="Vazão (m³/s)">Vazão (m³/s)</option>
          <option value="Nível dos Reservatórios">Nível dos Reservatórios</option>
        </select>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={center}
          zoom={6}
          zoomControl={false}
          scrollWheelZoom={true}
          className="leaflet-map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControls />

          {estaciones.map((est, idx) => (
            <CircleMarker
              key={idx}
              center={[est.lat, est.lng]}
              radius={Math.max(6, Math.min(18, est.mm / 18))}
              pathOptions={{
                fillColor: est.cor,
                color: '#ffffff',
                weight: 1.5,
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                  <strong style={{ color: '#1a202c' }}>{est.name}</strong>
                  <br />
                  <span style={{ color: '#4a5568' }}>{est.bacia}</span>
                  <br />
                  <span style={{ fontWeight: 'bold', color: est.cor }}>Acumulado: {est.mm} mm</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Floating Map Legend Box */}
        <div className="map-legend">
          <div className="legend-header">Intensidade Pluviométrica</div>
          <div className="legend-item">
            <span className="legend-color-box dark-red"></span>
            <span className="legend-text">300+ mm</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box red"></span>
            <span className="legend-text">200-300 mm</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box orange"></span>
            <span className="legend-text">100-200 mm</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box light-orange"></span>
            <span className="legend-text">50-100 mm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
