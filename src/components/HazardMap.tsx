// @ts-nocheck
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Hazard } from '@/lib/api';
import { useLocation } from '@/contexts/LocationContext';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom icons for different hazard types
const getHazardIcon = (hazardType: string) => {
  const colors: Record<string, string> = {
    accident: '#ef4444',
    pothole: '#f97316',
    flood: '#3b82f6',
    roadblock: '#dc2626',
    'traffic jam': '#eab308',
  };
  
  const color = colors[hazardType.toLowerCase()] || '#f97316';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">⚠️</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const getUserIcon = () => {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="
        background-color: #10b981;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        animation: pulse 2s ease-in-out infinite;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface HazardMapProps {
  hazards: Hazard[];
}

const HazardMap = ({ hazards }: HazardMapProps) => {
  const { currentLocation } = useLocation();
  
  const center: [number, number] = currentLocation
    ? [currentLocation.lat, currentLocation.lon]
    : [40.7128, -74.0060]; // Default to NYC

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
    >
      <MapController center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User location marker */}
      {currentLocation && (
        <Marker
          position={[currentLocation.lat, currentLocation.lon]}
          icon={getUserIcon()}
        >
          <Popup>
            <div className="text-sm font-medium">Your Location</div>
          </Popup>
        </Marker>
      )}

      {/* Hazard markers */}
      {hazards.map((hazard) => {
        const distance = currentLocation
          ? calculateDistance(
              currentLocation.lat,
              currentLocation.lon,
              hazard.location.lat,
              hazard.location.lon
            )
          : 0;

        return (
          <Marker
            key={hazard._id}
            position={[hazard.location.lat, hazard.location.lon]}
            icon={getHazardIcon(hazard.hazard_type)}
          >
            <Popup>
              <div className="space-y-2 min-w-[200px]">
                <h3 className="font-bold text-primary capitalize">{hazard.hazard_type}</h3>
                <p className="text-sm">{hazard.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Reported by: {hazard.user_id}</p>
                  <p>Confidence: {hazard.confidence}%</p>
                  {distance > 0 && <p>Distance: {distance.toFixed(2)} km away</p>}
                  <p>Time: {new Date(hazard.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default HazardMap;
