import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTree, faLayerGroup, faPaw, faGlobeAmericas, faCoins, faSpinner,
  faTimes, faCheckCircle, faBus, faBolt, faGift, faMedal, faSearch,
  faSortAmountDown, faSortAmountUp, faStar, faArrowRight, faGifts,
} from '@fortawesome/free-solid-svg-icons';
import { getTrees, redeemTree } from '../services/treeService';
import { getStoredUser } from '../services/authService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { y: 14, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const CATEGORY_META = {
  trees:       { label: 'Trees',       icon: faTree,           group: 'environment' },
  bundles:     { label: 'Bundles',     icon: faLayerGroup,     group: 'environment' },
  wildlife:    { label: 'Wildlife',    icon: faPaw,            group: 'environment' },
  offset:      { label: 'CO₂ Offset',  icon: faGlobeAmericas,  group: 'environment' },
  transport:   { label: 'Transport',   icon: faBus,            group: 'transport'   },
  utilities:   { label: 'Utilities',   icon: faBolt,           group: 'utilities'   },
  goodies:     { label: 'Goodies',     icon: faGift,           group: 'goodies'     },
  recognition: { label: 'Recognition', icon: faMedal,          group: 'recognition' },
};

const TABS = [
  { id: 'all',         label: 'All',         icon: faGifts },
  { id: 'environment', label: 'Environment', icon: faTree  },
  { id: 'transport',   label: 'Transport',   icon: faBus   },
  { id: 'utilities',   label: 'Utilities',   icon: faBolt  },
  { id: 'goodies',     label: 'Goodies',     icon: faGift  },
  { id: 'recognition', label: 'Recognition', icon: faMedal },
];

const SORT_OPTIONS = [
  { id: 'affordable', label: 'Affordable first', icon: faStar          },
  { id: 'low',        label: 'Cost: low to high', icon: faSortAmountUp  },
  { id: 'high',       label: 'Cost: high to low', icon: faSortAmountDown },
];

const HeroCard = ({ user, totalItems, affordableCount, onScrollToGrid }) => {
  const credits = user?.credits || 0;
  return (
    <div className="card p-6 md:p-7 relative overflow-hidden">
      <div className="grid md:grid-cols-5 gap-6 items-center relative z-10">
        <div className="md:col-span-3">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Reward Marketplace
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>
            Redeem &amp; restore
          </h2>
          <p className="text-sm mt-2 max-w-md" style={{ color: 'var(--text-secondary)' }}>
            Convert your civic credits into trees, bus passes, utility offsets and recognition. Every redemption funds real-world impact.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={onScrollToGrid} className="btn btn-primary">
              <FontAwesomeIcon icon={faGifts} /> Browse rewards
            </button>
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
            >
              <FontAwesomeIcon icon={faStar} className="text-[10px]" />
              {affordableCount} of {totalItems} within your reach
            </div>
          </div>
        </div>

        <div
          className="md:col-span-2 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)', color: '#fff' }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Available balance
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <FontAwesomeIcon icon={faCoins} className="text-amber-300 text-sm" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums">{credits.toLocaleString()}</span>
            <span className="text-xs opacity-80">credits</span>
          </div>
          <p className="text-[11px] opacity-80 leading-relaxed">
            Earn more by uploading verified cleanups or reporting civic issues.
          </p>

          <div
            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.25), transparent 70%)' }}
          />
        </div>
      </div>
    </div>
  );
};

const RewardCard = ({ item, balance, onRedeem, index }) => {
  const meta = CATEGORY_META[item.category] || CATEGORY_META.trees;
  const canAfford = balance >= item.cost;
  const isUnavailable = !item.available;
  const disabled = isUnavailable || !canAfford;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
      className="card p-5 flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
        >
          <FontAwesomeIcon icon={meta.icon} className="text-base" />
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-1 rounded-full"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
        >
          {meta.label}
        </span>
      </div>

      <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {item.name}
      </h3>
      <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
        {item.description}
      </p>

      {item.impact?.co2Offset > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-[11px] font-medium"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
        >
          <FontAwesomeIcon icon={faGlobeAmericas} style={{ color: 'var(--primary)' }} />
          <span>Offsets <strong style={{ color: 'var(--text-primary)' }}>{item.impact.co2Offset} kg</strong> CO₂</span>
        </div>
      )}

      <div className="mt-auto pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Cost
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <FontAwesomeIcon icon={faCoins} className="text-amber-500 text-xs" />
              <span className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {item.cost.toLocaleString()}
              </span>
            </div>
          </div>
          {!disabled && (
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-1 rounded-full"
              style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
            >
              Affordable
            </span>
          )}
        </div>
        <button
          onClick={() => onRedeem(item)}
          disabled={disabled}
          className={disabled ? 'btn btn-outline w-full opacity-60 cursor-not-allowed' : 'btn btn-primary w-full'}
        >
          {isUnavailable ? 'Unavailable' : !canAfford ? `Need ${(item.cost - balance).toLocaleString()} more` : (
            <>Redeem <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const Redeem = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(getStoredUser());

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('affordable');

  const [showModal, setShowModal] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  useEffect(() => { fetchTrees(); }, []);

  useEffect(() => {
    const handle = () => setUser(getStoredUser());
    window.addEventListener('creditsUpdated', handle);
    return () => window.removeEventListener('creditsUpdated', handle);
  }, []);

  const fetchTrees = async () => {
    try {
      setLoading(true);
      const response = await getTrees();
      if (response.success) setTrees(response.data);
      else setError('Failed to load rewards');
    } catch (err) {
      console.error('Fetch trees error:', err);
      setError(err.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const balance = user?.credits || 0;

  const visibleItems = useMemo(() => {
    let list = trees;

    if (activeTab !== 'all') {
      list = list.filter((t) => (CATEGORY_META[t.category]?.group || t.category) === activeTab);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q),
      );
    }

    const sorted = [...list];
    if (sortBy === 'low') sorted.sort((a, b) => a.cost - b.cost);
    else if (sortBy === 'high') sorted.sort((a, b) => b.cost - a.cost);
    else {
      sorted.sort((a, b) => {
        const aOk = balance >= a.cost ? 0 : 1;
        const bOk = balance >= b.cost ? 0 : 1;
        if (aOk !== bOk) return aOk - bOk;
        return a.cost - b.cost;
      });
    }
    return sorted;
  }, [trees, activeTab, search, sortBy, balance]);

  const affordableCount = useMemo(
    () => trees.filter((t) => t.available && balance >= t.cost).length,
    [trees, balance],
  );

  const tabCounts = useMemo(() => {
    const counts = { all: trees.length };
    trees.forEach((t) => {
      const g = CATEGORY_META[t.category]?.group || t.category;
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [trees]);

  const handleOpenModal = (tree) => { setSelectedTree(tree); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setSelectedTree(null); };

  const handleConfirmRedeem = async () => {
    if (!selectedTree) return;
    try {
      setRedeeming(true);
      setError('');
      const response = await redeemTree(selectedTree._id);
      if (response.success) {
        const updatedUser = response.data.user || { ...user, credits: response.data.newBalance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new CustomEvent('creditsUpdated', {
          detail: { credits: response.data.newBalance },
        }));
        setRedeemSuccess({
          tree: selectedTree,
          creditsSpent: response.data.creditsSpent,
          newBalance: response.data.newBalance,
        });
        handleCloseModal();
      } else {
        setError(response.message || 'Redemption failed');
      }
    } catch (err) {
      console.error('Redeem error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to redeem');
    } finally {
      setRedeeming(false);
    }
  };

  const scrollToGrid = () => {
    const el = document.getElementById('rewards-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success toast */}
      <AnimatePresence>
        {redeemSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="card p-5 flex items-center gap-4"
            style={{ borderColor: 'var(--primary)', borderWidth: 1 }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Redemption confirmed
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {redeemSuccess.tree.name} · {redeemSuccess.creditsSpent.toLocaleString()} credits
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                New balance: <strong>{redeemSuccess.newBalance.toLocaleString()}</strong> credits
              </p>
            </div>
            <button
              onClick={() => setRedeemSuccess(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div
          className="card p-4 flex items-center justify-between"
          style={{ borderColor: '#fecaca', borderWidth: 1, backgroundColor: '#fef2f2' }}
        >
          <span className="text-sm font-medium text-red-600">{error}</span>
          <button onClick={() => setError('')} className="text-red-500">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      <motion.div variants={itemVariants}>
        <HeroCard
          user={user}
          totalItems={trees.length}
          affordableCount={affordableCount}
          onScrollToGrid={scrollToGrid}
        />
      </motion.div>

      {/* Filters card */}
      <motion.div variants={itemVariants}>
        <div className="card p-4 md:p-5 space-y-4" id="rewards-grid">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const count = tabCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--primary)' : 'var(--bg-hover)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <FontAwesomeIcon icon={tab.icon} className="text-[11px]" />
                  {tab.label}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'var(--bg-surface)',
                      color: active ? '#fff' : 'var(--text-tertiary)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Sort */}
          <div className="flex flex-col md:flex-row gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1"
              style={{ backgroundColor: 'var(--bg-hover)' }}
            >
              <FontAwesomeIcon icon={faSearch} style={{ color: 'var(--text-tertiary)' }} className="text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rewards..."
                className="bg-transparent outline-none w-full text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: 'var(--text-tertiary)' }}>
                  <FontAwesomeIcon icon={faTimes} className="text-xs" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {SORT_OPTIONS.map((opt) => {
                const active = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--primary-lighter)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-tertiary)',
                      border: `1px solid ${active ? 'var(--primary-lighter)' : 'var(--border-light)'}`,
                    }}
                  >
                    <FontAwesomeIcon icon={opt.icon} className="text-[11px]" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 h-64 animate-pulse">
              <div className="w-11 h-11 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-hover)' }} />
              <div className="h-4 w-3/4 rounded mb-2" style={{ backgroundColor: 'var(--bg-hover)' }} />
              <div className="h-3 w-full rounded mb-1" style={{ backgroundColor: 'var(--bg-hover)' }} />
              <div className="h-3 w-2/3 rounded" style={{ backgroundColor: 'var(--bg-hover)' }} />
            </div>
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="card p-12 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
          >
            <FontAwesomeIcon icon={faGifts} className="text-xl" />
          </div>
          <p className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
            No rewards match your filters
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try a different category or clear the search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleItems.map((item, idx) => (
            <RewardCard key={item._id} item={item} balance={balance} onRedeem={handleOpenModal} index={idx} />
          ))}
        </div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {showModal && selectedTree && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="card p-6 md:p-7 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
                >
                  <FontAwesomeIcon
                    icon={CATEGORY_META[selectedTree.category]?.icon || faTree}
                    className="text-base"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Confirm redemption
                  </p>
                  <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {selectedTree.name}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {selectedTree.description}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <div
                  className="flex justify-between items-center px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-hover)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Cost</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {selectedTree.cost.toLocaleString()} credits
                  </span>
                </div>
                <div
                  className="flex justify-between items-center px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-hover)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Your balance</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {balance.toLocaleString()} credits
                  </span>
                </div>
                <div
                  className="flex justify-between items-center px-4 py-3 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)',
                    color: '#fff',
                  }}
                >
                  <span className="text-xs font-semibold opacity-90">After redemption</span>
                  <span className="text-sm font-black tabular-nums">
                    {(balance - selectedTree.cost).toLocaleString()} credits
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-col-reverse md:flex-row">
                <button
                  onClick={handleCloseModal}
                  disabled={redeeming}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  disabled={redeeming}
                  className="btn btn-primary flex-1"
                >
                  {redeeming ? (
                    <><FontAwesomeIcon icon={faSpinner} spin /> Processing</>
                  ) : (
                    <>Confirm <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Redeem;
