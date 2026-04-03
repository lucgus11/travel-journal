import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, MoreVertical, MapPin, BookOpen, Image } from 'lucide-react';
import { getAllTrips, deleteTrip, getEntriesByTrip, getMediaByTrip } from '../utils/db';
import { formatDate, getTripStatus, tripDuration } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [tripStats, setTripStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const { showToast } = useApp();
  const [filter, setFilter] = useState('all'); // all | ongoing | upcoming | completed

  const load = async () => {
    const all = await getAllTrips();
    setTrips(all);
    // Load stats per trip
    const stats = {};
    await Promise.all(all.map(async (t) => {
      const [entries, media] = await Promise.all([getEntriesByTrip(t.id), getMediaByTrip(t.id)]);
      stats[t.id] = { entries: entries.length, photos: media.filter(m => m.type === 'photo').length };
    }));
    setTripStats(stats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (tripId, tripName) => {
    if (!confirm(`Supprimer "${tripName}" et toutes ses données ?`)) return;
    await deleteTrip(tripId);
    showToast('Voyage supprimé', 'success');
    setMenuOpen(null);
    load();
  };

  const filtered = trips.filter(t => {
    if (filter === 'all') return true;
    return getTripStatus(t).status === filter;
  });

  const STATUS_FILTERS = [
    { id: 'all', label: 'Tous' },
    { id: 'ongoing', label: '🟢 En cours' },
    { id: 'upcoming', label: '🔵 À venir' },
    { id: 'completed', label: '✅ Terminés' },
  ];

  return (
    <div className="page-enter px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Mes Voyages</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{trips.length} carnet{trips.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/trips/new">
          <button className="btn-gold flex items-center gap-2 text-sm px-4 py-2.5">
            <Plus size={16} /> Nouveau
          </button>
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f.id ? 'rgba(212,168,83,0.2)' : 'rgba(255,255,255,0.06)',
              color: filter === f.id ? 'var(--gold-light)' : 'var(--text-muted)',
              border: `1px solid ${filter === f.id ? 'var(--gold-dim)' : 'transparent'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">✈️</div>
          <p className="text-white font-semibold mb-1">Aucun voyage</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {filter === 'all' ? 'Créez votre premier carnet de voyage !' : 'Aucun voyage dans cette catégorie.'}
          </p>
          {filter === 'all' && (
            <Link to="/trips/new"><button className="btn-gold">Créer un voyage</button></Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(trip => {
            const statusInfo = getTripStatus(trip);
            const stats = tripStats[trip.id] || { entries: 0, photos: 0 };
            return (
              <div key={trip.id} className="card card-interactive relative overflow-hidden">
                {/* Color accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: trip.color || '#d4a853' }} />

                <Link to={`/trips/${trip.id}`} className="block p-4 pl-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="text-2xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: (trip.color || '#d4a853') + '22' }}
                    >
                      {trip.emoji || '🌍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white truncate">{trip.name}</h3>
                        <span
                          className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: statusInfo.color + '22', color: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      {trip.destination && (
                        <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          <MapPin size={11} /> {trip.destination}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          📅 {formatDate(trip.startDate, 'd MMM yy')}
                          {trip.endDate && ` – ${formatDate(trip.endDate, 'd MMM yy')}`}
                        </span>
                        {trip.startDate && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            ⏱ {tripDuration(trip.startDate, trip.endDate)}j
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <BookOpen size={11} /> {stats.entries} note{stats.entries !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Image size={11} /> {stats.photos} photo{stats.photos !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    {/* Menu button */}
                    <button
                      onClick={(e) => { e.preventDefault(); setMenuOpen(menuOpen === trip.id ? null : trip.id); }}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </Link>

                {/* Dropdown menu */}
                {menuOpen === trip.id && (
                  <div className="absolute right-3 top-12 z-10 glass rounded-xl overflow-hidden shadow-card">
                    <button
                      onClick={() => handleDelete(trip.id, trip.name)}
                      className="flex items-center gap-2 px-4 py-3 text-sm w-full text-left hover:bg-white/5"
                      style={{ color: '#e05c5c' }}
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tap outside to close menu */}
      {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
