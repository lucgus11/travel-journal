import { useApp } from '../../contexts/AppContext';
import { X, Download } from 'lucide-react';
import { useState } from 'react';

export default function InstallBanner() {
  const { installApp } = useApp();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="install-banner">
      <div className="glass rounded-2xl p-4 flex items-center gap-3 shadow-card">
        <div className="text-2xl">✈️</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Installer l'app</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Accès hors-ligne & expérience native</p>
        </div>
        <button onClick={installApp} className="btn-gold text-xs px-3 py-2 flex items-center gap-1.5">
          <Download size={13} /> Installer
        </button>
        <button onClick={() => setDismissed(true)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
