import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCoins, faTree, faTrash, faWater, faHistory,
  faSearch, faArrowUp, faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import { Loader2 } from 'lucide-react';
import { getDashboardStats } from '../services/analyticsService';

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'earned',   label: 'Earned' },
  { key: 'redeemed', label: 'Redeemed' },
];

const getActivityIcon = (description = '', type) => {
  if (type === 'draft') return { icon: faHistory, color: '#a855f7' };
  if (description.includes('garbage') || description.includes('cleanup')) return { icon: faTrash, color: '#3b82f6' };
  if (description.includes('tree') || description.includes('Redeemed')) return { icon: faTree, color: '#10b981' };
  if (description.includes('water')) return { icon: faWater, color: '#06b6d4' };
  return { icon: faCoins, color: '#eab308' };
};

const formatTimestamp = (dateString) => {
  const d = new Date(dateString);
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const MyTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        if (res.success) {
          setTransactions(res.data?.recentActivity || []);
        } else {
          setError('Failed to load transactions');
        }
      } catch (err) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    let earned = 0, redeemed = 0;
    for (const t of transactions) {
      if (t.type === 'earned') earned += t.amount || 0;
      else if (t.type === 'redeemed') redeemed += t.amount || 0;
    }
    return { earned, redeemed, balance: earned - redeemed, count: transactions.length };
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (!q) return true;
      return (t.description || '').toLowerCase().includes(q);
    });
  }, [transactions, filter, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
              Wallet log
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
              My Transactions
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Every credit you've earned, redeemed, or spent — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[280px]">
            <Stat label="Earned"   value={`+${totals.earned.toLocaleString()}`}   color="#10b981" icon={faArrowUp} />
            <Stat label="Redeemed" value={`-${totals.redeemed.toLocaleString()}`} color="#f97316" icon={faArrowDown} />
            <Stat label="Net"      value={totals.balance.toLocaleString()}        color="#14248a" icon={faCoins} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: 'var(--bg-body)' }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors"
                style={{
                  backgroundColor: active ? '#14248a' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-body)' }}>
          <FontAwesomeIcon icon={faSearch} className="text-xs" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by description or ticket…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {filtered.length} of {totals.count}
        </span>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No transactions match your filters</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {filtered.map((t, i) => (
              <Row key={t._id || i} t={t} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Stat = ({ label, value, color, icon }) => (
  <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-body)' }}>
    <div className="flex items-center gap-1.5 mb-1">
      <FontAwesomeIcon icon={icon} className="text-[10px]" style={{ color }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
    </div>
    <span className="text-lg font-black tabular-nums" style={{ color }}>{value}</span>
  </div>
);

const Row = ({ t }) => {
  const { icon, color } = getActivityIcon(t.description, t.type);
  const isEarned = t.type === 'earned';
  const ticket = t.description?.match(/TKT-[A-Z0-9]+/i)?.[0];

  return (
    <div className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--bg-hover)]">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {t.description || (isEarned ? 'Credits earned' : 'Credits redeemed')}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatTimestamp(t.createdAt)}
          </span>
          {ticket && (
            <span
              className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
            >
              {ticket}
            </span>
          )}
        </div>
      </div>
      <span className={`text-sm font-bold tabular-nums ${isEarned ? 'text-green-500' : 'text-orange-500'}`}>
        {isEarned ? '+' : '-'}{t.amount}
      </span>
    </div>
  );
};

export default MyTransactions;
