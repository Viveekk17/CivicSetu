import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCoins, faTree, faCloud, faRecycle, faCamera, faBullhorn,
  faArrowRight, faExternalLinkAlt
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

const PORTALS = [
  { href: 'https://swachhbharatmission.gov.in/', label: 'Swachh Bharat Mission', sub: 'Government of India' },
  { href: 'https://ngodarpan.gov.in/',           label: 'NGO Darpan Portal',     sub: 'Directory of NGOs' },
  { href: 'https://mohua.gov.in/',               label: 'MoHUA',                 sub: 'Urban Affairs & Subsidies' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const WelcomeCard = ({ user, credits, onUpload, onRedeem, onReport }) => (
  <div className="card p-6 md:p-7 relative overflow-hidden">
    <div className="grid md:grid-cols-5 gap-6 items-center relative z-10">
      <div className="md:col-span-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
          Welcome back
        </p>
        <h2 className="text-2xl md:text-3xl font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>
          {user?.name || 'Citizen'}
        </h2>
        <p className="text-sm mt-2 max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Continue your civic journey. Every photo, report, and tree counts toward a cleaner India.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <button onClick={onUpload} className="btn btn-primary">
            <FontAwesomeIcon icon={faCamera} /> Upload cleanup
          </button>
          <button onClick={onReport} className="btn btn-outline">
            <FontAwesomeIcon icon={faBullhorn} /> Report issue
          </button>
        </div>
      </div>

      <div
        className="md:col-span-2 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)', color: '#fff' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Credit balance
          </span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <FontAwesomeIcon icon={faCoins} className="text-amber-300 text-sm" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tabular-nums">{credits.toLocaleString()}</span>
          <span className="text-xs opacity-80">credits</span>
        </div>
        <button
          onClick={onRedeem}
          className="mt-1 self-start text-xs font-semibold rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.28)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)')}
        >
          Redeem for trees <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
        </button>

        <div
          className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.25), transparent 70%)' }}
        />
      </div>
    </div>
  </div>
);

const PortalsStrip = () => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-tertiary)' }}>
        Official Portals
      </h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {PORTALS.map(({ href, label, sub }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl border transition-colors group"
          style={{ borderColor: 'var(--border-light)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-lighter)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
          >
            <FontAwesomeIcon icon={faRecycle} className="text-xs" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{label}</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
          </div>
          <FontAwesomeIcon
            icon={faExternalLinkAlt}
            className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--primary)' }}
          />
        </a>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [globalImpact, setGlobalImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localDrafts, setLocalDrafts] = useState([]);
  const user = getStoredUser();

  useEffect(() => {
    fetchAllStats();
    const saved = localStorage.getItem('eco_trace_drafts');
    if (saved) setLocalDrafts(JSON.parse(saved));
  }, []);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [userStats, platformStats] = await Promise.all([
        getDashboardStats(),
        getGlobalImpact(),
      ]);

      if (userStats.success) {
        setStats(userStats.data);

        const currentUser = getStoredUser();
        if (currentUser && userStats.data.stats.currentBalance !== currentUser.credits) {
          const updatedUser = { ...currentUser, credits: userStats.data.stats.currentBalance };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new CustomEvent('creditsUpdated', {
            detail: { credits: userStats.data.stats.currentBalance },
          }));
        }
      }

      if (platformStats?.success) setGlobalImpact(platformStats.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchAllStats} className="btn btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  const balance = stats.stats.currentBalance || 0;
  const impact = stats.stats.impact || {};

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <HeroBanner globalImpact={globalImpact} />

      {/* Welcome + Balance */}
      <motion.div variants={itemVariants}>
        <WelcomeCard
          user={user}
          credits={balance}
          onUpload={() => navigate('/upload')}
          onRedeem={() => navigate('/redeem')}
          onReport={() => navigate('/report-issue')}
        />
      </motion.div>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <StatsCard
            title={t.dash_credits || 'Credits'}
            value={balance.toLocaleString()}
            icon={faCoins}
            color="primary"
            trend={balance > 0 ? 15 : 0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title={t.dash_co2 || 'CO₂ Saved'}
            value={impact.co2Saved || 0}
            suffix="kg"
            icon={faCloud}
            color="info"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title={t.dash_activities || 'Trees Planted'}
            value={impact.trees || 0}
            icon={faTree}
            color="success"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            title={t.dash_waste || 'Waste Cleared'}
            value={impact.waste || 0}
            suffix="kg"
            icon={faRecycle}
            color="secondary"
          />
        </motion.div>
      </div>

      {/* Live widgets row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="h-full">
          <AQIWidget />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <ActivityFeed
            activities={[
              ...localDrafts.map((d) => ({
                _id: d.id,
                type: 'draft',
                description: `Draft: ${d.locationName || 'Cleanup'}`,
                amount: 0,
                createdAt: d.timestamp,
                isDraft: true,
                rawDraft: d,
              })),
              ...(stats.recentActivity || []),
            ]}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <LeaderboardWidget />
        </motion.div>
      </div>

      {/* Footer strip */}
      <motion.div variants={itemVariants}>
        <PortalsStrip />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
