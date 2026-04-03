import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, TrendingUp } from 'lucide-react';
import { getTrip, getExpensesByTrip, saveExpense, deleteExpense } from '../utils/db';
import { uuid, today, formatDate, formatCurrency, EXPENSE_CATEGORIES, getCategoryInfo } from '../utils/helpers';
import { useApp } from '../contexts/AppContext';

export default function Budget() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'food', date: today(), currency: 'EUR' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [t, exps] = await Promise.all([getTrip(tripId), getExpensesByTrip(tripId)]);
    setTrip(t);
    setExpenses(exps);
    setForm(f => ({ ...f, currency: t?.currency || 'EUR' }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [tripId]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAdd = async () => {
    if (!form.amount || !form.description.trim()) { showToast('Remplissez tous les champs', 'error'); return; }
    const exp = { id: uuid(), tripId, ...form, amount: parseFloat(form.amount) };
    await saveExpense(exp);
    showToast('Dépense ajoutée ✅', 'success');
    setForm(f => ({ ...f, description: '', amount: '' }));
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    showToast('Dépense supprimée', 'info');
    load();
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const budgetLeft = trip?.budget ? trip.budget - total : null;
  const budgetPct = trip?.budget ? Math.min(100, (total / trip.budget) * 100) : null;

  // By category
  const byCategory = EXPENSE_CATEGORIES.map(cat => {
    const catTotal = expenses.filter(e => e.category === cat.id).reduce((s, e) => s + (e.amount || 0), 0);
    return { ...cat, total: catTotal };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const currency = trip?.currency || 'EUR';

  return (
    <div className="page-enter max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 glass px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display font-bold text-white text-lg">Budget</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-gold flex items-center gap-1.5 text-sm px-3 py-2">
          <Plus size={15} /> Dépense
        </button>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Summary card */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Total dépensé</p>
              <p className="text-3xl font-display font-bold" style={{ color: 'var(--gold-main)' }}>
                {formatCurrency(total, currency)}
              </p>
            </div>
            {trip?.budget && (
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Budget</p>
                <p className="text-lg font-bold text-white">{formatCurrency(trip.budget, currency)}</p>
                <p className="text-xs mt-0.5" style={{ color: budgetLeft < 0 ? '#e05c5c' : '#2ecc71' }}>
                  {budgetLeft >= 0 ? `${formatCurrency(budgetLeft, currency)} restant` : `${formatCurrency(Math.abs(budgetLeft), currency)} dépassé !`}
                </p>
              </div>
            )}
          </div>
          {budgetPct !== null && (
            <>
              <div className="progress-bar mb-1">
                <div className="progress-fill" style={{
                  width: `${budgetPct}%`,
                  background: budgetPct > 90 ? 'linear-gradient(90deg,#e05c5c,#ff8080)' : budgetPct > 70 ? 'linear-gradient(90deg,#e67e22,#f0c75a)' : undefined
                }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round(budgetPct)}% du budget utilisé</p>
            </>
          )}
        </div>

        {/* Add expense form */}
        {showForm && (
          <div className="card p-4 space-y-3">
            <h3 className="font-bold text-white">Nouvelle dépense</h3>
            <input className="input-dark" placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="input-dark" placeholder="Montant" value={form.amount} onChange={e => set('amount', e.target.value)} />
              <input type="date" className="input-dark" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => set('category', cat.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                  style={{
                    background: form.category === cat.id ? cat.color + '22' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.category === cat.id ? cat.color + '44' : 'transparent'}`,
                    color: form.category === cat.id ? cat.color : 'var(--text-muted)',
                  }}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 text-sm py-2.5">Annuler</button>
              <button onClick={handleAdd} className="btn-gold flex-1 text-sm py-2.5">Ajouter</button>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className="card p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp size={16} style={{ color: 'var(--gold-main)' }} /> Répartition
            </h3>
            <div className="space-y-2.5">
              {byCategory.map(cat => {
                const pct = total > 0 ? (cat.total / total) * 100 : 0;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                      </span>
                      <span className="text-sm font-bold" style={{ color: cat.color }}>{formatCurrency(cat.total, currency)}</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: '3px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Détail ({expenses.length} dépense{expenses.length !== 1 ? 's' : ''})
          </h3>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : expenses.length === 0 ? (
            <div className="card p-6 text-center">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-white font-semibold">Aucune dépense</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Commencez à tracker vos dépenses !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map(exp => {
                const cat = getCategoryInfo(exp.category);
                return (
                  <div key={exp.id} className="card p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: cat.color + '22' }}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{exp.description}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(exp.date, 'd MMM')} · {cat.label}
                      </p>
                    </div>
                    <p className="font-bold text-white shrink-0">{formatCurrency(exp.amount, exp.currency || currency)}</p>
                    <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg shrink-0" style={{ color: '#e05c5c' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
