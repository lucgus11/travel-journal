import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSetting, setSetting, getGlobalStats } from '../utils/db';
import { isOnline, onConnectivityChange } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [online, setOnline] = useState(isOnline());
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [settings, setSettings] = useState({
    currency: 'EUR',
    language: 'fr',
    theme: 'dark',
    autoLocation: true,
    notifications: false,
  });

  // Connectivity
  useEffect(() => {
    onConnectivityChange(setOnline);
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load settings
  useEffect(() => {
    (async () => {
      const saved = await getSetting('appSettings');
      if (saved) setSettings(s => ({ ...s, ...saved }));
    })();
  }, []);

  const updateSettings = useCallback(async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    await setSetting('appSettings', next);
  }, [settings]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), duration);
  }, []);

  const refreshStats = useCallback(async () => {
    const s = await getGlobalStats();
    setStats(s);
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setInstallPrompt(null); showToast('Application installée ! 🎉', 'success'); }
    return outcome === 'accepted';
  }, [installPrompt, showToast]);

  return (
    <AppContext.Provider value={{ online, toast, showToast, stats, refreshStats, settings, updateSettings, installPrompt, installApp }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
