import React from 'react';
import { motion } from 'framer-motion';
import { faCoins, faCheckCircle, faTree } from '@fortawesome/free-solid-svg-icons';
import StatsCard from '../components/common/StatsCard';
import AQIWidget from '../components/widgets/AQIWidget';
import ActivityFeed from '../components/widgets/ActivityFeed';

const Dashboard = () => {
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
            value="2,450" 
            icon={faCoins} 
            color="#FBBF24" // Amber
            trend={12} 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Verified Photos" 
            value="148" 
            icon={faCheckCircle} 
            color="#3B82F6" // Blue
            trend={8} 
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Trees Planted" 
            value="24" 
            icon={faTree} 
            color="#10B981" // Green
            trend={25} 
          />
        </motion.div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AQI & Map Section - Takes 2 cols */}
        <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
          <AQIWidget />
          
          {/* Quick Actions / Banner */}
          <div className="card p-8 relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
             <div className="relative z-10 max-w-lg">
               <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Ready to make an impact?</h2>
               <p className="mb-6" style={{ color: '#FFFFFF', opacity: 0.9 }}>Upload your latest cleanup photos or plant a tree to earn more credits today.</p>
               <div className="flex gap-4">
                 <button 
                   className="px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                   style={{ 
                     backgroundColor: 'var(--bg-surface)', 
                     color: 'var(--primary)' 
                   }}
                 >
                   Upload
                 </button>
                 <button 
                   className="px-6 py-3 rounded-xl font-bold transition-all border"
                   style={{ 
                     backgroundColor: 'rgba(255,255,255,0.2)', 
                     color: '#FFFFFF',
                     borderColor: 'rgba(255,255,255,0.3)'
                   }}
                 >
                   Redeem
                 </button>
               </div>
             </div>
             {/* Decorative Circle */}
             <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
          </div>
        </motion.div>

        {/* Activity Feed - Takes 1 col */}
        <motion.div className="lg:col-span-1" variants={itemVariants}>
          <ActivityFeed />
        </motion.div>
      </div>
      
    </motion.div>
  );
};

export default Dashboard;
