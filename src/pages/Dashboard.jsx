import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { faCoins, faCheckCircle, faTree } from '@fortawesome/free-solid-svg-icons';
import StatsCard from '../components/common/StatsCard';
import AQIWidget from '../components/widgets/AQIWidget';
import ActivityFeed from '../components/widgets/ActivityFeed';
import { getDashboardStats } from '../services/analyticsService';
import { getStoredUser } from '../services/authService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    fetchDashboardData();
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
            title="Carbon Credits" 
            value={stats.stats.currentBalance.toLocaleString()} 
            icon={faCoins} 
            color="#FBBF24"
            trend={stats.stats.currentBalance > 0 ? 15 : 0} 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Verified Photos" 
            value={stats.stats.verifiedSubmissions.toString()} 
            icon={faCheckCircle} 
            color="#3B82F6"
            trend={stats.stats.totalSubmissions > 0 ? Math.round((stats.stats.verifiedSubmissions / stats.stats.totalSubmissions) * 100) : 0} 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Total Submissions" 
            value={stats.stats.totalSubmissions.toString()} 
            icon={faTree} 
            color="#10B981"
            trend={stats.stats.totalSubmissions > 5 ? 25 : 10} 
          />
        </motion.div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Quick Actions Banner - Reduced Height */}
        <motion.div className="lg:col-span-1" variants={itemVariants}>
          <div className="card p-6 relative overflow-hidden flex flex-col justify-center h-[240px]" style={{ background: 'var(--gradient-primary)' }}>
             <div className="relative z-10">
               <h2 className="text-xl font-bold mb-1" style={{ color: '#FFFFFF' }}>Ready to impact?</h2>
               <p className="mb-4 text-xs" style={{ color: '#FFFFFF', opacity: 0.9 }}>Upload photos or redeem credits.</p>
               <div className="flex flex-col gap-2">
                 <button 
                   className="w-full px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all bg-white text-emerald-600 border-none"
                 >
                   Upload Now
                 </button>
                 <button 
                   className="w-full px-4 py-2 rounded-lg font-bold text-sm transition-all border border-white/30 text-white hover:bg-white/10"
                 >
                   Redeem Rewards
                 </button>
               </div>
             </div>
             {/* Decorative Circle */}
             <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          </div>
        </motion.div>

        {/* Column 2: AQI Widget - Compact Height */}
        <motion.div className="lg:col-span-1 h-[240px]" variants={itemVariants}>
          <AQIWidget />
        </motion.div>

        {/* Column 3: Activity Feed - Tall / Full Height */}
        <motion.div className="lg:col-span-1 h-full min-h-[240px]" variants={itemVariants}>
          <ActivityFeed activities={stats.recentActivity} />
        </motion.div>
      </div>
      
    </motion.div>
  );
};

export default Dashboard;
