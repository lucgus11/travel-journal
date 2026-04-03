import { useState, useRef, useEffect } from 'react';
import { Download, Share2, X, Sliders } from 'lucide-react';
import { loadImageFromBuffer, downloadCanvas } from '../../utils/helpers';
import { useApp } from '../../contexts/AppContext';

const LAYOUTS = [
  { id: 'grid2', label: '2×1', cols: 2, rows: 1 },
  { id: 'grid4', label: '2×2', cols: 2, rows: 2 },
  { id: 'grid3h', label: '3×1', cols: 3, rows: 1 },
  { id: 'story', label: 'Story', cols: 1, rows: 3 },
  { id: 'featured', label: 'En vedette', cols: 2, rows: 2, featured: true },
];

const FILTERS = [
  { id: 'none', label: 'Original', filter: '' },
  { id: 'warm', label: 'Chaud', filter: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)' },
  { id: 'cool', label: 'Frais', filter: 'saturate(0.8) hue-rotate(30deg) brightness(1.05)' },
  { id: 'vintage', label: 'Vintage', filter: 'sepia(0.5) contrast(0.9) brightness(0.9)' },
  { id: 'bw', label: 'N&B', filter: 'grayscale(1)' },
  { id: 'vivid', label: 'Vif', filter: 'saturate(1.8) contrast(1.1)' },
  { id: 'fade', label: 'Fané', filter: 'opacity(0.85) saturate(0.7) brightness(1.1)' },
];

export default function PhotoMontage({ photos, onClose }) {
  const canvasRef = useRef(null);
  const { showToast } = useApp();
  const [layout, setLayout] = useState(LAYOUTS[0]);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [gap, setGap] = useState(8);
  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    renderMontage();
  }, [layout, filter, gap]);

  const renderMontage = async () => {
    if (!photos || photos.length === 0) return;
    setRendering(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas dimensions (story or landscape)
    const isStory = layout.id === 'story';
    const W = isStory ? 1080 : 1080;
    const H = isStory ? 1920 : 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    // Load images
    const images = await Promise.all(
      photos.slice(0, layout.cols * layout.rows).map(p =>
        loadImageFromBuffer(p.data, p.mimeType || 'image/jpeg').catch(() => null)
      )
    );

    const G = gap;
    const padding = 20;

    if (layout.id === 'featured') {
      // Large + 3 small
      const mainW = Math.floor((W - padding * 2 - G) * 0.65);
      const mainH = H - padding * 2;
      const sideW = W - padding * 2 - mainW - G;
      const sideH = Math.floor((mainH - G * 2) / 3);

      drawImage(ctx, images[0], padding, padding, mainW, mainH, filter.filter);
      for (let i = 0; i < 3; i++) {
        drawImage(ctx, images[i + 1] || images[0], padding + mainW + G, padding + i * (sideH + G), sideW, sideH, filter.filter);
      }
    } else {
      const cellW = Math.floor((W - padding * 2 - G * (layout.cols - 1)) / layout.cols);
      const cellH = Math.floor((H - padding * 2 - G * (layout.rows - 1)) / layout.rows);

      let imgIdx = 0;
      for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.cols; col++) {
          const x = padding + col * (cellW + G);
          const y = padding + row * (cellH + G);
          drawImage(ctx, images[imgIdx % images.length], x, y, cellW, cellH, filter.filter);
          imgIdx++;
        }
      }
    }

    // Overlay text
    if (text.trim()) {
      ctx.save();
      const fontSize = Math.floor(W / 18);
      ctx.font = `bold ${fontSize}px 'Playfair Display', Georgia, serif`;
      ctx.fillStyle = textColor;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 20;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, W / 2, H - padding - 20);
      ctx.restore();
    }

    // Watermark
    ctx.save();
    ctx.font = `500 ${Math.floor(W / 55)}px Nunito, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Carnet de Voyage ✈️', W - padding, H - padding);
    ctx.restore();

    setRendering(false);
    setRendered(true);
  };

  const drawImage = (ctx, img, x, y, w, h, cssFilter) => {
    if (!img) {
      ctx.fillStyle = '#1a1a38';
      roundRect(ctx, x, y, w, h, 12);
      ctx.fill();
      return;
    }

    ctx.save();
    roundRect(ctx, x, y, w, h, 12);
    ctx.clip();

    // Apply filter via offscreen canvas
    if (cssFilter) {
      const offscreen = document.createElement('canvas');
      offscreen.width = w; offscreen.height = h;
      const octx = offscreen.getContext('2d');
      octx.filter = cssFilter;
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      octx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
      ctx.drawImage(offscreen, x, y);
    } else {
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
    }
    ctx.restore();
  };

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
    downloadCanvas(canvasRef.current, `montage-${Date.now()}.jpg`);
    showToast('Montage téléchargé !', 'success');
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'montage.jpg', { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Mon montage de voyage' });
          showToast('Partagé !', 'success');
        } catch { showToast('Partage annulé', 'info'); }
      } else {
        handleDownload();
      }
    }, 'image/jpeg', 0.92);
  };

  const handleRenderText = async () => { await renderMontage(); };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-white">Créateur de montage</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Canvas preview */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: '#0d0d1a', aspectRatio: layout.id === 'story' ? '9/16' : '1/1' }}>
        <canvas ref={canvasRef} className="montage-canvas w-full h-full object-contain" />
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <p className="text-white text-sm">✨ Rendu en cours...</p>
          </div>
        )}
      </div>

      {/* Layout picker */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Disposition</p>
        <div className="flex gap-2 flex-wrap">
          {LAYOUTS.map(l => (
            <button
              key={l.id}
              onClick={() => setLayout(l)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: layout.id === l.id ? 'rgba(212,168,83,0.2)' : 'rgba(255,255,255,0.05)',
                color: layout.id === l.id ? 'var(--gold-main)' : 'var(--text-muted)',
                border: `1px solid ${layout.id === l.id ? 'var(--gold-dim)' : 'transparent'}`,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter picker */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Filtre</p>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filter.id === f.id ? 'rgba(212,168,83,0.2)' : 'rgba(255,255,255,0.05)',
                color: filter.id === f.id ? 'var(--gold-main)' : 'var(--text-muted)',
                border: `1px solid ${filter.id === f.id ? 'var(--gold-dim)' : 'transparent'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gap slider */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          Espacement: {gap}px
        </p>
        <input type="range" min="0" max="30" value={gap} onChange={e => setGap(Number(e.target.value))} />
      </div>

      {/* Text overlay */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Texte</p>
        <div className="flex gap-2">
          <input
            className="input-dark flex-1 text-sm"
            placeholder="Ex: Tokyo 2025 ✈️"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRenderText()}
          />
          <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
            className="w-12 h-12 rounded-xl cursor-pointer" style={{ background: 'none', border: '1px solid var(--border)' }} />
          <button onClick={handleRenderText} className="btn-ghost text-sm px-3 py-2">
            <Sliders size={15} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleDownload} disabled={!rendered} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm py-3">
          <Download size={15} /> Télécharger
        </button>
        <button onClick={handleShare} disabled={!rendered} className="btn-gold flex-1 flex items-center justify-center gap-2 text-sm py-3">
          <Share2 size={15} /> Partager
        </button>
      </div>
    </div>
  );
}
