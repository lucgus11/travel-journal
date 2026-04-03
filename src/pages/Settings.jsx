import { useState, useEffect } from 'react';
import { Globe, Bell, Database, Info, Moon, Download, Trash2, HardDrive } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getStorageInfo, CURRENCIES, requestNotificationPermission } from '../utils/helpers';
import { getAllTrips, deleteTrip, exportTripData } from '../utils/db';

export default function Settings() {
  const { settings, updateSettings, showToast, installApp, installPrompt } = useApp();
  const [storageInfo, setStorageInfo] = useState(null);
  const [version] = useState('1.0.0');

  useEffect(() => {
    getStorageInfo().then(setStorageInfo);
  }, []);

  const handleNotifToggle = async () => {
    if (!settings.notifications) {
      const granted = await requestNotificationPermission();
      if (!granted) { showToast('Notifications refusées par le navigateur', 'error'); return; }
    }
    await updateSettings({ notifications: !settings.notifications });
    showToast(settings.notifications ? 'Notifications désactivées' : 'Notifications activées ✅', 'info');
  };

  const handleClearCache = async () => {
    if (!confirm('Vider le cache ? Vos données restent sauvegardées.')) return;
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(c => caches.delete(c)));
    showToast('Cache vidé ✅', 'success');
    setStorageInfo(await getStorageInfo());
  };

  const handleExportAll = async () => {
    try {
      const trips = await getAllTrips();
      const all = await Promise.all(trips.map(t => exportTripData(t.id)));
      const blob = new Blob([JSON.stringify({ version, trips: all, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'carnet-voyage-backup.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('Sauvegarde exportée !', 'success');
    } catch { showToast('Erreur export', 'error'); }
  };

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ Supprimer TOUS les voyages et données ? Cette action est irréversible !')) return;
    if (!confirm('Êtes-vous vraiment sûr ? Toutes vos notes et photos seront perdues.')) return;
    const trips = await getAllTrips();
    for (const t of trips) await deleteTrip(t.id);
    showToast('Toutes les données supprimées', 'info');
    setStorageInfo(await getStorageInfo());
  };

  const Section = ({ title, children }) => (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      <div className="card overflow-hidden">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ icon: Icon, label, description, children, danger }) => (
    <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: danger ? 'rgba(224,92,92,0.15)' : 'rgba(212,168,83,0.1)' }}>
        <Icon size={18} style={{ color: danger ? '#e05c5c' : 'var(--gold-main)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: danger ? '#e05c5c' : 'var(--text-primary)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="page-enter max-w-lg mx-auto px-4 pt-6 pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Réglages</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Personnalisez votre carnet de voyage</p>
      </div>

      {/* Préférences */}
      <Section title="Préférences">
        <SettingRow icon={Globe} label="Devise par défaut" description="Utilisée pour le budget">
          <select
            className="text-sm rounded-xl px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            value={settings.currency}
            onChange={e => updateSettings({ currency: e.target.value })}
          >
            {CURRENCIES.slice(0, 15).map(c => (
              <option key={c.code} value={c.code} style={{ background: 'var(--bg-card)' }}>{c.label}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow icon={Bell} label="Notifications" description="Rappels de voyage">
          <label className="toggle">
            <input type="checkbox" checked={settings.notifications} onChange={handleNotifToggle} />
            <span className="toggle-slider" />
          </label>
        </SettingRow>
        <div style={{ borderBottom: 'none' }}>
          <SettingRow icon={Moon} label="Localisation auto" description="Position GPS dans les entrées">
            <label className="toggle">
              <input type="checkbox" checked={settings.autoLocation}
                onChange={e => updateSettings({ autoLocation: e.target.checked })} />
              <span className="toggle-slider" />
            </label>
          </SettingRow>
        </div>
      </Section>

      {/* Stockage */}
      <Section title="Stockage">
        {storageInfo && (
          <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,144,217,0.15)' }}>
                  <HardDrive size={18} style={{ color: '#4a90d9' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Espace utilisé</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{storageInfo.usedMB} Mo / {storageInfo.quotaMB} Mo</p>
                </div>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--gold-main)' }}>{storageInfo.percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${storageInfo.percent}%` }} />
            </div>
          </div>
        )}
        <SettingRow icon={Database} label="Vider le cache" description="Libère de l'espace sans effacer vos données">
          <button onClick={handleClearCache} className="btn-ghost text-xs px-3 py-1.5">Vider</button>
        </SettingRow>
        <div style={{ borderBottom: 'none' }}>
          <SettingRow icon={Download} label="Exporter tout" description="Sauvegarde JSON de tous vos voyages">
            <button onClick={handleExportAll} className="btn-gold text-xs px-3 py-1.5">Exporter</button>
          </SettingRow>
        </div>
      </Section>

      {/* Installation */}
      {installPrompt && (
        <Section title="Application">
          <div style={{ borderBottom: 'none' }}>
            <SettingRow icon={Download} label="Installer l'app" description="Accès hors-ligne & expérience native">
              <button onClick={installApp} className="btn-gold text-xs px-3 py-1.5">Installer</button>
            </SettingRow>
          </div>
        </Section>
      )}

      {/* Zone danger */}
      <Section title="Zone de danger">
        <div style={{ borderBottom: 'none' }}>
          <SettingRow icon={Trash2} label="Supprimer toutes les données" description="Irréversible — tous vos voyages seront perdus" danger>
            <button onClick={handleDeleteAll} className="text-xs px-3 py-1.5 rounded-xl font-semibold"
              style={{ background: 'rgba(224,92,92,0.15)', color: '#e05c5c', border: '1px solid rgba(224,92,92,0.3)' }}>
              Supprimer
            </button>
          </SettingRow>
        </div>
      </Section>

      {/* About */}
      <Section title="À propos">
        <div style={{ borderBottom: 'none' }}>
          <SettingRow icon={Info} label="Carnet de Voyage PWA" description={`Version ${version} · Hors-ligne & open source`}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>v{version}</span>
          </SettingRow>
        </div>
      </Section>

      {/* Features list */}
      <div className="card p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Fonctionnalités hors-ligne
        </p>
        {[
          '✅ Journal et notes enrichies',
          '✅ Galerie photo & vidéo',
          '✅ Créateur de montage photo',
          '✅ Suivi budget & dépenses',
          '✅ Checklists de voyage',
          '✅ Carte Leaflet (avec cache)',
          '✅ Géolocalisation GPS',
          '🌐 Météo temps réel (en ligne)',
          '🌐 Géocodage inverse (en ligne)',
        ].map(f => (
          <p key={f} className="text-sm" style={{ color: 'var(--text-muted)' }}>{f}</p>
        ))}
      </div>
    </div>
  );
}
