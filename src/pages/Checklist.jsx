import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { getChecklistsByTrip, saveChecklist, deleteChecklist } from '../utils/db';
import { uuid } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

const PRESET_CHECKLISTS = [
  {
    name: '🧳 Bagages essentiels',
    items: ['Passeport / Carte d\'identité', 'Billet d\'avion / Train', 'Réservations hôtel', 'Assurance voyage', 'Médicaments', 'Chargeur téléphone', 'Adaptateur prise', 'Écouteurs', 'Livre / Liseuse'],
  },
  {
    name: '👗 Vêtements',
    items: ['T-shirts', 'Pantalons / Shorts', 'Sous-vêtements', 'Chaussettes', 'Chaussures de marche', 'Sandales', 'Veste / Pull', 'Imperméable', 'Pyjama', 'Maillot de bain'],
  },
  {
    name: '🧴 Hygiène & Santé',
    items: ['Brosse à dents', 'Dentifrice', 'Shampoing', 'Savon', 'Déodorant', 'Crème solaire', 'Rasoir', 'Moustiquaire', 'Antibiotiques', 'Anti-diarrhéiques'],
  },
];

export default function Checklist() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newItem, setNewItem] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const cls = await getChecklistsByTrip(tripId);
    setLists(cls);
    const exp = {};
    cls.forEach(c => exp[c.id] = true);
    setExpanded(exp);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tripId]);

  const createList = async (name, presetItems = []) => {
    if (!name.trim()) return;
    const list = {
      id: uuid(), tripId,
      name: name.trim(),
      items: presetItems.map(text => ({ id: uuid(), text, checked: false })),
    };
    await saveChecklist(list);
    setNewListName('');
    showToast('Liste créée !', 'success');
    load();
  };

  const addItem = async (listId) => {
    const text = newItem[listId]?.trim();
    if (!text) return;
    const list = lists.find(l => l.id === listId);
    const updated = { ...list, items: [...(list.items || []), { id: uuid(), text, checked: false }] };
    await saveChecklist(updated);
    setNewItem(n => ({ ...n, [listId]: '' }));
    load();
  };

  const toggleItem = async (listId, itemId) => {
    const list = lists.find(l => l.id === listId);
    const updated = {
      ...list,
      items: list.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item),
    };
    await saveChecklist(updated);
    load();
  };

  const removeItem = async (listId, itemId) => {
    const list = lists.find(l => l.id === listId);
    const updated = { ...list, items: list.items.filter(i => i.id !== itemId) };
    await saveChecklist(updated);
    load();
  };

  const handleDeleteList = async (id) => {
    if (!confirm('Supprimer cette liste ?')) return;
    await deleteChecklist(id);
    showToast('Liste supprimée', 'info');
    load();
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="page-enter max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display font-bold text-white text-lg">Checklists</h1>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* New list */}
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Nouvelle liste
          </p>
          <div className="flex gap-2 mb-3">
            <input
              className="input-dark flex-1 text-sm"
              placeholder="Nom de la liste..."
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createList(newListName)}
            />
            <button onClick={() => createList(newListName)} className="btn-gold text-sm px-4 py-2">
              <Plus size={15} />
            </button>
          </div>
          {/* Preset templates */}
          <div className="flex gap-2 flex-wrap">
            {PRESET_CHECKLISTS.map(preset => (
              <button
                key={preset.name}
                onClick={() => createList(preset.name, preset.items)}
                className="text-xs px-3 py-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(212,168,83,0.1)', color: 'var(--gold-main)', border: '1px solid rgba(212,168,83,0.2)' }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Checklists */}
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : lists.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-white font-semibold">Aucune liste</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Créez votre liste de bagages ou utilisez un modèle !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map(list => {
              const items = list.items || [];
              const checked = items.filter(i => i.checked).length;
              const pct = items.length > 0 ? (checked / items.length) * 100 : 0;
              const isExpanded = expanded[list.id];

              return (
                <div key={list.id} className="card overflow-hidden">
                  {/* List header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleExpand(list.id)}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); isExpanded ? undefined : toggleExpand(list.id); }}
                      className="shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{list.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="progress-bar flex-1">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {checked}/{items.length}
                        </span>
                      </div>
                    </div>
                    {pct === 100 && items.length > 0 && (
                      <span className="text-lg">🎉</span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteList(list.id); }}
                      className="p-1.5 rounded-lg shrink-0"
                      style={{ color: '#e05c5c' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Items */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 transition-colors"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <button
                            onClick={() => toggleItem(list.id, item.id)}
                            className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all"
                            style={{
                              background: item.checked ? 'var(--gold-main)' : 'transparent',
                              border: `1.5px solid ${item.checked ? 'var(--gold-main)' : 'rgba(255,255,255,0.2)'}`,
                            }}
                          >
                            {item.checked && <Check size={12} style={{ color: '#07071a' }} strokeWidth={3} />}
                          </button>
                          <span
                            className="flex-1 text-sm"
                            style={{
                              color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: item.checked ? 'line-through' : 'none',
                            }}
                          >
                            {item.text}
                          </span>
                          <button
                            onClick={() => removeItem(list.id, item.id)}
                            className="p-1 rounded shrink-0 opacity-0 hover:opacity-100 transition-opacity"
                            style={{ color: '#e05c5c' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {/* Add item */}
                      <div className="flex gap-2 px-4 py-3">
                        <input
                          className="input-dark flex-1 text-sm py-2"
                          placeholder="Ajouter un élément..."
                          value={newItem[list.id] || ''}
                          onChange={e => setNewItem(n => ({ ...n, [list.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addItem(list.id)}
                        />
                        <button onClick={() => addItem(list.id)} className="btn-gold text-sm px-3 py-2">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
