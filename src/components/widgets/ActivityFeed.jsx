import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faWater, faTree, faCoins, faHistory, faChevronLeft, faChevronRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
// "View all" anchor lives in the sidebar now — navigate kept for draft resume only.

const PAGE_SIZE = 5;

const ActivityFeed = ({ activities = [] }) => {
  const [page, setPage] = useState(0);
  const [hoverId, setHoverId] = useState(null);
  const navigate = useNavigate();

  const getTimeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getActivityIcon = (description, type) => {
    if (type === 'draft') return { icon: faHistory, color: 'text-purple-500', bg: 'bg-purple-50' };
    if (description.includes('garbage') || description.includes('cleanup')) return { icon: faTrash, color: 'text-blue-500', bg: 'bg-blue-50' };
    if (description.includes('tree') || description.includes('Redeemed')) return { icon: faTree, color: 'text-green-500', bg: 'bg-green-50' };
    if (description.includes('water')) return { icon: faWater, color: 'text-cyan-500', bg: 'bg-cyan-50' };
    return { icon: faCoins, color: 'text-yellow-500', bg: 'bg-yellow-50' };
  };

  const formatDescription = (desc, type) => {
    if (type === 'draft') return { title: 'Draft', meta: null };
    const ticketMatch = desc?.match(/TKT-[A-Z0-9]+/i);
    const ticket = ticketMatch ? ticketMatch[0] : null;
    if (type === 'redeemed' || /^Redeemed/i.test(desc || '')) {
      return { title: 'Credits redeemed', meta: null };
    }
    return { title: 'Credits earned', meta: ticket };
  };

  const ActivityItem = ({ item, rowId }) => {
    const { icon, color } = getActivityIcon(item.description, item.type);
    const isEarned = item.type === 'earned';
    const isDraft = item.type === 'draft';
    const { title, meta } = formatDescription(item.description, item.type);
    const isHover = hoverId === rowId;
    const hasDetail = !!item.description && !isDraft;

    return (
      <div className="py-2.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}
            style={{ backgroundColor: 'var(--bg-hover)' }}
          >
            <FontAwesomeIcon icon={icon} className="text-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {title}
              </p>
              {hasDetail && (
                <span
                  className="relative inline-flex w-4 h-4 items-center justify-center"
                  onMouseEnter={() => setHoverId(rowId)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <span
                    className="rounded-full flex items-center justify-center transition-colors cursor-help"
                    style={{ color: isHover ? 'var(--primary)' : 'var(--text-tertiary)' }}
                    aria-label="Show details"
                  >
                    <FontAwesomeIcon icon={faCircleInfo} className="text-[11px]" />
                  </span>
                  <AnimatePresence>
                    {isHover && (
                      // Static absolute wrapper handles positioning so framer's
                      // animated `transform` doesn't fight a Tailwind translate.
                      <div
                        className="absolute z-50 pointer-events-none"
                        style={{
                          left: '50%',
                          bottom: 'calc(100% + 8px)',
                          transform: 'translateX(-50%)',
                          width: 240,
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.14 }}
                          className="px-3 py-2 rounded-2xl text-xs leading-relaxed relative"
                          style={{
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: 'var(--text-secondary)',
                            border: '1px solid rgba(255,255,255,0.6)',
                            boxShadow: '0 12px 32px -8px rgba(20,36,138,0.25), 0 4px 12px rgba(0,0,0,0.06)',
                          }}
                        >
                          {item.description}
                          <span
                            className="absolute w-2.5 h-2.5"
                            style={{
                              left: '50%',
                              bottom: -5,
                              transform: 'translateX(-50%) rotate(45deg)',
                              background: 'rgba(255,255,255,0.95)',
                              borderRight: '1px solid rgba(255,255,255,0.6)',
                              borderBottom: '1px solid rgba(255,255,255,0.6)',
                            }}
                          />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {getTimeAgo(item.createdAt)}
              </span>
              {meta && (
                <>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>·</span>
                  <span
                    className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
                  >
                    {meta}
                  </span>
                </>
              )}
            </div>
          </div>

          {isDraft ? (
            <button
              onClick={() => navigate('/upload')}
              className="text-xs font-semibold text-purple-600 px-2.5 py-1 rounded-full hover:bg-purple-50 transition-colors"
            >
              Resume
            </button>
          ) : (
            <span className={`text-sm font-semibold tabular-nums ${isEarned ? 'text-green-500' : 'text-orange-500'}`}>
              {isEarned ? '+' : '-'}{item.amount}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (activities.length === 0) {
    return (
      <div className="card p-6 h-full">
        <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>My Transactions</h3>
        <div className="text-center py-10">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No transactions yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Upload photos or redeem credits to get started
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(activities.length / PAGE_SIZE);
  const pageData = activities.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>My Transactions</h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => { if (page > 0) e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            </button>
            <span className="text-xs font-medium px-2" style={{ color: 'var(--text-tertiary)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => { if (page < totalPages - 1) e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            </button>
          </div>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
        <AnimatePresence mode="wait">
          {pageData.map((item, index) => (
            <motion.div
              key={item._id || `${page}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              style={{ borderColor: 'var(--border-light)' }}
              className={index > 0 ? 'border-t' : ''}
            >
              <ActivityItem item={item} rowId={item._id || `${page}-${index}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityFeed;
