import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faCheckCircle, faTree, faCloud, faRecycle, faLeaf, faEarthAmericas } from '@fortawesome/free-solid-svg-icons';
import StatsCard from '../components/common/StatsCard';
import AQIWidget from '../components/widgets/AQIWidget';
import ActivityFeed from '../components/widgets/ActivityFeed';
import LeaderboardWidget from '../components/widgets/LeaderboardWidget';
import { getDashboardStats } from '../services/analyticsService';
import { getStoredUser } from '../services/authService';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const [localDrafts, setLocalDrafts] = useState([]);

  useEffect(() => {
    // Load drafts
    const saved = localStorage.getItem('eco_trace_drafts');
    if (saved) {
      setLocalDrafts(JSON.parse(saved));
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();

      if (response.success) {
        setStats(response.data);

        // Sync localStorage credits with database value
        const currentUser = getStoredUser();
        if (currentUser && response.data.stats.currentBalance !== currentUser.credits) {
          const updatedUser = {
            ...currentUser,
            credits: response.data.stats.currentBalance
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));

          // Dispatch event to update header
          window.dispatchEvent(new CustomEvent('creditsUpdated', {
            detail: { credits: response.data.stats.currentBalance }
          }));
        }
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 rounded-lg text-white"
            style={{ background: 'var(--gradient-primary)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <StatsCard
            title={t.dash_credits}
            value={stats.stats.currentBalance.toLocaleString()}
            icon={faCoins}
            color="#FBBF24"
            trend={stats.stats.currentBalance > 0 ? 15 : 0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <div className="card p-4 h-full flex flex-col justify-center relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 z-10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <FontAwesomeIcon icon={faEarthAmericas} />
              </div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{t.dash_impact}</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 z-10">
              {/* CO2 Saved */}
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                <div className="text-blue-500 mb-1"><FontAwesomeIcon icon={faCloud} /></div>
                <div className="font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>
                  {stats.stats.impact?.co2Saved || 0}
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t.dash_co2}</div>
              </div>

              {/* Trees */}
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                <div className="text-green-500 mb-1"><FontAwesomeIcon icon={faLeaf} /></div>
                <div className="font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>
                  {stats.stats.impact?.trees || 0}
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>Trees</div>
              </div>

              {/* Waste */}
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}>
                <div className="text-orange-500 mb-1"><FontAwesomeIcon icon={faRecycle} /></div>
                <div className="font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>
                  {stats.stats.impact?.waste || 0}
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t.dash_waste}</div>
              </div>
            </div>

            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-green-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title={t.dash_activities}
            value={stats.stats.totalSubmissions.toString()}
            icon={faTree}
            color="#10B981"
            trend={stats.stats.totalSubmissions > 5 ? 25 : 10}
          />
        </motion.div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Widgets + Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Widgets Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions Banner */}
            <motion.div variants={itemVariants}>
              <div className="card p-6 relative overflow-hidden flex flex-col justify-center h-[240px]" style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 100%)' }}>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-1" style={{ color: '#1E293B' }}>Add a cleanup activity here</h2>
                  <p className="mb-4 text-xs" style={{ color: '#475569' }}>Upload photos or redeem credits.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate('/upload')}
                      className="px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all bg-emerald-600 text-white border-none hover:bg-emerald-700"
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => navigate('/redeem')}
                      className="px-4 py-2 rounded-lg font-bold text-sm transition-all bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                    >
                      Redeem
                    </button>
                    <button
                      onClick={() => navigate('/feed')}
                      className="px-4 py-2 rounded-lg font-bold text-sm transition-all bg-blue-500 text-white border-none hover:bg-blue-600"
                    >
                      Feed
                    </button>
                    <button
                      onClick={() => navigate('/about')}
                      className="px-4 py-2 rounded-lg font-bold text-sm transition-all border-none hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
                    >
                      About Us
                    </button>
                  </div>
                </div>
                {/* Decorative Circle */}
                <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
              </div>
            </motion.div>

            {/* AQI Widget */}
            <motion.div variants={itemVariants} className="h-[240px]">
              <AQIWidget />
            </motion.div>
          </div>

          {/* Leaderboard Widget */}
          <motion.div variants={itemVariants}>
            <LeaderboardWidget />
          </motion.div>
        </div>

        {/* Right Column (Span 1): Activity Feed */}
        <motion.div className="lg:col-span-1 flex flex-col gap-6" variants={itemVariants}>
          <div className="flex-1">
            <ActivityFeed
              activities={[
                ...localDrafts.map(d => ({
                  _id: d.id,
                  type: 'draft',
                  description: `Draft: ${d.locationName || 'Cleanup'}`,
                  amount: 0,
                  createdAt: d.timestamp,
                  isDraft: true,
                  rawDraft: d
                })),
                ...(stats.recentActivity || [])
              ]}
            />
          </div>

          {/* Government Resources Card */}
          <div className="card p-6 bg-white shadow-sm border border-gray-100 rounded-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <span style={{ color: 'var(--text-primary)' }}>Official Portals</span>
            </h3>
            <div className="space-y-3">
              <a
                href="https://swachhbharatmission.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group border border-transparent hover:border-orange-100"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faRecycle} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-orange-700">Swachh Bharat Mission</h4>
                  <p className="text-xs text-gray-500">Government of India</p>
                </div>
              </a>

              <a
                href="https://ngodarpan.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-100"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faEarthAmericas} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-blue-700">NGO Darpan Portal</h4>
                  <p className="text-xs text-gray-500">Directory of NGOs</p>
                </div>
              </a>

              <a
                href="https://mohua.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group border border-transparent hover:border-green-100"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faTree} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-green-700">MoHUA</h4>
                  <p className="text-xs text-gray-500">Urban Affairs & Subsidies</p>
                </div>
              </a>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default Dashboard;
