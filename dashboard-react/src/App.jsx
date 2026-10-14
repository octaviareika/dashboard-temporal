import React, { useEffect, useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import CasosSemanaisChart from './components/CasosSemanaisChart';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const SENSORES_MOCK = [
  { id: 1, nome: "Sensor Estação Centro", tipo: "temperatura", lat: -19.9200, lng: -43.9380 },
  { id: 2, nome: "Sensor Estação Pampulha", tipo: "pluviosidade", lat: -19.8520, lng: -43.9700 },
  { id: 3, nome: "Sensor Estação Barreiro", tipo: "umidade", lat: -19.9750, lng: -44.0200 },
  { id: 4, nome: "Sensor Estação Venda Nova", tipo: "temperatura", lat: -19.8100, lng: -43.9550 },
  { id: 5, nome: "Sensor Estação Leste", tipo: "pluviosidade", lat: -19.9050, lng: -43.9100 },
];

const TIPOS_SENSOR = [
  { valor: 'todos', label: 'Todos os Sensores' },
  { valor: 'temperatura', label: 'Temperatura' },
  { valor: 'pluviosidade', label: 'Pluviosidade' },
  { valor: 'umidade', label: 'Umidade' },
];

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

async function buscarNomeDaCidade(lat, long) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`,
      {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        },
      }
    );
    const data = await response.json();
    if (data && data.address) {
      const cidade = data.address.city || data.address.town || data.address.village || '';
      const estado = data.address.state || '';
      return `${cidade}, ${estado}`;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar o nome da cidade", error);
    return null;
  }
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12);
    }
  }, [center, map]);
  return null;
}

function App() { 
  const [posicao, setPosicao] = useState([-19.9167, -43.9345]); // Centro em Belo Horizonte, MG por padrão
  const [nomeCidade, setNomeCidade] = useState("Buscando...");
  const [sensor, setSensor] = useState('todos');
  const [sensorSelecionado, setSensorSelecionado] = useState(null);

  const sensoresFiltrados = SENSORES_MOCK.filter(
    sensor => sensor === 'todos' || sensor.tipo === sensor
  );

  const atualizarPosicao = async (lat, long) => {
    setPosicao([lat, long]);
    setNomeCidade("Buscando cidade...");
    const cidade = await buscarNomeDaCidade(lat, long);
    setNomeCidade(cidade || "Belo Horizonte, MG");
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          atualizarPosicao(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocalização não permitida/disponível:', error);
          atualizarPosicao(-19.9167, -43.9345);
        }
      );
    } else {
      atualizarPosicao(-19.9167, -43.9345);
    }
  }, []);

  const handleMapClick = (lat, long) => {
    atualizarPosicao(lat, long);
  };

  return (
    <div className="dashboard-container">
      
      {/* Conteúdo Principal do Painel */}
      <main className="dashboard-main">
        {/* Seção Principal (Mapa + Gráfico) */}
        <section className="map-and-chart-section">
          {/* Card do Mapa */}
          <div className="map-card">
            <div className="card-header">
              <h2>Mapa de Alertas de Dengue na Última Semana</h2>
              <div className="city-badge">
                Cidade selecionada: <strong>{nomeCidade}</strong>
              </div>
            </div> 

            <div>
              <label htmlFor="tipo-sensor-select" className="filter-label">
                Tipo de Sensor: 
              </label>
              <select
                id="tipo-sensor-select"
                className="filter-select"
                value={sensor}
                onChange={(e) => setSensor(e.target.value)}>
                {TIPOS_SENSOR.map(tipo => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="map-wrapper">
              <MapContainer center={posicao} zoom={12} style={{ width: '100%', height: '100%' }}>
                <MapViewController center={posicao} />
                <MapClickHandler onLocationSelect={handleMapClick} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                {sensoresFiltrados.map((sensor) => (
                  <Marker
                    key={sensor.id}
                    position={[sensor.lat, sensor.lng]}
                    eventHandlers={{
                      click: () => {
                        setSensorSelecionado(sensor);
                        atualizarPosicao(sensor.lat, sensor.lng);
                      },
                    }}
                  >
                    <Popup>
                      <div>
                        <strong>{sensor.nome}</strong><br />
                        Tipo: {sensor.tipo}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Componente do Gráfico (Abaixo do Mapa) */}
          <CasosSemanaisChart />
        </section>
      </main>
    </div>
  );
}

export default App;

