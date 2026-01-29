import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCommunities = () => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchCommunities = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/communities');
            if (res.data.success) {
                setCommunities(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching communities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    const handleViewDetails = async (id) => {
        setDetailsLoading(true);
        try {
            const res = await api.get(`/admin/communities/${id}`);
            if (res.data.success) {
                setSelectedCommunity(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this community?')) return;
        try {
            await api.delete(`/communities/${id}`);
            fetchCommunities();
        } catch (error) {
            console.error('Delete failed', error);
            alert('Failed to delete community');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Community Management</h2>

            {loading ? (
                <div>Loading communities...</div>
            ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Community Name</th>
                                <th className="p-4">Creator</th>
                                <th className="p-4 text-center">Members</th>
                                <th className="p-4 text-center">Pollution Saved</th>
                                <th className="p-4 text-center">Trees Planted</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {communities.map(comm => (
                                <tr key={comm._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-700">{comm.name}</td>
                                    <td className="p-4 text-sm text-gray-600">{comm.creator?.name || 'Unknown'}</td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                                            {comm.members?.length || 0}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-green-700 font-bold">
                                        {comm.stats?.totalTreesPlanted || 0}
                                    </td>
                                    <td className="p-4 text-right flex gap-2 justify-end">
                                        <button
                                            onClick={() => handleViewDetails(comm._id)}
                                            className="text-blue-500 hover:text-blue-700 px-3 py-1 text-sm border border-blue-500 rounded hover:bg-blue-50"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comm._id)}
                                            className="text-red-500 hover:text-red-700 px-3 py-1 text-sm border border-red-500 rounded hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {communities.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No communities founded yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Community Details Modal */}
            <AnimatePresence>
                {selectedCommunity && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{selectedCommunity.name}</h3>
                                    <p className="text-sm text-gray-500">Founded by {selectedCommunity.creator?.name}</p>
                                </div>
                                <button onClick={() => setSelectedCommunity(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                            </div>

                            <div className="p-6">
                                <h4 className="font-bold text-gray-700 mb-4">
                                    Enrolled Members ({selectedCommunity.members?.length || 0})
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedCommunity.members && selectedCommunity.members.length > 0 ? (
                                        selectedCommunity.members.map(member => (
                                            <div key={member._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                                    {member.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{member.name}</p>
                                                    <p className="text-xs text-gray-500">{member.email}</p>
                                                    <div className="text-xs text-emerald-600 mt-1">
                                                        {member.impact?.treesPlanted || 0} Trees • {member.impact?.pollutionSaved?.toFixed(1) || 0}kg Saved
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No members enrolled yet.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCommunities;
