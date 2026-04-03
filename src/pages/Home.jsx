import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Camera, BookOpen, TrendingUp, Globe, Image, Star } from 'lucide-react';
import { getAllTrips, getEntriesByTrip } from '../utils/db';
import { formatDate, formatDateShort, getTripStatus, tripDuration, TRIP_COLORS } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

const QUOTES = [
  "Le monde est un livre et ceux qui ne voyagent pas n'en lisent qu'une page.",
  "Voyager c'est vivre.",
  "L'aventure commence là où finissent tes plans.",
  "Chaque voyage est une renaissance.",
  "Les voyages forment la jeunesse… et le reste aussi.",
];

export default function Home() {
  const [trips, setTrips] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { stats, refreshStats } = useApp();
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  useEffect(() => {
    (async () => {
      const allTrips = await getAllTrips();
      setTrips(allTrips);
      // Get recent entries from all trips
      const allEntries = [];
      for (const trip of allTrips.slice(0, 3)) {
        const entries = await getEntriesByTrip(trip.id);
        allEntries.push(...entries.map(e => ({ ...e, tripName: trip.name, tripColor: trip.color })));
      }
      allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentEntries(allEntries.slice(0, 5));
      await refreshStats();
      setLoading(false);
    })();
  }, []);

  const ongoingTrip = trips.find(t => getTripStatus(t).status === 'ongoing');
  const upcomingTrips = trips.filter(t => getTripStatus(t).status === 'upcoming');
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 6) return 'Bonne nuit 🌙';
    if (h < 12) return 'Bonjour ☀️';
    if (h < 18) return 'Bon après-midi 🌤️';
    return 'Bonsoir 🌙';
  };

  if (loading) return <HomeSkeletons />;

  return (
    <div className="page-enter px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{greeting()}</p>
        <h1 className="text-3xl font-display font-bold text-white mt-1">Carnet de Voyage</h1>
        <p className="text-sm mt-2 italic" style={{ color: 'var(--text-muted)' }}>"{quote}"</p>
      </div>

      {/* Ongoing trip hero */}
      {ongoingTrip ? (
        <Link to={`/trips/${ongoingTrip.id}`}>
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 180 }}>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${ongoingTrip.color || '#d4a853'}33, ${ongoingTrip.color || '#4a90d9'}22)`,
              }}
            />
            <div className="absolute inset-0 p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#2ecc7133', color: '#2ecc71' }}>
                    🟢 En cours
                  </span>
                  <h2 className="text-2xl font-display font-bold text-white mt-2">{ongoingTrip.name}</h2>
                  <p className="text-sm flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <MapPin size={12} /> {ongoingTrip.destination || 'Destination inconnue'}
                  </p>
                </div>
                <div className="text-4xl">{ongoingTrip.emoji || '✈️'}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  📅 Jour {tripDuration(ongoingTrip.startDate, new Date().toISOString().slice(0, 10))}
                </span>
                {ongoingTrip.endDate && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    🏁 Fin le {formatDateShort(ongoingTrip.endDate)}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute inset-0 border border-white/10 rounded-2xl" />
          </div>
        </Link>
      ) : (
        <Link to="/trips/new">
          <div
            className="rounded-2xl p-5 flex items-center gap-4 card card-interactive"
            style={{ borderStyle: 'dashed', borderColor: 'var(--gold-dim)' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(212,168,83,0.1)' }}
            >
              ✈️
            </div>
            <div>
              <p className="font-semibold text-white">Commencer un voyage</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {trips.length === 0 ? 'Créez votre premier carnet' : 'Planifiez votre prochaine aventure'}
              </p>
            </div>
            <Plus size={20} className="ml-auto" style={{ color: 'var(--gold-main)' }} />
          </div>
        </Link>
      )}

      {/* Quick actions */}
      {ongoingTrip && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen, label: 'Journal', to: `/trips/${ongoingTrip.id}/entry/new`, color: '#4a90d9' },
            { icon: Camera, label: 'Galerie', to: `/trips/${ongoingTrip.id}/gallery`, color: '#e67e22' },
            { icon: MapPin, label: 'Carte', to: `/trips/${ongoingTrip.id}/map`, color: '#2ecc71' },
          ].map(({ icon: Icon, label, to, color }) => (
            <Link key={label} to={to}>
              <div className="card card-interactive p-4 flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '22' }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && stats.tripsCount > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Vos aventures
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Globe, value: stats.tripsCount, label: 'Voyages', color: '#d4a853' },
              { icon: BookOpen, value: stats.entriesCount, label: 'Entrées', color: '#4a90d9' },
              { icon: Image, value: stats.photosCount, label: 'Photos', color: '#e67e22' },
              { icon: Star, value: stats.countriesCount, label: 'Pays', color: '#2ecc71' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="stat-badge flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming trips */}
      {upcomingTrips.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            À venir
          </h3>
          <div className="space-y-2">
            {upcomingTrips.slice(0, 2).map(trip => (
              <Link key={trip.id} to={`/trips/${trip.id}`}>
                <div className="card card-interactive p-4 flex items-center gap-3">
                  <div className="text-2xl">{trip.emoji || '🌍'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{trip.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      📅 {formatDate(trip.startDate)} · {tripDuration(trip.startDate, trip.endDate)}j
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#4a90d922', color: '#4a90d9' }}>
                    À venir
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Dernières notes
          </h3>
          <div className="space-y-2">
            {recentEntries.map(entry => (
              <Link key={entry.id} to={`/trips/${entry.tripId}/entry/${entry.id}`}>
                <div className="card card-interactive p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl mt-0.5">{entry.mood === 'amazing' ? '🤩' : entry.mood === 'happy' ? '😊' : entry.mood === 'excited' ? '🎉' : '📝'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-white truncate">{entry.title || 'Sans titre'}</p>
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDateShort(entry.date)}</span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        <span style={{ color: entry.tripColor || 'var(--gold-main)' }}>●</span> {entry.tripName}
                        {entry.location?.name && ` · 📍 ${entry.location.name}`}
                      </p>
                      {entry.content && (
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                          {entry.content.replace(/<[^>]*>/g, '').slice(0, 100)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {trips.length === 0 && (
        <div className="text-center py-10">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-display font-bold text-white mb-2">Prêt à partir ?</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Créez votre premier carnet de voyage et commencez à capturer vos aventures.
          </p>
          <Link to="/trips/new">
            <button className="btn-gold">✈️ Créer mon premier voyage</button>
          </Link>
        </div>
      )}
    </div>
  );
}

function HomeSkeletons() {
  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
    </div>
  );
}
