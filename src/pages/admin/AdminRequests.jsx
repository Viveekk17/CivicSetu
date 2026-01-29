import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEye, faFilter, faDownload } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const AdminRequests = () => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('civic'); // 'civic' or 'platform'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Include category in query, fallback 'All' if needed or strict type
            const res = await axios.get(`http://localhost:5000/api/admin/reports?status=${filterStatus}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.data.success) {
                // Client-side filtering for category since backend returns all reports currently
                // Ideally, backend should support category filter too, but this works for now
                const allReports = res.data.data.map(r => ({
                    id: r._id,
                    user: r.user?.name || 'Anonymous',
                    category: r.category, // 'civic' or 'platform'
                    location: r.type,
                    status: r.status, // 'open', 'resolved', ...
                    date: new Date(r.createdAt).toLocaleDateString(),
                    image: r.image ? `http://localhost:5000${r.image}` : null,
                    details: r.message
                }));

                const filtered = allReports.filter(r => r.category === filterCategory);
                setRequests(filtered);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filterStatus, filterCategory]);

    const filteredRequests = requests;

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/admin/reports/${id}`, { status: newStatus.toLowerCase() });
            fetchRequests(); // Refresh
            setSelectedRequest(null);
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Requests Management</h2>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => setFilterCategory('civic')}
                            className={`px-4 py-1 rounded-full text-xs font-bold transition ${filterCategory === 'civic' ? 'bg-[#1F3C88] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                        >
                            Civic Issues
                        </button>
                        <button
                            onClick={() => setFilterCategory('platform')}
                            className={`px-4 py-1 rounded-full text-xs font-bold transition ${filterCategory === 'platform' ? 'bg-[#1F3C88] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                        >
                            Platform Issues
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Escalated">Escalated</option>
                    </select>
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors">
                        <FontAwesomeIcon icon={faDownload} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                <th className="py-4 pl-6">ID</th>
                                <th className="py-4">Complainant</th>
                                <th className="py-4">Issue</th>
                                <th className="py-4">Location</th>
                                <th className="py-4">Date</th>
                                <th className="py-4">Status</th>
                                <th className="py-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedRequest(req)}>
                                    <td className="py-4 pl-6 font-mono font-bold text-gray-600">{req.id}</td>
                                    <td className="py-4 font-medium text-gray-800">{req.user}</td>
                                    <td className="py-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                                            {req.category}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-600 text-sm">{req.location}</td>
                                    <td className="py-4 text-gray-500 text-sm">{req.date}</td>
                                    <td className="py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border 
                               ${req.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                req.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    req.status === 'Escalated' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right pr-6">
                                        <button className="text-blue-500 hover:text-blue-700 p-2">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredRequests.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No requests found using current filters.
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Request Details</h3>
                                    <p className="text-sm text-gray-500">{selectedRequest.id}</p>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600">
                                    <FontAwesomeIcon icon={faTimes} size="lg" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Issue Information</h4>
                                        <div className="space-y-3">
                                            <p><span className="text-gray-600">Category:</span> <span className="font-medium">{selectedRequest.category}</span></p>
                                            <p><span className="text-gray-600">Location:</span> <span className="font-medium">{selectedRequest.location}</span></p>
                                            <p><span className="text-gray-600">Reported On:</span> <span className="font-medium">{selectedRequest.date}</span></p>
                                            <p><span className="text-gray-600">Status:</span> <span className="font-bold text-emerald-600">{selectedRequest.status}</span></p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Complainant</h4>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                                {selectedRequest.user.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold">{selectedRequest.user}</p>
                                                <p className="text-xs text-gray-500">+91 98765 43210</p>
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 border border-yellow-100">
                                            ⚠️ High Priority Citizen
                                        </div>
                                    </div>
                                </div>

                                {selectedRequest.image && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Evidence</h4>
                                        <img src={selectedRequest.image} alt="Evidence" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Admin Actions</h4>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        rows="3"
                                        placeholder="Add internal notes or remarks..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                                <button
                                    onClick={() => handleStatusUpdate(selectedRequest.id, 'escalated')}
                                    className="px-4 py-2 rounded-xl font-bold border border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    Escalate
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedRequest.id, 'resolved')}
                                    className="px-6 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                >
                                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                    Mark Resolved
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminRequests;
