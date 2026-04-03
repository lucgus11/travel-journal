import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Image, Map, DollarSign, CheckSquare, Share2, Edit3, MoreVertical } from 'lucide-react';
import { getTrip, getEntriesByTrip, getMediaByTrip, getExpensesByTrip, saveTrip, exportTripData } from '../utils/db';
import { formatDate, formatCurrency, getTripStatus, tripDuration, arrayBufferToObjectURL, shareText } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';
import WeatherWidget from '../components/features/WeatherWidget';
import ShareModal from '../components/features/ShareModal';

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [trip, setTrip] = useState(null);
  const [entries, setEntries] = useState([]);
  const [media, setMedia] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    load();
  }, [tripId]);

  const load = async () => {
    const [t, ents, meds, exps] = await Promise.all([
      getTrip(tripId),
      getEntriesByTrip(tripId),
      getMediaByTrip(tripId),
      getExpensesByTrip(tripId),
    ]);
    if (!t) { navigate('/trips', { replace: true }); return; }
    setTrip(t);
    setEntries(ents);
    setMedia(meds);
    setExpenses(exps);
    // Load cover photo
    const firstPhoto = meds.find(m => m.type === 'photo');
    if (firstPhoto?.data) {
      setCoverUrl(arrayBufferToObjectURL(firstPhoto.data, firstPhoto.mimeType || 'image/jpeg'));
    }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const data = await exportTripData(tripId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${trip.name.replace(/\s+/g, '_')}.json`; a.click();
      URL.revokeObjectURL(url);
      showToast('Export téléchargé !', 'success');
    } catch { showToast('Erreur export', 'error'); }
    setMenuOpen(false);
  };

  const handleShare = async () => {
    const shared = await shareText(
      trip.name,
      `${trip.destination ? `📍 ${trip.destination} · ` : ''}${entries.length} notes · ${media.filter(m => m.type === 'photo').length} photos`,
      window.location.href
    );
    if (!shared) showToast('Lien copié !', 'success');
    setMenuOpen(false);
  };

  if (loading) return <TripDetailSkeleton />;
  if (!trip) return null;

  const statusInfo = getTripStatus(trip);
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const budgetPercent = trip.budget ? Math.min(100, (totalSpent / trip.budget) * 100) : null;
  const photos = media.filter(m => m.type === 'photo');

  const SECTIONS = [
    { icon: BookOpen, label: 'Journal', count: `${entries.length} note${entries.length !== 1 ? 's' : ''}`, to: '#entries', color: '#4a90d9' },
    { icon: Image, label: 'Galerie', count: `${photos.length} photo${photos.length !== 1 ? 's' : ''}`, to: `gallery`, color: '#e67e22' },
    { icon: Map, label: 'Carte', count: `${entries.filter(e => e.location?.lat).length} lieux`, to: `map`, color: '#2ecc71' },
    { icon: DollarSign, label: 'Budget', count: trip.budget ? `${Math.round(budgetPercent)}%` : 'Non défini', to: `budget`, color: '#9b59b6' },
    { icon: CheckSquare, label: 'Checklist', count: 'Préparer', to: `checklist`, color: '#e67e22' },
  ];

  return (
    <div className="page-enter max-w-lg mx-auto">
      {/* Hero header */}
      <div className="relative" style={{ height: 220 }}>
        {coverUrl ? (
          <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${trip.color || '#d4a853'}44, ${trip.color || '#4a90d9'}22)` }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(7,7,26,0.95) 100%)' }} />

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={() => navigate('/trips')} className="p-2 rounded-xl glass">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowShare(true)} className="p-2 rounded-xl glass">
              <Share2 size={18} className="text-white" />
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-xl glass">
                <MoreVertical size={18} className="text-white" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 glass rounded-xl overflow-hidden shadow-card z-20 w-44">
                  <button onClick={handleExport} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5">📥 Exporter JSON</button>
                  <button onClick={handleShare} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5">🔗 Partager le lien</button>
                  <Link to={`/trips/new`} className="block px-4 py-3 text-sm text-white hover:bg-white/5">✏️ Modifier</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trip info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{trip.emoji || '✈️'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: statusInfo.color + '33', color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              </div>
              <h1 className="text-2xl font-display font-bold text-white">{trip.name}</h1>
              {trip.destination && (
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>📍 {trip.destination}</p>
              )}
            </div>
            <div className="text-right text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <p>{formatDate(trip.startDate, 'd MMM')}</p>
              {trip.endDate && <p>→ {formatDate(trip.endDate, 'd MMM yy')}</p>}
              <p className="font-bold text-white">{tripDuration(trip.startDate, trip.endDate)}j</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-5">
        {/* Budget progress */}
        {trip.budget && (
          <div className="card p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Budget</span>
              <span className="text-sm font-bold" style={{ color: budgetPercent > 90 ? '#e05c5c' : 'var(--gold-main)' }}>
                {formatCurrency(totalSpent, trip.currency)} / {formatCurrency(trip.budget, trip.currency)}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${budgetPercent}%`, background: budgetPercent > 90 ? 'linear-gradient(90deg,#e05c5c,#ff8080)' : undefined }} />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {formatCurrency(Math.max(0, trip.budget - totalSpent), trip.currency)} restant
            </p>
          </div>
        )}

        {/* Weather (online only) */}
        <WeatherWidget trip={trip} />

        {/* Navigation sections */}
        <div className="grid grid-cols-3 gap-3">
          {SECTIONS.slice(0, 3).map(({ icon: Icon, label, count, to, color }) => (
            <Link key={label} to={to.startsWith('#') ? '#entries' : `/trips/${tripId}/${to}`}>
              <div className="card card-interactive p-3 flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '22' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SECTIONS.slice(3).map(({ icon: Icon, label, count, to, color }) => (
            <Link key={label} to={`/trips/${tripId}/${to}`}>
              <div className="card card-interactive p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '22' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Add entry button */}
        <Link to={`/trips/${tripId}/entry/new`}>
          <button className="btn-gold w-full flex items-center justify-center gap-2 py-3.5">
            <Plus size={18} /> Nouvelle entrée de journal
          </button>
        </Link>

        {/* Journal entries list */}
        <div id="entries">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Journal — {entries.length} entrée{entries.length !== 1 ? 's' : ''}
          </h2>
          {entries.length === 0 ? (
            <div className="card p-6 text-center">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-white font-semibold">Aucune note encore</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Commencez à écrire votre aventure !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <Link key={entry.id} to={`/trips/${tripId}/entry/${entry.id}`}>
                  <EntryRow entry={entry} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />}
      {showShare && <ShareModal trip={trip} entries={entries} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function EntryRow({ entry }) {
  const MOOD_EMOJIS = { amazing: '🤩', happy: '😊', neutral: '😐', tired: '😴', sad: '😢', excited: '🎉' };
  return (
    <div className="card card-interactive p-4">
      <div className="flex items-start gap-3">
        <div className="text-xl mt-0.5 shrink-0">{MOOD_EMOJIS[entry.mood] || '📝'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-white truncate">{entry.title || 'Sans titre'}</p>
            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.date, 'd MMM')}</span>
          </div>
          {entry.location?.name && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>📍 {entry.location.name}</p>
          )}
          {entry.content && (
            <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {entry.content.replace(/<[^>]*>/g, '').slice(0, 120)}
            </p>
          )}
          {entry.tags?.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {entry.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TripDetailSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: 220 }} />
      <div className="px-4 pt-4 space-y-4">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      </div>
    </div>
  );
}
