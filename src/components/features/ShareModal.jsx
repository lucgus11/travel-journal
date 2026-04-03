import { useState, useRef, useEffect } from 'react';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { getMediaByTrip } from '../../utils/db';
import { arrayBufferToObjectURL, formatDate, tripDuration, shareText, downloadCanvas } from '../../utils/helpers';
import { useApp } from '../../contexts/AppContext';

export default function ShareModal({ trip, entries, onClose }) {
  const { showToast } = useApp();
  const canvasRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [template, setTemplate] = useState('story'); // story | landscape | square
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    (async () => {
      const media = await getMediaByTrip(trip.id);
      const p = media.filter(m => m.type === 'photo').map(m => ({
        ...m, url: arrayBufferToObjectURL(m.data, m.mimeType || 'image/jpeg')
      }));
      setPhotos(p);
      if (p.length > 0) setSelectedPhoto(p[0]);
    })();
  }, [trip.id]);

  useEffect(() => {
    if (selectedPhoto || photos.length === 0) renderStory();
  }, [selectedPhoto, template, trip, entries]);

  const renderStory = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);

    const dims = { story: [1080, 1920], landscape: [1920, 1080], square: [1080, 1080] };
    const [W, H] = dims[template];
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0d0d1a');
    grad.addColorStop(0.5, '#0d1a2e');
    grad.addColorStop(1, '#1a0d1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Background photo (blurred)
    if (selectedPhoto) {
      try {
        const img = await loadImg(selectedPhoto.url);
        ctx.save();
        ctx.filter = 'blur(40px) brightness(0.4)';
        const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
        ctx.filter = 'none';
        ctx.restore();
      } catch {}
    }

    // Main photo card
    if (selectedPhoto) {
      try {
        const img = await loadImg(selectedPhoto.url);
        const photoH = H * (template === 'story' ? 0.55 : 0.65);
        const photoY = H * (template === 'story' ? 0.08 : 0.17);
        const photoW = W * 0.88;
        const photoX = (W - photoW) / 2;
        // Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#000';
        roundRect(ctx, photoX, photoY, photoW, photoH, 24);
        ctx.fill();
        ctx.restore();
        // Image
        ctx.save();
        roundRect(ctx, photoX, photoY, photoW, photoH, 24);
        ctx.clip();
        const s = Math.max(photoW / img.naturalWidth, photoH / img.naturalHeight);
        ctx.drawImage(img, photoX + (photoW - img.naturalWidth * s) / 2, photoY + (photoH - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
        ctx.restore();
      } catch {}
    }

    // Text content
    const textY = H * (template === 'story' ? 0.67 : 0.72);

    // Trip name
    ctx.save();
    ctx.font = `bold ${Math.floor(W / 16)}px 'Playfair Display', Georgia, serif`;
    ctx.fillStyle = '#d4a853';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 20;
    ctx.fillText(trip.name, W / 2, textY);
    ctx.restore();

    // Destination
    if (trip.destination) {
      ctx.save();
      ctx.font = `600 ${Math.floor(W / 30)}px Nunito, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(`📍 ${trip.destination}`, W / 2, textY + Math.floor(W / 14));
      ctx.restore();
    }

    // Stats
    const statsY = textY + Math.floor(W / 14) * 2 + 10;
    const stats = [`✈️ ${tripDuration(trip.startDate, trip.endDate)} jours`, `📝 ${entries.length} entrées`, `📷 ${photos.length} photos`];
    ctx.save();
    ctx.font = `${Math.floor(W / 38)}px Nunito, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(stats.join('  ·  '), W / 2, statsY);
    ctx.restore();

    // Dates
    if (trip.startDate) {
      ctx.save();
      ctx.font = `500 ${Math.floor(W / 40)}px Nunito, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText(`${formatDate(trip.startDate, 'd MMM yyyy')}${trip.endDate ? ` — ${formatDate(trip.endDate, 'd MMM yyyy')}` : ''}`, W / 2, statsY + Math.floor(W / 22));
      ctx.restore();
    }

    // Watermark
    ctx.save();
    ctx.font = `400 ${Math.floor(W / 55)}px Nunito, sans-serif`;
    ctx.fillStyle = 'rgba(212,168,83,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('Carnet de Voyage ✈️', W / 2, H - 40);
    ctx.restore();

    setRendering(false);
  };

  const loadImg = (src) => new Promise((res, rej) => {
    const i = new Image(); i.crossOrigin = 'anonymous';
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });

  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `${trip.name.replace(/\s+/g, '_')}_story.jpg`);
    showToast('Story téléchargée !', 'success');
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: trip.name, text: `Mon voyage: ${trip.name}` });
      } else {
        handleDownload();
      }
    }, 'image/jpeg', 0.92);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    showToast('Lien copié !', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="w-full max-w-lg mx-auto" style={{ background: 'var(--bg-card)', borderRadius: '24px 24px 0 0', maxHeight: '90dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white text-lg">Partager</h3>
            <button onClick={onClose} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>

          {/* Template selector */}
          <div className="flex gap-2">
            {[['story', '📱 Story'], ['landscape', '🖼️ Paysage'], ['square', '⬛ Carré']].map(([id, label]) => (
              <button key={id} onClick={() => setTemplate(id)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: template === id ? 'rgba(212,168,83,0.2)' : 'rgba(255,255,255,0.05)',
                  color: template === id ? 'var(--gold-main)' : 'var(--text-muted)',
                  border: `1px solid ${template === id ? 'var(--gold-dim)' : 'transparent'}`,
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative overflow-hidden rounded-2xl"
              style={{ width: template === 'story' ? 160 : 240, height: template === 'story' ? 284 : 135, background: '#0d0d1a' }}>
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
              {rendering && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <p className="text-white text-xs">Rendu...</p>
                </div>
              )}
            </div>
          </div>

          {/* Photo selector */}
          {photos.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Photo principale</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map(p => (
                  <img key={p.id} src={p.url} alt=""
                    className="w-14 h-14 object-cover rounded-xl cursor-pointer shrink-0 transition-all"
                    style={{ border: `2px solid ${selectedPhoto?.id === p.id ? 'var(--gold-main)' : 'transparent'}`, opacity: selectedPhoto?.id === p.id ? 1 : 0.6 }}
                    onClick={() => setSelectedPhoto(p)} />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <button onClick={handleShare} className="btn-gold w-full flex items-center justify-center gap-2 py-3.5">
              <Share2 size={17} /> Partager la story
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleDownload} className="btn-ghost flex items-center justify-center gap-2 py-3 text-sm">
                <Download size={15} /> Télécharger
              </button>
              <button onClick={handleCopyLink} className="btn-ghost flex items-center justify-center gap-2 py-3 text-sm">
                {copied ? <Check size={15} style={{ color: '#2ecc71' }} /> : <Copy size={15} />}
                {copied ? 'Copié !' : 'Copier lien'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
