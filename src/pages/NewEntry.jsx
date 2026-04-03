import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Camera, X, Bold, Italic, Underline, Tag, Cloud } from 'lucide-react';
import { saveEntry, saveMedia, getEntry, getMediaByEntry, deleteMedia } from '../utils/db';
import { uuid, today, MOODS, getWeatherInfo, getCurrentPosition, reverseGeocode, fileToArrayBuffer, compressImage, arrayBufferToObjectURL } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

export default function NewEntry() {
  const { tripId, entryId } = useParams();
  const navigate = useNavigate();
  const { showToast, online } = useApp();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const isEdit = !!entryId;

  const [form, setForm] = useState({
    title: '', date: today(), mood: 'happy', tags: [],
    location: null, weather: null,
  });
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [photos, setPhotos] = useState([]); // {id, url, buffer, mimeType, isNew}
  const [saving, setSaving] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    if (isEdit) loadEntry();
  }, [entryId]);

  const loadEntry = async () => {
    const entry = await getEntry(entryId);
    if (!entry) return;
    setForm({ title: entry.title || '', date: entry.date || today(), mood: entry.mood || 'happy', tags: entry.tags || [], location: entry.location || null, weather: entry.weather || null });
    setContent(entry.content || '');
    if (editorRef.current) editorRef.current.innerHTML = entry.content || '';
    const media = await getMediaByEntry(entryId);
    setPhotos(media.filter(m => m.type === 'photo').map(m => ({
      id: m.id, url: arrayBufferToObjectURL(m.data, m.mimeType || 'image/jpeg'),
      mimeType: m.mimeType, isNew: false,
    })));
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFormat = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
  };

  const getLocation = async () => {
    setLoadingLoc(true);
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      const name = await reverseGeocode(lat, lng);
      set('location', { lat, lng, name });
      showToast('Position obtenue ! 📍', 'success');
      if (online) fetchWeather(lat, lng);
    } catch { showToast('Impossible d\'obtenir la position', 'error'); }
    setLoadingLoc(false);
  };

  const fetchWeather = async (lat, lng) => {
    if (!online) return;
    setLoadingWeather(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`);
      const data = await res.json();
      const wc = data.current.weather_code;
      const temp = Math.round(data.current.temperature_2m);
      const info = getWeatherInfo(wc);
      set('weather', { code: wc, temp, label: info.label, icon: info.icon });
    } catch { }
    setLoadingWeather(false);
  };

  const handlePhotoAdd = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { buffer, type, width, height } = await compressImage(file, 1920, 0.85);
        const url = arrayBufferToObjectURL(buffer, type);
        setPhotos(prev => [...prev, { id: uuid(), url, buffer, mimeType: type, width, height, isNew: true }]);
      } catch { showToast('Erreur lors du chargement de la photo', 'error'); }
    }
    e.target.value = '';
  };

  const removePhoto = async (photo) => {
    if (!photo.isNew && photo.id) {
      await deleteMedia(photo.id);
    }
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    URL.revokeObjectURL(photo.url);
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const handleSave = async () => {
    if (!form.title.trim() && !content.trim()) {
      showToast('Ajoutez un titre ou du contenu', 'error'); return;
    }
    setSaving(true);
    try {
      const entryData = {
        id: isEdit ? entryId : uuid(),
        tripId,
        ...form,
        content: editorRef.current?.innerHTML || content,
        updatedAt: new Date().toISOString(),
      };
      if (!isEdit) entryData.createdAt = new Date().toISOString();
      await saveEntry(entryData);

      // Save new photos
      for (const photo of photos.filter(p => p.isNew)) {
        await saveMedia({
          id: photo.id,
          entryId: entryData.id,
          tripId,
          type: 'photo',
          data: photo.buffer,
          mimeType: photo.mimeType,
          width: photo.width,
          height: photo.height,
          caption: '',
          createdAt: new Date().toISOString(),
        });
      }
      showToast(isEdit ? 'Entrée mise à jour ✅' : 'Entrée sauvegardée ✅', 'success');
      navigate(`/trips/${tripId}/entry/${entryData.id}`, { replace: true });
    } catch (e) {
      showToast('Erreur lors de la sauvegarde', 'error');
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <input
            className="w-full bg-transparent text-white font-display font-bold text-lg outline-none placeholder:text-white/30"
            placeholder="Titre de l'entrée..."
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-gold flex items-center gap-1.5 text-sm px-3 py-2">
          <Check size={14} /> {saving ? '...' : 'Sauver'}
        </button>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {/* Date + mood row */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="input-dark flex-1 text-sm"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
          {form.weather && (
            <div className="glass px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 shrink-0">
              <span>{form.weather.icon}</span>
              <span className="font-bold text-white">{form.weather.temp}°</span>
            </div>
          )}
        </div>

        {/* Mood selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Humeur
          </label>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => set('mood', m.id)}
                className={`mood-pill ${form.mood === m.id ? 'active' : ''}`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Lieu
            </label>
            <button
              onClick={getLocation}
              disabled={loadingLoc}
              className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(212,168,83,0.1)', color: 'var(--gold-main)' }}
            >
              <MapPin size={12} /> {loadingLoc ? 'Localisation...' : 'Ma position'}
            </button>
          </div>
          {form.location ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)' }}>
              <MapPin size={14} style={{ color: 'var(--gold-main)', shrink: 0 }} />
              <span className="text-sm text-white flex-1 truncate">{form.location.name}</span>
              <button onClick={() => set('location', null)} className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <input
              className="input-dark text-sm"
              placeholder="Entrez un lieu manuellement..."
              onKeyDown={e => {
                if (e.key === 'Enter' && e.target.value) {
                  set('location', { name: e.target.value, lat: null, lng: null });
                  e.target.value = '';
                }
              }}
            />
          )}
        </div>

        {/* Rich text editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Journal
            </label>
            <div className="flex gap-1">
              {[[Bold, 'bold'], [Italic, 'italic'], [Underline, 'underline']].map(([Icon, cmd]) => (
                <button key={cmd} onMouseDown={e => { e.preventDefault(); handleFormat(cmd); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="rich-editor"
            data-placeholder="Racontez votre journée... Qu'avez-vous vu, ressenti, mangé ? Quels souvenirs garderez-vous ?"
            onInput={e => setContent(e.currentTarget.innerHTML)}
          />
        </div>

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Photos ({photos.length})
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(212,168,83,0.1)', color: 'var(--gold-main)' }}
            >
              <Camera size={13} /> Ajouter
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handlePhotoAdd}
          />
          {photos.length > 0 && (
            <div className="media-grid">
              {photos.map(photo => (
                <div key={photo.id} className="media-item relative group">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(photo)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}
              >
                <Camera size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Tags
          </label>
          <div className="flex gap-2">
            <input
              className="input-dark flex-1 text-sm"
              placeholder="#plage #restaurant..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            />
            <button onClick={addTag} className="btn-ghost text-sm px-3 py-2">
              <Tag size={15} />
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.tags.map(tag => (
                <span key={tag} className="tag-pill flex items-center gap-1">
                  #{tag}
                  <button onClick={() => set('tags', form.tags.filter(t => t !== tag))} style={{ color: '#4a90d9', opacity: 0.7 }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-gold w-full py-4 text-base">
          {saving ? '⏳ Sauvegarde...' : isEdit ? '✅ Mettre à jour' : '📝 Sauvegarder l\'entrée'}
        </button>
      </div>
    </div>
  );
}
