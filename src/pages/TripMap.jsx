import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getTrip, getEntriesByTrip } from '../utils/db';
import { formatDate, getCurrentPosition } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createGoldIcon = (number) => L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#d4a853,#f0c75a);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(212,168,83,0.5);border:2px solid rgba(255,255,255,0.3)">
    <span style="transform:rotate(45deg);color:#07071a;font-weight:bold;font-size:12px;font-family:Nunito">${number}</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 12); }, [center]);
  return null;
}

export default function TripMap() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { online } = useApp();
  const [trip, setTrip] = useState(null);
  const [entries, setEntries] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [recenter, setRecenter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, ents] = await Promise.all([getTrip(tripId), getEntriesByTrip(tripId)]);
      setTrip(t);
      setEntries(ents);
      setLoading(false);
    })();
  }, [tripId]);

  const geoEntries = entries.filter(e => e.location?.lat && e.location?.lng);
  const center = geoEntries.length > 0
    ? [geoEntries[0].location.lat, geoEntries[0].location.lng]
    : [48.8566, 2.3522]; // Paris fallback

  const handleLocate = async () => {
    try {
      const pos = await getCurrentPosition();
      const c = [pos.coords.latitude, pos.coords.longitude];
      setUserPos(c);
      setRecenter(c);
    } catch { alert('Impossible d\'obtenir votre position'); }
  };

  const polylinePoints = geoEntries
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(e => [e.location.lat, e.location.lng]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="text-center">
        <div className="text-4xl mb-2">🗺️</div>
        <p style={{ color: 'var(--text-muted)' }}>Chargement de la carte...</p>
      </div>
    </div>
  );

  return (
    <div className="page-enter flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="shrink-0 glass px-4 py-3 flex items-center gap-2 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-bold text-white">{trip?.name}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{geoEntries.length} lieu{geoEntries.length !== 1 ? 'x' : ''} géolocalisé{geoEntries.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleLocate} className="ml-auto p-2 rounded-xl" style={{ color: 'var(--gold-main)' }}>
          <Navigation size={18} />
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!online && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(0,0,0,0.8)', color: '#e67e22', border: '1px solid #e67e2233' }}>
            📡 Cartes partiellement disponibles hors-ligne
          </div>
        )}
        <MapContainer
          center={center}
          zoom={geoEntries.length > 0 ? 10 : 5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {recenter && <RecenterMap center={recenter} />}

          {/* Route polyline */}
          {polylinePoints.length > 1 && (
            <Polyline
              positions={polylinePoints}
              pathOptions={{ color: '#d4a853', weight: 3, opacity: 0.7, dashArray: '8,6' }}
            />
          )}

          {/* Entry markers */}
          {geoEntries
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((entry, idx) => (
              <Marker
                key={entry.id}
                position={[entry.location.lat, entry.location.lng]}
                icon={createGoldIcon(idx + 1)}
              >
                <Popup>
                  <div style={{ fontFamily: 'Nunito, sans-serif', minWidth: '180px' }}>
                    <p style={{ fontWeight: '700', color: '#e8e8f5', margin: '0 0 4px' }}>
                      {entry.title || 'Sans titre'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#8888aa', margin: '0 0 8px' }}>
                      📅 {formatDate(entry.date, 'd MMM yyyy')}
                    </p>
                    {entry.location.name && (
                      <p style={{ fontSize: '12px', color: '#d4a853', margin: '0 0 8px' }}>
                        📍 {entry.location.name}
                      </p>
                    )}
                    <a
                      href={`/trips/${tripId}/entry/${entry.id}`}
                      style={{ display: 'inline-block', fontSize: '12px', color: '#4a90d9', textDecoration: 'none', fontWeight: '600' }}
                    >
                      Voir l'entrée →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* User position */}
          {userPos && (
            <Marker position={userPos}>
              <Popup><p style={{ fontFamily: 'Nunito', color: '#e8e8f5', margin: 0 }}>📍 Vous êtes ici</p></Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Bottom entries list */}
      {geoEntries.length > 0 && (
        <div className="shrink-0 glass" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Itinéraire
            </p>
          </div>
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
            {geoEntries
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((entry, idx) => (
                <Link key={entry.id} to={`/trips/${tripId}/entry/${entry.id}`} className="shrink-0">
                  <div className="card p-3 w-36">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'var(--gold-main)', color: '#07071a' }}>
                        {idx + 1}
                      </div>
                      <p className="text-xs font-bold text-white truncate">{entry.title || 'Sans titre'}</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {formatDate(entry.date, 'd MMM')}
                    </p>
                    {entry.location.name && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--gold-main)', fontSize: '10px' }}>
                        📍 {entry.location.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {geoEntries.length === 0 && !loading && (
        <div className="shrink-0 p-4 text-center glass">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            🗺️ Aucune entrée géolocalisée. Activez la géolocalisation lors de vos prochaines notes !
          </p>
        </div>
      )}
    </div>
  );
}
