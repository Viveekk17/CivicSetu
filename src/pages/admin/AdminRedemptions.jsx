import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCoins } from '@fortawesome/free-solid-svg-icons';

const AdminRedemptions = () => {
    const [redemptions, setRedemptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        const fetchRedemptions = async () => {
            try {
                const res = await api.get('/admin/redemptions');
                if (res.data.success) {
                    setRedemptions(res.data.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchRedemptions();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Redemption History</h2>

            {loading ? (
                <div>Loading logs...</div>
            ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Item Redeemed</th>
                                <th className="p-4">Cost</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {redemptions.map(tx => (
                                <tr key={tx._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(tx.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{tx.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{tx.user?.email}</div>
                                    </td>
                                    <td className="p-4 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center text-purple-600">
                                            <FontAwesomeIcon icon={faGift} />
                                        </div>
                                        <span className="font-medium">{tx.metadata?.treeId?.name || tx.description}</span>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-orange-500">
                                        -{tx.amount} <FontAwesomeIcon icon={faCoins} className="text-xs" />
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                                            Successful
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {redemptions.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No redemptions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminRedemptions;
