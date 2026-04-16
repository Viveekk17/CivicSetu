import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader2, ChevronLeft, ChevronRight, Wind, TreePine } from 'lucide-react';
import { getLeaderboard } from '../../services/analyticsService';
import { getStoredUser } from '../../services/authService';

const PAGE_SIZE = 5;

// Medal colors for top 3
const RANK_COLORS = {
  1: { bg: '#FFD700', text: '#78581a', label: '1st' },
  2: { bg: '#C0C0C0', text: '#555555', label: '2nd' },
  3: { bg: '#CD7F32', text: '#5a320a', label: '3rd' },
};

const LeaderboardWidget = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const currentUser = getStoredUser();

  useEffect(() => { fetchLeaderboard(); }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await getLeaderboard();
      if (response.success) setLeaderboard(response.data);
      else setError('Failed to load leaderboard');
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const totalPages = Math.ceil(leaderboard.length / PAGE_SIZE);
  const pageData = leaderboard.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (loading) {
    return (
      <div className="card p-6 flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
            <Trophy size={17} style={{ color: '#d97706' }} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Environmental Leaderboard</h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{leaderboard.length} participants</p>
          </div>
        </div>
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
              <ChevronLeft size={14} />
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
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No users on the leaderboard yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {pageData.map((user, index) => {
              const rank = user.rank || (page * PAGE_SIZE + index + 1);
              const isCurrentUser = user._id === currentUser?.id;
              const rankStyle = RANK_COLORS[rank];

              return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{
                    backgroundColor: isCurrentUser ? '#14248a' : 'var(--bg-body)',
                    border: isCurrentUser ? '1.5px solid #14248a' : '1.5px solid var(--border-light)',
                  }}
                >
                  {/* Rank badge */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={rankStyle
                      ? { backgroundColor: rankStyle.bg, color: rankStyle.text }
                      : { backgroundColor: 'var(--border-light)', color: 'var(--text-secondary)' }
                    }
                  >
                    {rankStyle ? rankStyle.label : rank}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : '#14248a', color: '#fff' }}
                  >
                    {(user.profilePicture && !user.profilePicture.includes('default-avatar.png'))
                      ? <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                      : getInitials(user.name)
                    }
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: isCurrentUser ? '#fff' : 'var(--text-primary)' }}>
                      {user.name}
                      {isCurrentUser && <span className="ml-1.5 text-[10px] font-normal opacity-75">(You)</span>}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                    <div className="flex items-center gap-1">
                      <Wind size={11} style={{ color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }} />
                      <span className="font-bold" style={{ color: isCurrentUser ? '#fff' : 'var(--primary)' }}>
                        {(user.impact?.pollutionSaved || user.pollutionSaved || 0).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TreePine size={11} style={{ color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }} />
                      <span className="font-bold" style={{ color: isCurrentUser ? '#fff' : '#998fc7' }}>
                        {user.impact?.treesPlanted || user.treesPlanted || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;
