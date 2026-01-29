import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading Dashboard...</div>
            </div>
        );
    }

    // Civic Portal Color Palette: Green, Light Green, White, Grey
    // Using green shades for emphasis

    const kpiData = [
        { title: 'Total Users', value: stats.kpi.users },
        { title: 'Pending Submissions', value: stats.kpi.pendingSubmissions },
        { title: 'Open Reports', value: stats.kpi.openReports },
        { title: 'Trees Planted', value: stats.kpi.totalTreesPlanted || 0 },
        { title: 'Pollution Saved', value: `${stats.kpi.totalPollutionSaved?.toFixed(1) || 0} kg` },
    ];

    return (
        <div className="p-6 bg-[#f8f9fa] min-h-screen space-y-6">
            {/* Header with Green Gradient */}
            <div className="bg-gradient-to-r from-[#2F5233] to-[#4daa57] text-white rounded-xl shadow-md -m-6 mb-6 p-8">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-green-50 mt-2 font-medium">Welcome back! Here's what's happening today.</p>
            </div>

            {/* KPI Cards - White with Green Accents */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiData.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white border-l-4 border-[#4daa57] rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Activity Tables with Gray/Green Theme */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100"
                >
                    <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                            Quick Stats
                        </h3>
                    </div>
                    <div className="p-6">
                        <table className="w-full">
                            <tbody>
                                <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 text-sm text-gray-600 font-medium">Total Submissions</td>
                                    <td className="py-3 text-sm font-bold text-[#2F5233] text-right text-lg">{stats.recent?.totalSubmissions || 0}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 text-sm text-gray-600 font-medium">Active Communities</td>
                                    <td className="py-3 text-sm font-bold text-[#2F5233] text-right text-lg">{stats.recent?.activeCommunities || 0}</td>
                                </tr>
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 text-sm text-gray-600 font-medium">Total Credits Distributed</td>
                                    <td className="py-3 text-sm font-bold text-[#2F5233] text-right text-lg">{stats.recent?.totalCredits?.toLocaleString() || 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* 7-Day Activity */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100"
                >
                    <div className="bg-[#4daa57] px-6 py-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                            Last 7 Days
                        </h3>
                    </div>
                    <div className="p-6">
                        <table className="w-full">
                            <tbody>
                                <tr className="border-b border-gray-50 hover:bg-green-50 transition-colors">
                                    <td className="py-3 text-sm text-gray-600 font-medium">New Users Registered</td>
                                    <td className="py-3 text-sm font-bold text-[#4daa57] text-right text-lg">{stats.sevenDay?.newUsers || 0}</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-green-50 transition-colors">
                                    <td className="py-3 text-sm text-gray-600 font-medium">Activities Uploaded</td>
                                    <td className="py-3 text-sm font-bold text-[#4daa57] text-right text-lg">{stats.sevenDay?.activities || 0}</td>
                                </tr>
                                <tr className="hover:bg-green-50 transition-colors">
                                    <td className="py-3 text-sm text-gray-600 font-medium">Average Daily Activity</td>
                                    <td className="py-3 text-sm font-bold text-[#4daa57] text-right text-lg">{Math.round((stats.sevenDay?.activities || 0) / 7)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
