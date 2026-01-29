import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [points, setPoints] = useState(50);
    const [notes, setNotes] = useState('');

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/submissions?status=${filterStatus}`);
            if (res.data.success) {
                setSubmissions(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [filterStatus]);

    const handleVerify = async (status) => {
        try {
            await api.put(`/admin/submissions/${selectedSubmission._id}`, {
                status,
                points: status === 'verified' ? points : 0,
                notes
            });
            setSelectedSubmission(null);
            fetchSubmissions(); // Refresh list
        } catch (error) {
            console.error("Error updating submission:", error);
            alert("Failed to update submission");
        }
    };

    const handleDeleteSubmission = async () => {
        if (!window.confirm('Are you sure you want to delete this submission? Credits will be reversed if applicable.')) {
            return;
        }
        try {
            await api.delete(`/admin/submissions/${selectedSubmission._id}`);
            alert('Submission deleted successfully');
            setSelectedSubmission(null);
            fetchSubmissions();
        } catch (error) {
            console.error("Error deleting submission:", error);
            alert("Failed to delete submission");
        }
    };

    const handleUpdateCredits = async () => {
        try {
            await api.patch(`/admin/submissions/${selectedSubmission._id}/credits`, {
                creditsAwarded: parseInt(points)
            });
            alert('Credits updated successfully');
            setSelectedSubmission(null);
            fetchSubmissions();
        } catch (error) {
            console.error("Error updating credits:", error);
            alert("Failed to update credits");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Submissions Verification</h2>
                <div className="flex gap-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="p-2 border rounded-lg"
                    >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="All">All</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(sub => (
                                <tr key={sub._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold">{sub.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{sub.user?.email}</div>
                                    </td>
                                    <td className="p-4 capitalize">{sub.type}</td>
                                    <td className="p-4">{new Date(sub.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            sub.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setSelectedSubmission(sub)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No submissions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between mb-4 border-b pb-4">
                                <div>
                                    <h3 className="text-xl font-bold">Submission Details</h3>
                                    <p className="text-sm text-gray-500">ID: {selectedSubmission._id}</p>
                                </div>
                                <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                            </div>

                            {/* User Information */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-bold text-gray-700 mb-2">Submitted By</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">
                                        {selectedSubmission.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{selectedSubmission.user?.name || 'Unknown User'}</p>
                                        <p className="text-sm text-gray-600">{selectedSubmission.user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Submission Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Type</p>
                                    <p className="font-bold capitalize">{selectedSubmission.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded text-sm font-bold ${selectedSubmission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        selectedSubmission.status === 'verified' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedSubmission.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Weight/Quantity</p>
                                    <p className="font-bold">{selectedSubmission.weight || 1} kg/units</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Credits Awarded</p>
                                    <p className="font-bold text-emerald-600 text-lg">{selectedSubmission.creditsAwarded || 0}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Submitted Date</p>
                                    <p className="font-bold">{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="font-medium">{selectedSubmission.location?.name || 'N/A'}</p>
                                    {selectedSubmission.location?.coordinates && (
                                        <p className="text-xs text-gray-500">
                                            Coordinates: {selectedSubmission.location.coordinates.lat}, {selectedSubmission.location.coordinates.lng}
                                        </p>
                                    )}
                                </div>
                                {selectedSubmission.description && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Description</p>
                                        <p className="text-sm">{selectedSubmission.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Verification Details (if verified/rejected) */}
                            {selectedSubmission.verificationDetails && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-bold text-gray-700 mb-3">Verification Details</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500">Verified By</p>
                                            <p className="font-medium">{selectedSubmission.verificationDetails.verifiedBy || 'Admin'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Verified At</p>
                                            <p className="font-medium">
                                                {selectedSubmission.verificationDetails.verifiedAt
                                                    ? new Date(selectedSubmission.verificationDetails.verifiedAt).toLocaleString()
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        {selectedSubmission.verificationDetails.notes && (
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Admin Notes</p>
                                                <p className="font-medium">{selectedSubmission.verificationDetails.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Photos */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-700 mb-3">Uploaded Photos ({selectedSubmission.photos?.length || 0})</h4>
                                <div className="flex gap-2 overflow-x-auto">
                                    {selectedSubmission.photos && selectedSubmission.photos.length > 0 ? (
                                        selectedSubmission.photos.map((photo, i) => {
                                            // Detect if it's a Cloudinary URL or local path
                                            const photoUrl = photo.startsWith('http') ? photo : `http://localhost:5000${photo}`;

                                            return (
                                                <div key={i} className="flex flex-col gap-1">
                                                    <img
                                                        src={photoUrl}
                                                        alt={`Proof ${i + 1}`}
                                                        className="h-40 w-auto rounded-lg border-2 border-gray-200 hover:border-blue-400 transition cursor-pointer"
                                                        onClick={() => window.open(photoUrl, '_blank')}
                                                        onError={(e) => {
                                                            console.error(`Failed to load image: ${photoUrl}`);
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Load+Failed';
                                                        }}
                                                    />
                                                    <p className="text-xs text-gray-400 max-w-[150px] truncate">{photo}</p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 text-sm">No photos uploaded</p>
                                    )}
                                </div>
                            </div>

                            {selectedSubmission.status === 'pending' && (
                                <div className="border-t pt-4">
                                    <h4 className="font-bold mb-2">Verification Actions</h4>
                                    <div className="mb-4">
                                        <label className="block text-sm mb-1">Credits to Award</label>
                                        <input
                                            type="number"
                                            value={points}
                                            onChange={(e) => setPoints(e.target.value)}
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm mb-1">Admin Notes</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="border p-2 rounded w-full"
                                            placeholder="Reason for approval/rejection..."
                                        ></textarea>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => handleVerify('rejected')}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleVerify('verified')}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            Verify & Award Credits
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Admin Management Actions */}
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-bold mb-3 text-red-700">⚠️ Admin Management</h4>
                                <div className="space-y-3">
                                    {/* Update Credits */}
                                    <div className="flex gap-2 items-center p-3 bg-blue-50 rounded">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-1">Edit Credits</label>
                                            <input
                                                type="number"
                                                value={points}
                                                onChange={(e) => setPoints(e.target.value)}
                                                className="border p-2 rounded w-full"
                                                placeholder="Enter new credit amount"
                                            />
                                        </div>
                                        <button
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-6"
                                            onClick={handleUpdateCredits}
                                        >
                                            Update Credits
                                        </button>
                                    </div>

                                    {/* Delete Submission */}
                                    <div className="p-3 bg-red-50 rounded">
                                        <p className="text-sm text-red-800 mb-2">
                                            <strong>Delete Submission:</strong> Permanently deletes this submission and reverses awarded credits.
                                        </p>
                                        <button
                                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full font-bold"
                                            onClick={handleDeleteSubmission}
                                        >
                                            🗑️ Delete Submission
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSubmissions;
