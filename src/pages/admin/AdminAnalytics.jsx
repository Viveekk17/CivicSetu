import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const AdminAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/dashboard-analytics')
                ]);
                
                if (statsRes.success) {
                    setStats(statsRes.data);
                }
                if (analyticsRes.success) {
                    setAnalytics(analyticsRes.data);
                }
            } catch (error) {
                console.error('Error fetching analytics data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !stats || !analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading Analytics...</div>
            </div>
        );
    }

    const kpiData = [
        { title: 'Total Users', value: stats.kpi.users },
        { title: 'Active Users (30d)', value: analytics.engagement.activeUsers },
        { title: 'Pending Submissions', value: stats.kpi.pendingSubmissions },
        { title: 'Open Reports', value: stats.kpi.openReports },
        { title: 'Total Credits', value: Math.round(analytics.credits.totalCredits) },
    ];

    // Process timeline data
    const submissionsChartData = analytics.timeline.submissions.map(item => ({
        date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uploads: item.count,
        credits: item.credits
    }));

    const userGrowthData = analytics.timeline.userGrowth.map(item => ({
        date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: item.count
    }));

    const categoryData = analytics.breakdown.categories.map(item => ({
        name: item._id || 'Unknown',
        value: item.count
    }));

    const statusData = analytics.breakdown.status.map(item => ({
        name: item._id,
        value: item.count
    }));

    // Professional color palette
    const COLORS = ['#0ea5e9', '#14b8a6', '#998fc7', '#f59e0b', '#ef4444', '#06b6d4'];

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 -m-6 mb-6 p-6">
                <h1 className="text-2xl font-semibold text-gray-800">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Comprehensive platform metrics and insights</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiData.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Submissions Timeline */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                >
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Daily Submissions (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={submissionsChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ebe3ff" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#5a5760' }}
                                stroke="#8a8590"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#5a5760' }}
                                stroke="#8a8590"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #ebe3ff',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Area
                                type="monotone"
                                dataKey="uploads"
                                stroke="#0ea5e9"
                                fill="#0ea5e9"
                                fillOpacity={0.1}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* User Growth */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                >
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">User Registration Growth</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ebe3ff" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#5a5760' }}
                                stroke="#8a8590"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#5a5760' }}
                                stroke="#8a8590"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #ebe3ff',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line
                                type="monotone"
                                dataKey="users"
                                stroke="#14b8a6"
                                strokeWidth={2}
                                dot={{ fill: '#14b8a6', r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                >
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Submission Categories</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #ebe3ff',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Status Distribution */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white border border-gray-200 rounded-lg p-6"
                >
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Submission Status</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ebe3ff" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#5a5760' }}
                                stroke="#8a8590"
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#5a5760' }}
                                stroke="#8a8590"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #ebe3ff',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="value" fill="#998fc7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Top Contributors */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white border border-gray-200 rounded-lg p-6"
            >
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Top Contributors</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Rank</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Submissions</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Credits Earned</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.topContributors.map((contributor, index) => (
                                <tr key={contributor._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-600">#{index + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{contributor.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{contributor.email}</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{contributor.submissionCount}</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{contributor.totalCredits}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminAnalytics;
