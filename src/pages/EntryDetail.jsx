import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Share2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { getEntry, deleteEntry, getMediaByEntry } from '../utils/db';
import { formatDateTime, arrayBufferToObjectURL, MOODS, shareText } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

export default function EntryDetail() {
  const { tripId, entryId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [entry, setEntry] = useState(null);
  const [media, setMedia] = useState([]);
  const [lightbox, setLightbox] = useState(null); // index
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const e = await getEntry(entryId);
      if (!e) { navigate(-1); return; }
      setEntry(e);
      const m = await getMediaByEntry(entryId);
      setMedia(m.filter(x => x.type === 'photo').map(x => ({
        ...x,
        url: arrayBufferToObjectURL(x.data, x.mimeType || 'image/jpeg'),
      })));
      setLoading(false);
    })();
  }, [entryId]);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette entrée ?')) return;
    await deleteEntry(entryId);
    showToast('Entrée supprimée', 'success');
    navigate(`/trips/${tripId}`, { replace: true });
  };

  const handleShare = async () => {
    const text = entry.content?.replace(/<[^>]*>/g, '').slice(0, 200) || '';
    const shared = await shareText(entry.title || 'Mon voyage', text, window.location.href);
    if (!shared) showToast('Lien copié !', 'success');
  };

  // Share image via Web Share API
  const handleSharePhoto = async (photoUrl) => {
    try {
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: entry.title || 'Photo de voyage' });
      } else {
        await handleShare();
      }
    } catch { showToast('Partage non supporté', 'error'); }
  };

  if (loading) return (
    <div className="px-4 pt-6 space-y-4">
      <div className="skeleton h-8 w-64 rounded" />
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
  if (!entry) return null;

  const mood = MOODS.find(m => m.id === entry.mood);

  return (
    <div className="page-enter max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(`/trips/${tripId}`)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1" />
        <button onClick={handleShare} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <Share2 size={18} />
        </button>
        <Link to={`/trips/${tripId}/entry/${entryId}/edit`}>
          <button onClick={() => navigate(`/trips/${tripId}/entry/${entryId}`, { state: { editing: true } })}
            className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
            <Edit3 size={18} />
          </button>
        </Link>
        <Link to={`/trips/${tripId}/entry/new`} state={{ editId: entryId }}>
          <button className="p-2 rounded-xl" style={{ color: '#e05c5c' }} onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        </Link>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Title + meta */}
        <div>
          <h1 className="text-2xl font-display font-bold text-white leading-tight">
            {entry.title || 'Sans titre'}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              📅 {formatDateTime(entry.date || entry.createdAt)}
            </span>
            {mood && (
              <span className="text-sm flex items-center gap-1" style={{ color: mood.color }}>
                {mood.emoji} {mood.label}
              </span>
            )}
            {entry.weather && (
              <span className="text-sm flex items-center gap-1.5 px-2.5 py-1 rounded-full glass">
                {entry.weather.icon} {entry.weather.temp}° {entry.weather.label}
              </span>
            )}
          </div>
          {entry.location?.name && (
            <p className="flex items-center gap-1.5 mt-2 text-sm" style={{ color: 'var(--gold-main)' }}>
              <MapPin size={13} /> {entry.location.name}
            </p>
          )}
        </div>

        {/* Divider */}
        <hr className="divider-gold" />

        {/* Photos */}
        {media.length > 0 && (
          <div>
            <div className="media-grid">
              {media.map((photo, idx) => (
                <div key={photo.id} className="media-item" onClick={() => setLightbox(idx)}>
                  <img src={photo.url} alt={photo.caption || ''} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {entry.content && (
          <div
            className="prose-custom text-base leading-relaxed"
            style={{ color: 'rgba(232,232,245,0.9)', lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        )}

        {/* Tags */}
        {entry.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-2">
            {entry.tags.map(tag => <span key={tag} className="tag-pill">#{tag}</span>)}
          </div>
        )}

        {/* Edit button */}
        <Link to={`/trips/${tripId}/entry/new`}>
          <button
            className="btn-ghost w-full flex items-center justify-center gap-2 py-3"
            onClick={() => navigate(`/trips/${tripId}/entry/${entryId}`)}
          >
            <Edit3 size={16} /> Modifier cette entrée
          </button>
        </Link>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={media[lightbox]?.url}
            alt=""
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: '90dvh' }}
            onClick={e => e.stopPropagation()}
          />
          {/* Nav arrows */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={e => { e.stopPropagation(); setLightbox(l => l - 1); }}
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}
          {lightbox < media.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={e => { e.stopPropagation(); setLightbox(l => l + 1); }}
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          )}
          {/* Share photo */}
          <button
            className="absolute bottom-8 right-4 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            onClick={e => { e.stopPropagation(); handleSharePhoto(media[lightbox]?.url); }}
          >
            <Share2 size={15} /> Partager
          </button>
          <button
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
