import React, { useEffect, useState } from 'react';
import './App.css'
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

async function buscarNomeDaCidade(lat, long){
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`,
          {
            headers: {
              'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
            },
          }
        )
        const data  = await response.json();
        if (data && data.address){
          const cidade = data.address.city || data.address.town || data.address.village || '';
          const estado = data.address.state || '';
          return `${cidade}, ${estado}`;
        }
        return null;
      } catch (error){
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
  function MapViewController({ center }){
    const map = useMap();
    useEffect(() => {
      if (center){
        map.flyTo(center, 13);
      }
    }, [center, map]);
    return null;
  }

function MeuMapa() {
  
  const [posicao, setPosicao] = useState([-23.478026911924747, -46.39200704730086]) // lat e long
  const [nomeCidade, setNomeCidade] = useState("Buscando...") 

  const atualizarPosicao = async (lat, long) => {
    setPosicao([lat, long])
    setNomeCidade("Buscando cidade...")
    const cidade = await buscarNomeDaCidade(lat, long)
    setNomeCidade(cidade)
  }

    useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { // Função sem nome, que recebe a posicao e atualiza o estado
          const { latitude, longitude } = position.coords;
          atualizarPosicao(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocalização não permitida/disponível:', error);
          // Caso negada a permissão, carrega São Paulo
          atualizarPosicao(-23.55052, -46.633308);
        }
      );
    } else {
      atualizarPosicao(-23.55052, -46.633308);
    }
  }, []);

  const handleMapClick = (lat, long) => { // toda vez que voce clicar no mapa, ele vai chamar essa funcao e atualizar a posicao
    atualizarPosicao(lat, long);
  }
  

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        Cidade: {nomeCidade}
      </div>
      <MapContainer center={posicao} zoom={13} style={{ width: '100%', height: '100%' }}>
        <MapViewController center={posicao} />
        <MapClickHandler onLocationSelect={handleMapClick} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Marker position={posicao}>
          <Popup>{nomeCidade}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
  
}

export default MeuMapa;
