import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEye, faFilter, faDownload } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const AdminRequests = () => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('civic'); // 'civic' or 'platform'
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);


    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Status values match DB enum: 'open', 'in-progress', 'resolved', 'closed'
            const res = await api.get(`/admin/reports?status=${filterStatus}`);

            if (res.success) {
                const allReports = res.data.map(r => ({
                    id: r._id,
                    user: r.user?.name || 'Anonymous',
                    userEmail: r.user?.email || '',
                    category: r.category,       // 'civic' or 'platform'
                    issueType: r.type,           // e.g. 'dumping', 'bug', etc.
                    status: r.status,            // 'open', 'in-progress', 'resolved', 'closed'
                    date: new Date(r.createdAt).toLocaleDateString(),
                    image: r.image ? (r.image.startsWith('http') ? r.image : `http://localhost:5000${r.image}`) : null,
                    message: r.message           // actual report description from citizen
                }));

                // Client-side filter by category
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

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // newStatus must match DB enum: 'open', 'in-progress', 'resolved', 'closed'
            await api.put(`/admin/reports/${id}`, { status: newStatus });
            fetchRequests();
            setSelectedRequest(null);
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'open': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'closed': 'bg-gray-50 text-gray-600 border-gray-200',
        };
        return styles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
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
                    {/* Status filter values match DB enum */}
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors">
                        <FontAwesomeIcon icon={faDownload} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading requests...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="py-4 pl-6">ID</th>
                                    <th className="py-4">Complainant</th>
                                    <th className="py-4">Issue Type</th>
                                    <th className="py-4">Category</th>
                                    <th className="py-4">Date</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedRequest(req)}>
                                        <td className="py-4 pl-6 font-mono text-xs text-gray-400">{req.id.slice(-8)}</td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-800">{req.user}</p>
                                            <p className="text-xs text-gray-400">{req.userEmail}</p>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium capitalize">
                                                {req.issueType?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 text-gray-600 text-sm capitalize">{req.category}</td>
                                        <td className="py-4 text-gray-500 text-sm">{req.date}</td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(req.status)}`}>
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
                )}
                {!loading && requests.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No {filterCategory} requests found.
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
                                    <p className="text-sm text-gray-500">ID: {selectedRequest.id}</p>
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
                                            <p><span className="text-gray-500">Category:</span> <span className="font-medium capitalize">{selectedRequest.category}</span></p>
                                            <p><span className="text-gray-500">Issue Type:</span> <span className="font-medium capitalize">{selectedRequest.issueType?.replace(/_/g, ' ')}</span></p>
                                            <p><span className="text-gray-500">Reported On:</span> <span className="font-medium">{selectedRequest.date}</span></p>
                                            <p><span className="text-gray-500">Status:</span>{' '}
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadge(selectedRequest.status)}`}>
                                                    {selectedRequest.status}
                                                </span>
                                            </p>
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
                                                <p className="text-xs text-gray-500">{selectedRequest.userEmail}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actual report message from citizen */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Report Description</h4>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {selectedRequest.message || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                {selectedRequest.image && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Evidence</h4>
                                        <img
                                            src={selectedRequest.image}
                                            alt="Evidence"
                                            className="w-full h-48 object-cover rounded-xl border border-gray-200"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Admin Notes</h4>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        rows="3"
                                        placeholder="Add internal notes or remarks..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-wrap justify-end gap-3">
                                {selectedRequest.status !== 'closed' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequest.id, 'closed')}
                                        className="px-4 py-2 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-100"
                                    >
                                        Close
                                    </button>
                                )}
                                {selectedRequest.status === 'open' && (
                                    <button
                                        onClick={() => handleStatusUpdate(selectedRequest.id, 'in-progress')}
                                        className="px-4 py-2 rounded-xl font-bold border border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        Mark In Progress
                                    </button>
                                )}
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
