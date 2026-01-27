import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getLeaderboard } from '../../services/analyticsService';
import { getStoredUser } from '../../services/authService';

const LeaderboardWidget = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = getStoredUser();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await getLeaderboard();
      if (response.success) {
        setLeaderboard(response.data);
      } else {
        setError('Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 text-2xl" />
        </div>
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          City Leaderboard
        </h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {leaderboard.map((user, index) => {
            const rank = user.rank || index + 1;
            const isCurrentUser = user._id === currentUser?.id;

            return (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl transition-all"
                style={{
                  background: isCurrentUser 
                    ? 'var(--gradient-primary)' 
                    : 'var(--bg-hover)',
                  border: isCurrentUser 
                    ? '2px solid var(--primary)' 
                    : '2px solid transparent',
                }}
              >
                {/* Rank */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ 
                    backgroundColor: rank <= 3 ? '#FEF3C7' : 'rgba(0,0,0,0.1)',
                    color: isCurrentUser ? '#fff' : (rank <= 3 ? '#D97706' : 'var(--text-secondary)')
                  }}
                >
                  {getRankBadge(rank)}
                </div>

                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{ 
                    background: isCurrentUser ? 'rgba(255,255,255,0.3)' : 'var(--gradient-primary)',
                    color: '#fff'
                  }}
                >
                  {getInitials(user.name)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-bold truncate"
                    style={{ color: isCurrentUser ? '#fff' : 'var(--text-primary)' }}
                  >
                    {user.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs font-normal opacity-90">(You)</span>
                    )}
                  </p>
                </div>

                {/* Credits */}
                <div className="text-right flex-shrink-0">
                  <p 
                    className="font-bold text-lg"
                    style={{ color: isCurrentUser ? '#fff' : 'var(--primary)' }}
                  >
                    {user.credits.toLocaleString()}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: isCurrentUser ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)' }}
                  >
                    credits
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-secondary)' }}>
            No users on the leaderboard yet
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;
