import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Download, Share2, Camera, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { getMediaByTrip, saveMedia, deleteMedia } from '../utils/db';
import { uuid, arrayBufferToObjectURL, loadImageFromBuffer, downloadCanvas, fileToArrayBuffer, compressImage } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';
import PhotoMontage from '../components/features/PhotoMontage';

export default function Gallery() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const fileInputRef = useRef(null);

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [selectedForMontage, setSelectedForMontage] = useState([]);
  const [showMontage, setShowMontage] = useState(false);
  const [tab, setTab] = useState('photos'); // photos | videos | montage

  useEffect(() => { load(); }, [tripId]);

  const load = async () => {
    const all = await getMediaByTrip(tripId);
    setMedia(all.map(m => ({
      ...m,
      url: arrayBufferToObjectURL(m.data, m.mimeType || (m.type === 'video' ? 'video/mp4' : 'image/jpeg')),
    })));
    setLoading(false);
  };

  const handleAddPhoto = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const isVideo = file.type.startsWith('video/');
        let buffer, mimeType;
        if (isVideo) {
          buffer = await fileToArrayBuffer(file);
          mimeType = file.type;
        } else {
          const result = await compressImage(file, 2048, 0.88);
          buffer = result.buffer;
          mimeType = result.type;
        }
        const mediaRecord = {
          id: uuid(), tripId, entryId: null,
          type: isVideo ? 'video' : 'photo',
          data: buffer, mimeType,
          caption: '', createdAt: new Date().toISOString(),
        };
        await saveMedia(mediaRecord);
        setMedia(prev => [...prev, { ...mediaRecord, url: arrayBufferToObjectURL(buffer, mimeType) }]);
        showToast(isVideo ? 'Vidéo ajoutée !' : 'Photo ajoutée !', 'success');
      } catch { showToast('Erreur lors du chargement', 'error'); }
    }
    e.target.value = '';
  };

  const handleDelete = async (item) => {
    if (!confirm('Supprimer ce média ?')) return;
    await deleteMedia(item.id);
    URL.revokeObjectURL(item.url);
    setMedia(prev => prev.filter(m => m.id !== item.id));
    setLightbox(null);
    showToast('Supprimé', 'success');
  };

  const toggleMontageSelect = (item) => {
    if (item.type !== 'photo') return;
    setSelectedForMontage(prev =>
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  };

  const photos = media.filter(m => m.type === 'photo');
  const videos = media.filter(m => m.type === 'video');
  const displayMedia = tab === 'videos' ? videos : photos;

  return (
    <div className="page-enter max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display font-bold text-white text-lg">Galerie</h1>
        {selectedForMontage.length >= 2 && (
          <button
            onClick={() => { setShowMontage(true); setTab('montage'); }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold"
            style={{ background: 'rgba(212,168,83,0.15)', color: 'var(--gold-main)' }}
          >
            <Layers size={14} /> Montage ({selectedForMontage.length})
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl" style={{ color: 'var(--gold-main)' }}>
          <Plus size={20} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple capture="environment" className="hidden" onChange={handleAddPhoto} />
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-3 gap-2">
        {[
          { id: 'photos', label: `📷 Photos (${photos.length})` },
          { id: 'videos', label: `🎥 Vidéos (${videos.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setShowMontage(false); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: tab === t.id ? 'rgba(212,168,83,0.15)' : 'rgba(255,255,255,0.05)',
              color: tab === t.id ? 'var(--gold-main)' : 'var(--text-muted)',
              border: `1px solid ${tab === t.id ? 'var(--gold-dim)' : 'transparent'}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {/* Montage tip */}
        {tab === 'photos' && photos.length >= 2 && selectedForMontage.length === 0 && (
          <p className="text-xs text-center mb-3 py-2 rounded-lg" style={{ background: 'rgba(212,168,83,0.06)', color: 'var(--text-muted)' }}>
            💡 Appuyez longuement sur les photos pour créer un montage
          </p>
        )}

        {loading ? (
          <div className="media-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton aspect-square rounded-xl" />)}</div>
        ) : displayMedia.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">{tab === 'videos' ? '🎬' : '📷'}</div>
            <p className="text-white font-semibold mb-1">Aucun {tab === 'videos' ? 'vidéo' : 'photo'}</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Ajoutez vos premiers souvenirs visuels !</p>
            <button onClick={() => fileInputRef.current?.click()} className="btn-gold flex items-center gap-2 mx-auto">
              <Camera size={16} /> Ajouter
            </button>
          </div>
        ) : (
          <div className="media-grid">
            {displayMedia.map((item, idx) => {
              const isSelected = selectedForMontage.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="media-item relative"
                  onClick={() => setLightbox(displayMedia.findIndex(m => m.id === item.id))}
                  onContextMenu={e => { e.preventDefault(); toggleMontageSelect(item); }}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt="" loading="lazy" />
                  )}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <span className="text-white text-sm">▶</span>
                      </div>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                      style={{ background: 'rgba(212,168,83,0.35)', border: '2px solid var(--gold-main)' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: 'var(--gold-main)', color: '#07071a' }}>
                        {selectedForMontage.indexOf(item.id) + 1}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Add more button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}
            >
              <Plus size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Montage creator */}
      {showMontage && selectedForMontage.length >= 2 && (
        <div className="px-4 pb-8">
          <PhotoMontage
            photos={media.filter(m => selectedForMontage.includes(m.id))}
            onClose={() => { setShowMontage(false); setSelectedForMontage([]); }}
          />
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.97)' }}
          onClick={() => setLightbox(null)}
        >
          <div className="flex items-center justify-between p-4" onClick={e => e.stopPropagation()}>
            <span className="text-white/60 text-sm">{lightbox + 1} / {displayMedia.length}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(displayMedia[lightbox])}
                className="p-2 rounded-xl" style={{ background: 'rgba(224,92,92,0.15)', color: '#e05c5c' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
            {displayMedia[lightbox]?.type === 'video' ? (
              <video src={displayMedia[lightbox].url} controls className="max-w-full max-h-full rounded-xl" style={{ maxHeight: '70dvh' }} />
            ) : (
              <img src={displayMedia[lightbox]?.url} alt="" className="max-w-full max-h-full object-contain rounded-xl" style={{ maxHeight: '70dvh' }} />
            )}
          </div>
          <div className="flex items-center justify-between p-6" onClick={e => e.stopPropagation()}>
            <button
              disabled={lightbox === 0}
              className="p-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={() => setLightbox(l => l - 1)}
            >
              <ChevronLeft size={22} className="text-white" />
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={() => toggleMontageSelect(displayMedia[lightbox])}
            >
              <Layers size={15} />
              {selectedForMontage.includes(displayMedia[lightbox]?.id) ? 'Retirer du montage' : 'Ajouter au montage'}
            </button>
            <button
              disabled={lightbox === displayMedia.length - 1}
              className="p-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={() => setLightbox(l => l + 1)}
            >
              <ChevronRight size={22} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
