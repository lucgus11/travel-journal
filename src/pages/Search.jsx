import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchEntries, getAllTrips } from '../utils/db';
import { formatDate } from '../utils/helpers';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trips, setTrips] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const [entries, allTrips] = await Promise.all([searchEntries(q), getAllTrips()]);
    const tripMap = {};
    allTrips.forEach(t => tripMap[t.id] = t);
    setTrips(tripMap);
    setResults(entries);
    setSearched(true);
    setLoading(false);
  }, []);

  const onInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(window.__searchTimer);
    window.__searchTimer = setTimeout(() => handleSearch(q), 350);
  };

  const MOOD_EMOJIS = { amazing: '🤩', happy: '😊', neutral: '😐', tired: '😴', sad: '😢', excited: '🎉' };

  return (
    <div className="page-enter max-w-lg mx-auto px-4 pt-6 pb-4">
      <h1 className="text-2xl font-display font-bold text-white mb-4">Recherche</h1>

      {/* Search bar */}
      <div className="relative mb-5">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="search"
          className="input-dark pl-11 pr-10"
          placeholder="Titre, contenu, lieu, tags..."
          value={query}
          onChange={onInput}
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-white font-semibold">Aucun résultat</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Essayez d'autres mots-clés</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🔎</div>
          <p className="text-white font-semibold">Cherchez dans vos voyages</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Titres, notes, lieux, tags...</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            {results.length} résultat{results.length !== 1 ? 's' : ''} pour "{query}"
          </p>
          {results.map(entry => {
            const trip = trips[entry.tripId];
            const snippet = entry.content?.replace(/<[^>]*>/g, '').slice(0, 150);
            const idx = snippet?.toLowerCase().indexOf(query.toLowerCase());
            const highlighted = idx >= 0
              ? snippet.slice(0, idx) + `<mark style="background:rgba(212,168,83,0.3);color:var(--gold-light);border-radius:2px">${snippet.slice(idx, idx + query.length)}</mark>` + snippet.slice(idx + query.length)
              : snippet;
            return (
              <Link key={entry.id} to={`/trips/${entry.tripId}/entry/${entry.id}`}>
                <div className="card card-interactive p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl mt-0.5">{MOOD_EMOJIS[entry.mood] || '📝'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between">
                        <p className="font-semibold text-white truncate"
                          dangerouslySetInnerHTML={{
                            __html: entry.title?.replace(new RegExp(`(${query})`, 'gi'), '<mark style="background:rgba(212,168,83,0.3);color:var(--gold-light);border-radius:2px">$1</mark>') || 'Sans titre'
                          }}
                        />
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.date, 'd MMM yy')}</span>
                      </div>
                      {trip && (
                        <p className="text-xs mt-0.5" style={{ color: trip.color || 'var(--gold-main)' }}>
                          ● {trip.name}
                        </p>
                      )}
                      {snippet && (
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)', fontSize: '13px' }}
                          dangerouslySetInnerHTML={{ __html: highlighted }} />
                      )}
                      {entry.location?.name && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>📍 {entry.location.name}</p>
                      )}
                      {entry.tags?.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {entry.tags.map(tag => (
                            <span key={tag} className="tag-pill" style={{
                              background: tag.toLowerCase().includes(query.toLowerCase()) ? 'rgba(212,168,83,0.2)' : undefined,
                              color: tag.toLowerCase().includes(query.toLowerCase()) ? 'var(--gold-light)' : undefined,
                            }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
