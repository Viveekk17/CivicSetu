import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTree, faLayerGroup, faPaw, faGlobeAmericas, faCoins, faSpinner, faTimes, faCheckCircle, faBus, faBolt, faGift } from '@fortawesome/free-solid-svg-icons';
import { getTrees, redeemTree } from '../services/treeService';
import { getStoredUser } from '../services/authService';

const Redeem = () => {
  const [activeTab, setActiveTab] = useState('trees');
  const [trees, setTrees] = useState([]);
  const [filteredTrees, setFilteredTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(getStoredUser());
  
  // Confirmation modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  
  // Success state
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  const tabs = [
    { id: 'transport', label: 'Transport', icon: faBus },
    { id: 'utilities', label: 'Utilities', icon: faBolt },
    { id: 'goodies', label: 'Goodies', icon: faGift },
    { id: 'environment', label: 'Environment', icon: faTree },
  ];

  // Fetch trees on mount
  useEffect(() => {
    fetchTrees();
  }, []);

  // Filter trees when activeTab changes
  useEffect(() => {
    if (activeTab === 'environment') {
      const filtered = trees.filter(tree => 
        ['trees', 'bundles', 'wildlife', 'offset'].includes(tree.category)
      );
      setFilteredTrees(filtered);
    } else {
      const filtered = trees.filter(tree => tree.category === activeTab);
      setFilteredTrees(filtered);
    }
  }, [activeTab, trees]);

  // Listen for credit updates
  useEffect(() => {
    const handleCreditsUpdate = () => {
      setUser(getStoredUser());
    };
    window.addEventListener('creditsUpdated', handleCreditsUpdate);
    return () => window.removeEventListener('creditsUpdated', handleCreditsUpdate);
  }, []);

  const fetchTrees = async () => {
    try {
      setLoading(true);
      const response = await getTrees();
      
      if (response.success) {
        setTrees(response.data);
      } else {
        setError('Failed to load trees');
      }
    } catch (err) {
      console.error('Fetch trees error:', err);
      setError(err.message || 'Failed to load trees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tree) => {
    setSelectedTree(tree);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTree(null);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedTree) return;

    try {
      setRedeeming(true);
      setError('');

      const response = await redeemTree(selectedTree._id);

      if (response.success) {
        // Update local user credits
        const updatedUser = {
          ...user,
          credits: response.data.newBalance
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Dispatch event to update header
        window.dispatchEvent(new CustomEvent('creditsUpdated', {
          detail: { credits: response.data.newBalance }
        }));

        // Show success
        setRedeemSuccess({
          tree: selectedTree,
          creditsSpent: response.data.creditsSpent,
          newBalance: response.data.newBalance
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

  // Get color classes for category
  const getCategoryColor = (category) => {
    const colors = {
      trees: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      bundles: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
      wildlife: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
      offset: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      transport: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
      utilities: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
      goodies: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300'
    };
    return colors[category] || colors.trees;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'transport': return faBus;
      case 'utilities': return faBolt;
      case 'goodies': return faGift;
      case 'wildlife': return faPaw;
      case 'offset': return faGlobeAmericas;
      case 'bundles': return faLayerGroup;
      default: return faTree;
    }
  };

  const getIconStyle = (category) => {
    const styles = {
      trees: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
      bundles: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
      wildlife: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400',
      offset: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      transport: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
      utilities: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
      goodies: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400'
    };
    return styles[category] || styles.trees;
  };

  return (
    <div className="space-y-8">
      {/* Success Message */}
      <AnimatePresence>
        {redeemSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 rounded-2xl flex items-center gap-4 border-2 border-green-500"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500" />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-green-600 dark:text-green-400 mb-2">
                Successfully Redeemed!
              </h3>
              <p className="text-gray-900 dark:text-gray-100 mb-1">
                You redeemed <span className="font-bold">{redeemSuccess.tree.name}</span> for <span className="font-bold">{redeemSuccess.creditsSpent}</span> credits
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                New balance: <span className="font-bold">{redeemSuccess.newBalance.toLocaleString()}</span> credits
              </p>
            </div>
            <button
              onClick={() => setRedeemSuccess(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-500 dark:text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center p-8 rounded-2xl relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
        <div className="relative z-10 text-white">
          <h1 className="text-3xl font-bold mb-2">Redeem & Restore Nature</h1>
          <p className="opacity-80 max-w-lg">Use your earned credits to make a real-world impact. Every item supports environmental restoration.</p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10 text-right text-white">
          <p className="text-sm opacity-70">Available Balance</p>
          <div className="text-4xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faCoins} className="text-yellow-300" />
            {user?.credits ? user.credits.toLocaleString() : 0}
          </div>
        </div>
        {/* Decor */}
        <FontAwesomeIcon icon={faTree} className="absolute -bottom-10 -right-10 text-9xl opacity-10 text-white" />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 pt-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'shadow-lg scale-105'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: `2px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`
            }}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl" style={{ color: 'var(--primary)' }} />
        </div>
      )}

      {/* Items Grid */}
      {!loading && (
        <div>
          {filteredTrees.length === 0 ? (
            <div className="text-center py-20">
              <FontAwesomeIcon icon={faTree} className="text-6xl mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No items available</p>
              <p style={{ color: 'var(--text-secondary)' }}>Check back soon for new items</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrees.map(item => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6 hover:shadow-xl transition-all"
                >
                  {/* Category Badge */}
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 capitalize ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </div>

                  {/* Icon/Image */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getIconStyle(item.category)}`}>
                    <FontAwesomeIcon icon={getCategoryIcon(item.category)} className="text-3xl" />
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </h3>
                  <p className="text-sm mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>

                  {/* Impact */}
                  <div className="mb-4 p-2 rounded-lg text-center text-sm" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <div style={{ color: 'var(--text-tertiary)' }}>CO₂ Offset:</div>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {item.impact?.co2Offset || 0} kg
                    </div>
                  </div>

                  {/* Divider */}
                  <hr className="my-4" style={{ borderColor: 'var(--border-light)' }} />

                  {/* Price & Redeem Button */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
                      <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {item.cost.toLocaleString()}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>credits</span>
                    </div>
                    <button
                      onClick={() => handleOpenModal(item)}
                      disabled={!item.available || (user?.credits || 0) < item.cost}
                      className="w-full px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: item.available && (user?.credits || 0) >= item.cost ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                        color: item.available && (user?.credits || 0) >= item.cost ? 'white' : 'var(--text-tertiary)'
                      }}
                    >
                      {!item.available ? 'Unavailable' : (user?.credits || 0) < item.cost ? 'Insufficient' : 'Redeem'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && selectedTree && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Confirm Redemption
              </h2>

              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faTree} className="text-4xl text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
                  {selectedTree.name}
                </h3>
                <p className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {selectedTree.description}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cost</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedTree.cost.toLocaleString()} credits
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Your Balance</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {(user?.credits || 0).toLocaleString()} credits
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <span className="text-gray-700 dark:text-gray-300">After Redemption</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {((user?.credits || 0) - selectedTree.cost).toLocaleString()} credits
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCloseModal}
                  disabled={redeeming}
                  className="flex-1 py-3 rounded-xl font-bold border-2 transition-all"
                  style={{
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  disabled={redeeming}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {redeeming ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Redeeming...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Redeem;
