import { v4 as uuidv4 } from 'uuid';
import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const uuid = () => uuidv4();

// ── Date helpers ───────────────────────────────────────────────
export const formatDate = (dateStr, fmt = 'd MMMM yyyy') =>
  dateStr ? format(parseISO(dateStr), fmt, { locale: fr }) : '–';

export const formatDateShort = (dateStr) =>
  dateStr ? format(parseISO(dateStr), 'd MMM', { locale: fr }) : '–';

export const formatDateTime = (dateStr) =>
  dateStr ? format(parseISO(dateStr), "d MMM yyyy 'à' HH'h'mm", { locale: fr }) : '–';

export const timeAgo = (dateStr) =>
  dateStr ? formatDistanceToNow(parseISO(dateStr), { locale: fr, addSuffix: true }) : '–';

export const tripDuration = (start, end) => {
  if (!start) return 0;
  const endDate = end ? parseISO(end) : new Date();
  return Math.max(0, differenceInDays(endDate, parseISO(start)) + 1);
};

export const today = () => new Date().toISOString().slice(0, 10);

// ── File helpers ───────────────────────────────────────────────
export const fileToArrayBuffer = (file) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = rej;
    reader.readAsArrayBuffer(file);
  });

export const fileToDataURL = (file) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

export const arrayBufferToObjectURL = (buffer, type = 'image/jpeg') => {
  const blob = new Blob([buffer], { type });
  return URL.createObjectURL(blob);
};

export const dataURLtoArrayBuffer = (dataURL) => {
  const base64 = dataURL.split(',')[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes.buffer;
};

export const getFileSizeMB = (buffer) =>
  buffer ? (buffer.byteLength / 1024 / 1024).toFixed(1) : '0';

export const compressImage = async (file, maxWidth = 1920, quality = 0.85) => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        const reader = new FileReader();
        reader.onload = e => resolve({ buffer: e.target.result, type: 'image/jpeg', width, height });
        reader.readAsArrayBuffer(blob);
      }, 'image/jpeg', quality);
    };
    img.src = url;
  });
};

// ── Currency helpers ───────────────────────────────────────────
const CURRENCY_SYMBOLS = {
  EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'CHF',
  CAD: 'CA$', AUD: 'A$', CNY: '¥', KRW: '₩', INR: '₹',
  BRL: 'R$', MXN: '$', THB: '฿', SGD: 'S$', MAD: 'MAD',
  TND: 'TND', TRY: '₺', SEK: 'kr', NOK: 'kr', DKK: 'kr',
};

export const formatCurrency = (amount, currency = 'EUR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${Number(amount || 0).toFixed(2)}`;
};

export const CURRENCIES = Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => ({ code, symbol, label: `${symbol} ${code}` }));

// ── Expense categories ─────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  { id: 'transport', label: 'Transport', icon: '✈️', color: '#4a90d9' },
  { id: 'accommodation', label: 'Hébergement', icon: '🏨', color: '#9b59b6' },
  { id: 'food', label: 'Nourriture', icon: '🍽️', color: '#e67e22' },
  { id: 'activity', label: 'Activités', icon: '🎭', color: '#2ecc71' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#e05c5c' },
  { id: 'health', label: 'Santé', icon: '💊', color: '#1abc9c' },
  { id: 'communication', label: 'Communication', icon: '📱', color: '#3498db' },
  { id: 'other', label: 'Autre', icon: '💰', color: '#95a5a6' },
];

export const getCategoryInfo = (id) =>
  EXPENSE_CATEGORIES.find(c => c.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

// ── Mood options ───────────────────────────────────────────────
export const MOODS = [
  { id: 'amazing', emoji: '🤩', label: 'Incroyable', color: '#f0c75a' },
  { id: 'happy', emoji: '😊', label: 'Heureux', color: '#2ecc71' },
  { id: 'neutral', emoji: '😐', label: 'Neutre', color: '#95a5a6' },
  { id: 'tired', emoji: '😴', label: 'Fatigué', color: '#9b59b6' },
  { id: 'sad', emoji: '😢', label: 'Triste', color: '#3498db' },
  { id: 'excited', emoji: '🎉', label: 'Excité', color: '#e67e22' },
];

// ── Weather codes (Open-Meteo WMO) ────────────────────────────
export const WMO_CODES = {
  0: { label: 'Ensoleillé', icon: '☀️' },
  1: { label: 'Peu nuageux', icon: '🌤️' },
  2: { label: 'Nuageux', icon: '⛅' },
  3: { label: 'Couvert', icon: '☁️' },
  45: { label: 'Brouillard', icon: '🌫️' },
  51: { label: 'Bruine', icon: '🌦️' },
  61: { label: 'Pluie légère', icon: '🌧️' },
  63: { label: 'Pluie', icon: '🌧️' },
  65: { label: 'Forte pluie', icon: '⛈️' },
  71: { label: 'Neige légère', icon: '🌨️' },
  73: { label: 'Neige', icon: '❄️' },
  80: { label: 'Averses', icon: '🌦️' },
  95: { label: 'Orage', icon: '⛈️' },
};

export const getWeatherInfo = (code) => WMO_CODES[code] || { label: 'Inconnu', icon: '🌡️' };

// ── Trip status ────────────────────────────────────────────────
export const getTripStatus = (trip) => {
  const now = new Date();
  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end = trip.endDate ? new Date(trip.endDate) : null;
  if (!start) return { status: 'draft', label: 'Brouillon', color: '#95a5a6' };
  if (now < start) return { status: 'upcoming', label: 'À venir', color: '#4a90d9' };
  if (!end || now <= end) return { status: 'ongoing', label: 'En cours', color: '#2ecc71' };
  return { status: 'completed', label: 'Terminé', color: '#d4a853' };
};

// ── Share helpers ──────────────────────────────────────────────
export const canShare = () => !!navigator.share;
export const canShareFiles = () => navigator.canShare?.({ files: [new File([], 'test.jpg', { type: 'image/jpeg' })] });

export const shareText = async (title, text, url) => {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return true;
  }
  await navigator.clipboard?.writeText(`${title}\n${text}\n${url || window.location.href}`);
  return false;
};

// ── Geolocation ────────────────────────────────────────────────
export const getCurrentPosition = () =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 60000
    })
  );

export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`);
    const data = await res.json();
    return data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// ── Color helpers ──────────────────────────────────────────────
export const TRIP_COLORS = [
  '#d4a853', '#4a90d9', '#e05c5c', '#2ecc71', '#9b59b6',
  '#e67e22', '#1abc9c', '#e91e8c', '#00bcd4', '#ff5722'
];

export const getTripColor = (trip) => trip.color || TRIP_COLORS[0];

// ── Notification ───────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
};

export const sendNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/pwa-192.png', badge: '/pwa-192.png' });
  }
};

// ── Offline detection ──────────────────────────────────────────
export const isOnline = () => navigator.onLine;
export const onConnectivityChange = (handler) => {
  window.addEventListener('online', () => handler(true));
  window.addEventListener('offline', () => handler(false));
};

// ── Storage estimate ───────────────────────────────────────────
export const getStorageInfo = async () => {
  if (!navigator.storage?.estimate) return null;
  const { usage, quota } = await navigator.storage.estimate();
  return {
    usedMB: (usage / 1024 / 1024).toFixed(1),
    quotaMB: (quota / 1024 / 1024).toFixed(0),
    percent: Math.round((usage / quota) * 100)
  };
};

// ── Canvas/montage helpers ─────────────────────────────────────
export const loadImageFromBuffer = (buffer, mimeType = 'image/jpeg') =>
  new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
    img.onerror = reject;
    img.src = url;
  });

export const downloadCanvas = (canvas, filename = 'montage.jpg') => {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.92);
};
