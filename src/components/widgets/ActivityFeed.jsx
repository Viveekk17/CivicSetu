import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faWater, faTree, faCheckCircle, faCoins, faTimes, faHistory } from '@fortawesome/free-solid-svg-icons';

const ActivityFeed = ({ activities = [] }) => {
  const [showAllModal, setShowAllModal] = useState(false);
  const navigate = useNavigate();

  // Helper function to format time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const seconds = Math.floor((now - activityDate) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Helper to get icon and color based on transaction type
  const getActivityIcon = (description, type) => {
    if (type === 'draft') {
      return { icon: faHistory, color: 'text-purple-500', bg: 'bg-purple-50' };
    } else if (description.includes('garbage') || description.includes('cleanup')) {
      return { icon: faTrash, color: 'text-blue-500', bg: 'bg-blue-50' };
    } else if (description.includes('tree') || description.includes('Redeemed')) {
      return { icon: faTree, color: 'text-green-500', bg: 'bg-green-50' };
    } else if (description.includes('water')) {
      return { icon: faWater, color: 'text-cyan-500', bg: 'bg-cyan-50' };
    } else {
      return { icon: faCoins, color: 'text-yellow-500', bg: 'bg-yellow-50' };
    }
  };

  const ActivityItem = ({ item, index, showConnector }) => {
    const { icon, color, bg } = getActivityIcon(item.description, item.type);
    const isEarned = item.type === 'earned';
    const isDraft = item.type === 'draft';

    return (
      <div className="flex gap-4 relative">
        {/* Timeline connector */}
        {showConnector && (
          <div className="absolute left-5 top-10 bottom-[-1.5rem] w-0.5" style={{ backgroundColor: 'var(--border-light)' }}></div>
        )}

        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${color} ${bg || ''}`}
          style={{ backgroundColor: bg || 'var(--bg-hover)', borderColor: 'var(--border-light)' }}>
          <FontAwesomeIcon icon={icon} />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {item.description}
            </h4>
            {isDraft ? (
              <button
                onClick={() => {
                  // Navigate to upload and pass draft data via state or just let Upload page load it
                  // Since Upload page loads from localStorage, we can just navigate
                  // But specifically we might want to trigger the "resume" logic.
                  // For now, simple navigation works if the user manually clicks resume there.
                  // OR we navigate with state: { resumeDraftId: item._id }
                  // But the upload page logic checks localStorage.
                  // Let's just go to /upload.
                  navigate('/upload');
                }}
                className="text-xs font-bold text-purple-600 border border-purple-200 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100"
              >
                Resume
              </button>
            ) : (
              <span className={`text-xs font-bold ${isEarned ? 'text-green-500' : 'text-orange-500'}`}>
                {isEarned ? '+' : '-'}{item.amount} Credits
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{getTimeAgo(item.createdAt)}</p>
        </div>
      </div>
    );
  };

  if (activities.length === 0) {
    return (
      <div className="card p-6 h-full">
        <h3 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>My Transactions</h3>
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No transactions yet</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Start by uploading photos or redeeming credits!
          </p>
        </div>
      </div>
    );
  }

  // Show only top 10 most recent activities
  const recentActivities = activities.slice(0, 10);
  const hasMore = activities.length > 10;

  return (
    <>
      <div
        className="card p-6 h-full cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate('/submissions')}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>My Transactions</h3>
          {hasMore && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                navigate('/submissions');
              }}
              className="text-sm font-medium hover:underline transition-all"
              style={{ color: 'var(--primary)' }}
            >
              View All ({activities.length})
            </button>
          )}
        </div>

        <div className="space-y-6">
          {recentActivities.map((item, index) => (
            <ActivityItem
              key={item._id || index}
              item={item}
              index={index}
              showConnector={index !== recentActivities.length - 1}
            />
          ))}
        </div>

        {/* Hint to click */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            Click to view all your submissions →
          </p>
        </div>
      </div>

      {/* View All Modal */}
      <AnimatePresence>
        {showAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllModal(false)}
            style={{ margin: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="flex justify-between items-center p-8 pb-6 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                    <FontAwesomeIcon icon={faHistory} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      All Activity
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {activities.length} total transactions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 pt-6">
                <div className="space-y-6">
                  {activities.map((item, index) => (
                    <ActivityItem
                      key={item._id || index}
                      item={item}
                      index={index}
                      showConnector={index !== activities.length - 1}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActivityFeed;
