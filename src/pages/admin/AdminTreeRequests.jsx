import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling, faFilter, faSearch, faSync } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';

const AdminTreeRequests = () => {
    const [redemptions, setRedemptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(null);

    useEffect(() => {
        fetchRedemptions();
        fetchStats();
    }, [filterStatus]);

    const fetchRedemptions = async () => {
        try {
            setLoading(true);
            const url = `/admin/tree-redemptions${filterStatus ? `?status=${filterStatus}` : ''}`;

            const response = await api.get(url);

            if (response.success) {
                setRedemptions(response.data);
            }
        } catch (error) {
            console.error('Error fetching redemptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/tree-redemptions/stats');

            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const updateStatus = async (redemptionId, newStatus, notes = '') => {
        try {
            setUpdatingStatus(redemptionId);

            const response = await api.patch(
                `/admin/tree-redemptions/${redemptionId}/status`,
                { status: newStatus, notes }
            );

            if (response.success) {
                // Refresh data
                await fetchRedemptions();
                await fetchStats();

                alert(` Status updated to: ${getStatusLabel(newStatus)}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert(' Failed to update status');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pending',
            sent_to_ngo: 'Sent to NGO',
            planting_in_process: 'Planting in Process',
            completed: 'Completed'
        };
        return labels[status] || status;
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: '#FEF3C7', text: '#92400E', icon: '⏳' },
            sent_to_ngo: { bg: '#f9f5ff', text: '#1E40AF', icon: '' },
            planting_in_process: { bg: '#ebe3ff', text: '#14248a', icon: '' },
            completed: { bg: '#ebe3ff', text: '#14248a', icon: '' }
        };

        const c = config[status] || config.pending;
        return (
            <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: c.bg, color: c.text }}
            >
                <span>{c.icon}</span>
                <span>{getStatusLabel(status)}</span>
            </span>
        );
    };

    const filteredRedemptions = redemptions.filter(r =>
        r.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                     Tree Redemption Requests
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Manage citizen tree planting requests
                </p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending</p>
                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.pendingCount}</p>
                    </div>
                    <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Requests</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.totalRedemptions}</p>
                    </div>
                    <div className="card p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Completed</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.completedCount}</p>
                    </div>
                    <div className="card p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Trees Planted</p>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{stats.totalTreesPlanted}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by user or item name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border"
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 rounded-lg border"
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="sent_to_ngo">Sent to NGO</option>
                        <option value="planting_in_process">Planting in Process</option>
                        <option value="completed">Completed</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={() => { fetchRedemptions(); fetchStats(); }}
                        className="px-4 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                        <FontAwesomeIcon icon={faSync} className="mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p style={{ color: 'var(--text-secondary)' }}>Loading redemptions...</p>
                    </div>
                ) : filteredRedemptions.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="text-6xl"></span>
                        <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            No redemptions found
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Trees</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Credits</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                                {filteredRedemptions.map((redemption) => (
                                    <tr key={redemption._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    {redemption.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{redemption.user?.name}</p>
                                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{redemption.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{redemption.itemName}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-2xl"></span>
                                            <span className="ml-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{redemption.treesRequested}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                            {redemption.creditsSpent}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(redemption.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(redemption.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={redemption.status}
                                                onChange={(e) => {
                                                    const notes = prompt('Optional notes for this status update:');
                                                    if (notes !== null) {
                                                        updateStatus(redemption._id, e.target.value, notes);
                                                    }
                                                }}
                                                disabled={updatingStatus === redemption._id}
                                                className="px-3 py-1 rounded-lg border text-sm font-medium"
                                                style={{
                                                    backgroundColor: 'var(--bg-surface)',
                                                    borderColor: 'var(--border-light)',
                                                    color: 'var(--text-primary)'
                                                }}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="sent_to_ngo">Sent to NGO</option>
                                                <option value="planting_in_process">Planting in Process</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTreeRequests;
