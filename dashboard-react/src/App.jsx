import React from 'react';
import './App.css'
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

function MeuMapa() {
 

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


  return (
    <MapContainer
      center={posicaoInicial}
      zoom={13}
      style={{ width: '100%', height: '100vh' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      <Marker position={posicaoInicial}>
        <Popup>
          Localização atual
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default MeuMapa;
