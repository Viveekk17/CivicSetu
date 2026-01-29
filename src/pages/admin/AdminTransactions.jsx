import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState({ all: [], earned: [], redeemed: [] });
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get('/admin/transactions');
                if (res.data.success) {
                    setTransactions(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    if (loading) {
        return <div className="text-center py-10">Loading transactions...</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>

            <div className="grid grid-cols-2 gap-4">
                {/* Credits Earned Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow overflow-hidden"
                >
                    <div className="bg-emerald-50 p-4 border-b border-emerald-100">
                        <h3 className="text-lg font-bold text-emerald-800">
                            Credits Earned ({transactions.earned.length})
                        </h3>
                        <p className="text-sm text-emerald-600">Rewards from submissions and activities</p>
                    </div>

                    {transactions.earned.length > 0 ? (
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b sticky top-0">
                                    <tr>
                                        <th className="p-3 text-xs">TX ID</th>
                                        <th className="p-3 text-xs">Date</th>
                                        <th className="p-3 text-xs">User</th>
                                        <th className="p-3 text-xs">Description</th>
                                        <th className="p-3 text-xs">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.earned.map(tx => (
                                        <tr key={tx._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    {tx._id.substring(0, 8)}...
                                                </code>
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-bold text-sm text-gray-800">{tx.user?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{tx.user?.email}</div>
                                            </td>
                                            <td className="p-3 text-xs">{tx.description}</td>
                                            <td className="p-3">
                                                <span className="font-bold text-emerald-600">
                                                    +{tx.amount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">No earned credits yet.</div>
                    )}
                </motion.div>

                {/* Credits Redeemed Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow overflow-hidden"
                >
                    <div className="bg-orange-50 p-4 border-b border-orange-100">
                        <h3 className="text-lg font-bold text-orange-800">
                            Credits Redeemed ({transactions.redeemed.length})
                        </h3>
                        <p className="text-sm text-orange-600">Spent on rewards and items</p>
                    </div>

                    {transactions.redeemed.length > 0 ? (
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b sticky top-0">
                                    <tr>
                                        <th className="p-3 text-xs">TX ID</th>
                                        <th className="p-3 text-xs">Date</th>
                                        <th className="p-3 text-xs">User</th>
                                        <th className="p-3 text-xs">Item Redeemed</th>
                                        <th className="p-3 text-xs">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.redeemed.map(tx => (
                                        <tr key={tx._id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    {tx._id.substring(0, 8)}...
                                                </code>
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-bold text-sm text-gray-800">{tx.user?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{tx.user?.email}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs">
                                                        🎁
                                                    </div>
                                                    <span className="font-medium text-xs">{tx.metadata?.treeId?.name || tx.description}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-bold text-orange-600">
                                                    -{tx.amount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">No redemptions yet.</div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminTransactions;
