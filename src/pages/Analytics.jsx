import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCheckCircle, faCoins, faPercentage } from '@fortawesome/free-solid-svg-icons';
import StatsCard from '../components/common/StatsCard';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import ImpactMetrics from '../components/charts/ImpactMetrics';
import LeaderboardWidget from '../components/widgets/LeaderboardWidget';
import { getDetailedAnalytics } from '../services/analyticsService';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timePeriod, setTimePeriod] = useState('1year'); // 24h, 7days, 1month, 1year

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]); 

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getDetailedAnalytics(timePeriod);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const prepareCreditsData = () => {
    if (!analyticsData?.creditsTrend) return { labels: [], data: [] };
    
    const now = new Date();
    const labels = [];
    const data = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create a map of all data
    const dataMap = new Map();
    analyticsData.creditsTrend.forEach(item => {
      let key;
      if (timePeriod === '24h') {
        key = `${item._id.year}-${item._id.month}-${item._id.day}-${item._id.hour}`;
      } else if (timePeriod === '1year') {
        key = `${item._id.year}-${item._id.month}`;
      } else {
        key = `${item._id.year}-${item._id.month}-${item._id.day}`;
      }
      dataMap.set(key, item.total);
    });

    // Generate labels and fetch corresponding data based on selected period
    if (timePeriod === '24h') {
      // Last 24 hours - hourly
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        labels.push(`${displayHour} ${ampm}`);
        
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${hour}`;
        data.push(dataMap.get(key) || 0);
      }
    } else if (timePeriod === '7days') {
      // Last 7 days - aggregate by day
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(`${date.getDate()} ${monthNames[date.getMonth()]}`);
        
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        data.push(dataMap.get(key) || 0);
      }
    } else if (timePeriod === '1month') {
      // Last 30 days - aggregate by day
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(`${date.getDate()} ${monthNames[date.getMonth()]}`);
        
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        data.push(dataMap.get(key) || 0);
      }
    } else if (timePeriod === '1year') {
      // Last 12 months - aggregate by month
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthNames[date.getMonth()]);
        
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        data.push(dataMap.get(key) || 0);
      }
    }

    return { labels, data };
  };

  const prepareMonthlyActivityData = () => {
    if (!analyticsData?.monthlyActivity) return { labels: [], data: [] };
    
    console.log('Monthly Activity Raw Data:', analyticsData.monthlyActivity);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const labels = [];
    const data = [];
    
    // Create a map of existing monthly activity data
    const dataMap = new Map();
    analyticsData.monthlyActivity.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      dataMap.set(key, item.count);
      console.log(`Month: ${monthNames[item._id.month - 1]} ${item._id.year}, Count: ${item.count}`);
    });
    
    // Generate labels for last 12 months and get corresponding data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(monthNames[date.getMonth()]);
      
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      data.push(dataMap.get(key) || 0);
    }
    
    console.log('Monthly Activity Labels:', labels);
    console.log('Monthly Activity Data:', data);

    return { labels, data };
  };

  const prepareStatusData = () => {
    if (!analyticsData?.submissionsByStatus) {
      return { labels: [], data: [], colors: [] };
    }

    const status = analyticsData.submissionsByStatus;
    const labels = [];
    const data = [];
    const colors = [];

    if (status.verified > 0) {
      labels.push('Verified');
      data.push(status.verified);
      colors.push('#10B981');
    }
    if (status.pending > 0) {
      labels.push('Pending');
      data.push(status.pending);
      colors.push('#F59E0B');
    }
    if (status.rejected > 0) {
      labels.push('Rejected');
      data.push(status.rejected);
      colors.push('#EF4444');
    }

    return { labels, data, colors };
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

  // Only show full page loader on initial load
  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
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
            onClick={fetchAnalytics}
            className="px-6 py-2 rounded-lg text-white"
            style={{ background: 'var(--gradient-primary)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const creditsData = prepareCreditsData();
  const activityData = prepareMonthlyActivityData();
  const statusData = prepareStatusData();

  return (
    <motion.div 
      className={`space-y-6 overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Analytics Dashboard
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            Track your environmental impact and performance metrics
          </p>
        </div>
        {loading && analyticsData && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
            Updating...
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Total Submissions" 
            value={analyticsData.stats.totalSubmissions.toString()} 
            icon={faChartLine} 
            color="#3B82F6"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Verified" 
            value={analyticsData.stats.verifiedSubmissions.toString()} 
            icon={faCheckCircle} 
            color="#10B981"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Verification Rate" 
            value={`${analyticsData.stats.verificationRate}%`} 
            icon={faPercentage} 
            color="#8B5CF6"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard 
            title="Total Credits Earned" 
            value={analyticsData.stats.totalCreditsEarned.toLocaleString()} 
            icon={faCoins} 
            color="#F59E0B"
          />
        </motion.div>
      </div>

      {/* Credits Trend with Dropdown Filter - Full Width */}
      <motion.div variants={itemVariants} className="card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Credits Earned Over Time
          </h3>
          
          {/* Time Period Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-sm border-2 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                borderColor: 'var(--primary)',
              }}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="1month">Last Month</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>
        
        {/* Chart or Empty State */}
        {creditsData.labels.length > 0 ? (
          <div style={{ height: '300px' }} className="w-full">
            <LineChart 
              data={creditsData.data}
              labels={creditsData.labels}
              title=""
              color="#10B981"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height: '300px' }}>
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                No data available for this period
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Try selecting a different time range
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Charts Row - Submission Status & Monthly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Status */}
        <motion.div variants={itemVariants}>
          {statusData.labels.length > 0 ? (
            <DonutChart
              data={statusData.data}
              labels={statusData.labels}
              colors={statusData.colors}
              title="Submission Status"
              centerText={{
                value: analyticsData.stats.totalSubmissions,
                label: 'Total'
              }}
            />
          ) : (
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Submission Status
              </h3>
              <div className="flex items-center justify-center" style={{ height: '300px' }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                    No submissions yet
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Upload photos to see status breakdown
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Monthly Activity */}
        <motion.div variants={itemVariants}>
          {activityData.labels.length > 0 ? (
            <BarChart
              data={activityData.data}
              labels={activityData.labels}
              title="Monthly Activity"
              color="#3B82F6"
            />
          ) : (
            <div className="card p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Monthly Activity
              </h3>
              <div className="flex items-center justify-center" style={{ height: '300px' }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                    No activity data
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Start submitting to track monthly trends
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Environmental Impact */}
      <motion.div variants={itemVariants}>
        <ImpactMetrics
          co2Saved={analyticsData.environmentalImpact.co2Saved}
          treesEquivalent={analyticsData.environmentalImpact.treesEquivalent}
          wasteCollected={analyticsData.environmentalImpact.wasteCollected}
        />
      </motion.div>

      {/* Global Leaderboard */}
      <motion.div variants={itemVariants}>
        <LeaderboardWidget />
      </motion.div>

      {/* Empty State */}
      {analyticsData.stats.totalSubmissions === 0 && (
        <motion.div 
          variants={itemVariants}
          className="card p-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              No Data Yet
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              Start uploading your environmental cleanup photos to see your analytics and impact metrics here!
            </p>
            <button 
              className="px-6 py-3 rounded-xl font-bold text-white"
              style={{ background: 'var(--gradient-primary)' }}
              onClick={() => window.location.href = '/upload'}
            >
              Upload Your First Photo
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Analytics;
