import { useState, useEffect } from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import { getWeatherInfo } from '../../utils/helpers';
import { useApp } from '../../contexts/AppContext';

export default function WeatherWidget({ trip }) {
  const { online } = useApp();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (online && trip?.destination) fetchWeather();
  }, [trip?.destination, online]);

  const fetchWeather = async () => {
    if (!online || !trip) return;
    setLoading(true);
    setError(false);
    try {
      // Geocode destination to lat/lng
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trip.destination || trip.name)}&format=json&limit=1&accept-language=fr`
      );
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error('Not found');
      const { lat, lon } = geoData[0];

      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`
      );
      const wData = await wRes.json();
      const curr = wData.current;
      const info = getWeatherInfo(curr.weather_code);
      setWeather({
        temp: Math.round(curr.temperature_2m),
        code: curr.weather_code,
        label: info.label,
        icon: info.icon,
        wind: Math.round(curr.wind_speed_10m),
        humidity: curr.relative_humidity_2m,
        daily: (wData.daily?.time || []).slice(0, 3).map((d, i) => ({
          date: d,
          max: Math.round(wData.daily.temperature_2m_max[i]),
          min: Math.round(wData.daily.temperature_2m_min[i]),
          code: getWeatherInfo(0).icon,
        })),
      });
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  if (!online) return null;
  if (!trip?.destination && !trip?.name) return null;

  if (loading) return (
    <div className="card p-4 flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-xl" />
      <div className="flex-1">
        <div className="skeleton h-4 w-24 rounded mb-2" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
    </div>
  );

  if (error) return (
    <div className="card p-4 flex items-center gap-3">
      <Cloud size={20} style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>Météo indisponible</p>
      <button onClick={fetchWeather} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
        <RefreshCw size={14} />
      </button>
    </div>
  );

  if (!weather) return null;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            Météo à {trip.destination}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <span className="text-3xl font-display font-bold text-white">{weather.temp}°C</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{weather.label}</p>
            </div>
          </div>
        </div>
        <button onClick={fetchWeather} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={15} />
        </button>
      </div>
      <div className="flex gap-4 mb-3">
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          💨 {weather.wind} km/h
        </span>
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          💧 {weather.humidity}%
        </span>
      </div>
      {weather.daily?.length > 0 && (
        <div className="flex gap-2">
          {weather.daily.map((d, i) => (
            <div key={d.date} className="flex-1 text-center py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                {i === 0 ? "Auj." : i === 1 ? 'Dem.' : 'Apr.'}
              </p>
              <p className="text-sm">{d.code || '🌤️'}</p>
              <p className="text-xs font-bold text-white">{d.max}°</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.min}°</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
