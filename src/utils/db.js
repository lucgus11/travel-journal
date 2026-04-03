import { openDB } from 'idb';

const DB_NAME = 'TravelJournalDB';
const DB_VERSION = 2;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // ── Trips ──────────────────────────────────────────
        if (!db.objectStoreNames.contains('trips')) {
          const ts = db.createObjectStore('trips', { keyPath: 'id' });
          ts.createIndex('createdAt', 'createdAt');
          ts.createIndex('startDate', 'startDate');
        }

        // ── Journal entries ────────────────────────────────
        if (!db.objectStoreNames.contains('entries')) {
          const es = db.createObjectStore('entries', { keyPath: 'id' });
          es.createIndex('tripId', 'tripId');
          es.createIndex('date', 'date');
          es.createIndex('tripId_date', ['tripId', 'date']);
        }

        // ── Media (photos & videos) ────────────────────────
        if (!db.objectStoreNames.contains('media')) {
          const ms = db.createObjectStore('media', { keyPath: 'id' });
          ms.createIndex('entryId', 'entryId');
          ms.createIndex('tripId', 'tripId');
          ms.createIndex('type', 'type');
        }

        // ── Expenses ───────────────────────────────────────
        if (!db.objectStoreNames.contains('expenses')) {
          const exs = db.createObjectStore('expenses', { keyPath: 'id' });
          exs.createIndex('tripId', 'tripId');
          exs.createIndex('date', 'date');
          exs.createIndex('category', 'category');
        }

        // ── Checklists ─────────────────────────────────────
        if (!db.objectStoreNames.contains('checklists')) {
          const cls = db.createObjectStore('checklists', { keyPath: 'id' });
          cls.createIndex('tripId', 'tripId');
        }

        // ── Settings ───────────────────────────────────────
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // ── Locations cache ────────────────────────────────
        if (!db.objectStoreNames.contains('locations')) {
          const ls = db.createObjectStore('locations', { keyPath: 'id' });
          ls.createIndex('tripId', 'tripId');
        }
      }
    });
  }
  return dbPromise;
}

// ── TRIPS ──────────────────────────────────────────────────────
export async function getAllTrips() {
  const db = await getDB();
  const trips = await db.getAll('trips');
  return trips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getTrip(id) {
  const db = await getDB();
  return db.get('trips', id);
}

export async function saveTrip(trip) {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...trip, updatedAt: now };
  if (!record.createdAt) record.createdAt = now;
  await db.put('trips', record);
  return record;
}

export async function deleteTrip(id) {
  const db = await getDB();
  // Cascade delete
  const entries = await db.getAllFromIndex('entries', 'tripId', id);
  for (const e of entries) {
    const media = await db.getAllFromIndex('media', 'entryId', e.id);
    for (const m of media) await db.delete('media', m.id);
    await db.delete('entries', e.id);
  }
  const expenses = await db.getAllFromIndex('expenses', 'tripId', id);
  for (const ex of expenses) await db.delete('expenses', ex.id);
  const checklists = await db.getAllFromIndex('checklists', 'tripId', id);
  for (const cl of checklists) await db.delete('checklists', cl.id);
  const locations = await db.getAllFromIndex('locations', 'tripId', id);
  for (const lo of locations) await db.delete('locations', lo.id);
  await db.delete('trips', id);
}

// ── ENTRIES ────────────────────────────────────────────────────
export async function getEntriesByTrip(tripId) {
  const db = await getDB();
  const entries = await db.getAllFromIndex('entries', 'tripId', tripId);
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getEntry(id) {
  const db = await getDB();
  return db.get('entries', id);
}

export async function saveEntry(entry) {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...entry, updatedAt: now };
  if (!record.createdAt) record.createdAt = now;
  await db.put('entries', record);
  return record;
}

export async function deleteEntry(id) {
  const db = await getDB();
  const media = await db.getAllFromIndex('media', 'entryId', id);
  for (const m of media) await db.delete('media', m.id);
  await db.delete('entries', id);
}

export async function searchEntries(query) {
  const db = await getDB();
  const all = await db.getAll('entries');
  const q = query.toLowerCase();
  return all.filter(e =>
    e.title?.toLowerCase().includes(q) ||
    e.content?.toLowerCase().includes(q) ||
    e.location?.name?.toLowerCase().includes(q) ||
    e.tags?.some(t => t.toLowerCase().includes(q))
  );
}

// ── MEDIA ──────────────────────────────────────────────────────
export async function getMediaByEntry(entryId) {
  const db = await getDB();
  return db.getAllFromIndex('media', 'entryId', entryId);
}

export async function getMediaByTrip(tripId) {
  const db = await getDB();
  return db.getAllFromIndex('media', 'tripId', tripId);
}

export async function saveMedia(media) {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...media, createdAt: media.createdAt || now };
  await db.put('media', record);
  return record;
}

export async function deleteMedia(id) {
  const db = await getDB();
  await db.delete('media', id);
}

// ── EXPENSES ───────────────────────────────────────────────────
export async function getExpensesByTrip(tripId) {
  const db = await getDB();
  const exps = await db.getAllFromIndex('expenses', 'tripId', tripId);
  return exps.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function saveExpense(expense) {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...expense, updatedAt: now };
  if (!record.createdAt) record.createdAt = now;
  await db.put('expenses', record);
  return record;
}

export async function deleteExpense(id) {
  const db = await getDB();
  await db.delete('expenses', id);
}

// ── CHECKLISTS ─────────────────────────────────────────────────
export async function getChecklistsByTrip(tripId) {
  const db = await getDB();
  return db.getAllFromIndex('checklists', 'tripId', tripId);
}

export async function saveChecklist(checklist) {
  const db = await getDB();
  const now = new Date().toISOString();
  const record = { ...checklist, updatedAt: now };
  if (!record.createdAt) record.createdAt = now;
  await db.put('checklists', record);
  return record;
}

export async function deleteChecklist(id) {
  const db = await getDB();
  await db.delete('checklists', id);
}

// ── SETTINGS ───────────────────────────────────────────────────
export async function getSetting(key, defaultValue = null) {
  const db = await getDB();
  const record = await db.get('settings', key);
  return record ? record.value : defaultValue;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}

// ── LOCATIONS ──────────────────────────────────────────────────
export async function getLocationsByTrip(tripId) {
  const db = await getDB();
  return db.getAllFromIndex('locations', 'tripId', tripId);
}

export async function saveLocation(location) {
  const db = await getDB();
  await db.put('locations', location);
}

// ── EXPORT ─────────────────────────────────────────────────────
export async function exportTripData(tripId) {
  const [trip, entries, expenses, checklists] = await Promise.all([
    getTrip(tripId),
    getEntriesByTrip(tripId),
    getExpensesByTrip(tripId),
    getChecklistsByTrip(tripId)
  ]);
  return { trip, entries, expenses, checklists, exportedAt: new Date().toISOString() };
}

export async function importTripData(data) {
  const { trip, entries, expenses, checklists } = data;
  await saveTrip(trip);
  for (const e of entries) await saveEntry(e);
  for (const ex of expenses) await saveExpense(ex);
  for (const cl of checklists) await saveChecklist(cl);
}

// ── STATS ──────────────────────────────────────────────────────
export async function getGlobalStats() {
  const db = await getDB();
  const [trips, entries, media, expenses] = await Promise.all([
    db.getAll('trips'),
    db.getAll('entries'),
    db.getAll('media'),
    db.getAll('expenses')
  ]);
  const totalSpent = expenses.reduce((sum, e) => sum + (e.amountEur || e.amount || 0), 0);
  const countries = [...new Set(trips.map(t => t.country).filter(Boolean))];
  return { tripsCount: trips.length, entriesCount: entries.length, photosCount: media.filter(m => m.type === 'photo').length, videosCount: media.filter(m => m.type === 'video').length, totalSpent, countriesCount: countries.length, countries };
}
