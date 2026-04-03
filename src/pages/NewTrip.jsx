import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { saveTrip } from '../utils/db';
import { uuid, today, TRIP_COLORS, CURRENCIES } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

const EMOJIS = ['✈️','🌍','🏖️','🏔️','🗺️','🏛️','🌴','🗼','🏯','🌺','🌊','❄️','🏜️','🌅','🚢','🚂','🎭','🍜','🦁','🐬'];

export default function NewTrip() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [form, setForm] = useState({
    name: '', destination: '', country: '', startDate: today(),
    endDate: '', description: '', budget: '', currency: 'EUR',
    color: TRIP_COLORS[0], emoji: '✈️',
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Le nom du voyage est requis', 'error'); return; }
    setSaving(true);
    try {
      const trip = await saveTrip({ ...form, id: uuid(), budget: form.budget ? parseFloat(form.budget) : null });
      showToast('Voyage créé ! 🎉', 'success');
      navigate(`/trips/${trip.id}`, { replace: true });
    } catch (e) {
      showToast('Erreur lors de la sauvegarde', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="page-enter min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-lg font-display font-bold text-white">Nouveau voyage</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold flex items-center gap-1.5 text-sm px-4 py-2"
        >
          <Check size={15} /> {saving ? 'Sauvegarde...' : 'Créer'}
        </button>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-6">
        {/* Emoji picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Icône
          </label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => set('emoji', e)}
                className="text-2xl p-2 rounded-xl transition-all"
                style={{
                  background: form.emoji === e ? 'rgba(212,168,83,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${form.emoji === e ? 'var(--gold-main)' : 'transparent'}`,
                  transform: form.emoji === e ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Couleur du carnet
          </label>
          <div className="flex gap-3">
            {TRIP_COLORS.map(c => (
              <button
                key={c}
                onClick={() => set('color', c)}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: c,
                  transform: form.color === c ? 'scale(1.25)' : 'scale(1)',
                  boxShadow: form.color === c ? `0 0 12px ${c}88` : 'none',
                  border: form.color === c ? '2px solid white' : '2px solid transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Nom du voyage *
          </label>
          <input
            className="input-dark"
            placeholder="Ex: Japon printemps 2025"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        {/* Destination + country */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Destination
            </label>
            <input
              className="input-dark"
              placeholder="Tokyo, Kyoto..."
              value={form.destination}
              onChange={e => set('destination', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Pays
            </label>
            <input
              className="input-dark"
              placeholder="Japon"
              value={form.country}
              onChange={e => set('country', e.target.value)}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Départ
            </label>
            <input type="date" className="input-dark" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Retour
            </label>
            <input type="date" className="input-dark" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </div>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Budget total
            </label>
            <input
              type="number"
              className="input-dark"
              placeholder="2000"
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Devise
            </label>
            <select className="input-dark" value={form.currency} onChange={e => set('currency', e.target.value)}>
              {CURRENCIES.slice(0, 15).map(c => (
                <option key={c.code} value={c.code} style={{ background: 'var(--bg-card)' }}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Description / Notes préparatoires
          </label>
          <textarea
            className="input-dark resize-none"
            rows={4}
            placeholder="Vols, hébergements, idées d'activités..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {/* Preview */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Aperçu
          </label>
          <div className="card p-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: form.color + '22', border: `1px solid ${form.color}44` }}
            >
              {form.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: form.color }} />
                <p className="font-bold text-white">{form.name || 'Mon voyage'}</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {form.destination || 'Destination'} · {form.startDate || '–'}
              </p>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-gold w-full text-center py-4 text-base">
          {saving ? '⏳ Création...' : '✈️ Créer ce voyage'}
        </button>
      </div>
    </div>
  );
}
