import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCoins, faTree, faLeaf, faEarthAmericas, faCloud, 
    faRecycle, faCheckCircle, faUsers, faHeart, faBrain
} from '@fortawesome/free-solid-svg-icons';
import StatsCard from '../components/common/StatsCard';
import HeroBanner from '../components/dashboard/HeroBanner';
import AQIWidget from '../components/widgets/AQIWidget';
import ActivityFeed from '../components/widgets/ActivityFeed';
import LeaderboardWidget from '../components/widgets/LeaderboardWidget';
import { getDashboardStats } from '../services/analyticsService';
import { getGlobalImpact } from '../services/api';
import { getStoredUser } from '../services/authService';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [globalImpact, setGlobalImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    fetchAllStats();
  }, []);

  const [localDrafts, setLocalDrafts] = useState([]);

  useEffect(() => {
    // Load drafts
    const saved = localStorage.getItem('eco_trace_drafts');
    if (saved) {
      setLocalDrafts(JSON.parse(saved));
    }
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [userStats, platformStats] = await Promise.all([
        getDashboardStats(),
        getGlobalImpact()
      ]);

      if (userStats.success) {
        setStats(userStats.data);

        // Sync localStorage credits with database value
        const currentUser = getStoredUser();
        if (currentUser && userStats.data.stats.currentBalance !== currentUser.credits) {
          const updatedUser = {
            ...currentUser,
            credits: userStats.data.stats.currentBalance
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));

          // Dispatch event to update header
          window.dispatchEvent(new CustomEvent('creditsUpdated', {
            detail: { credits: userStats.data.stats.currentBalance }
          }));
        }
      }
      
      if (platformStats?.success) {
        setGlobalImpact(platformStats.data);
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
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#14248a', borderTopColor: 'transparent' }}></div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
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
            onClick={fetchAllStats}
            className="px-6 py-2 rounded-lg text-white"
            style={{ background: '#14248a' }}
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
      <HeroBanner globalImpact={globalImpact} />
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
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500" style={{ backgroundColor: 'rgba(20, 36, 138, 0.1)' }}>
                <FontAwesomeIcon icon={faEarthAmericas} />
              </div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{t.dash_impact}</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 z-10">
              {/* CO2 Saved */}
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(20, 36, 138, 0.05)' }}>
                <div className="text-blue-500 mb-1"><FontAwesomeIcon icon={faCloud} /></div>
                <div className="font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>
                  {stats.stats.impact?.co2Saved || 0}
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t.dash_co2}</div>
              </div>

              {/* Trees */}
              <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(153, 143, 199, 0.05)' }}>
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
            color="#998fc7"
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
              <div className="rounded-xl p-6 flex flex-col justify-between h-[240px]" style={{ backgroundColor: '#14248a', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#ffffff' }}>Start a cleanup activity</h2>
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Upload photos or redeem your credits.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Upload', path: '/upload', solid: true },
                    { label: 'Redeem', path: '/redeem', solid: false },
                    { label: 'Feed',   path: '/feed',   solid: false },
                    { label: 'About',  path: '/about',  solid: false },
                  ].map(({ label, path, solid }) => (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className="py-2 rounded-lg text-sm font-semibold transition-colors"
                      style={solid
                        ? { backgroundColor: '#ffffff', color: '#14248a' }
                        : { backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }
                      }
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Official Portals</h3>
            <div className="space-y-1.5">
              {[
                { href: 'https://swachhbharatmission.gov.in/', label: 'Swachh Bharat Mission', sub: 'Government of India' },
                { href: 'https://ngodarpan.gov.in/', label: 'NGO Darpan Portal', sub: 'Directory of NGOs' },
                { href: 'https://mohua.gov.in/', label: 'MoHUA', sub: 'Urban Affairs & Subsidies' },
              ].map(({ href, label, sub }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--border-light)' }}>
                    <FontAwesomeIcon icon={faRecycle} style={{ color: '#14248a', fontSize: '13px' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default Dashboard;
