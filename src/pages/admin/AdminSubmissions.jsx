import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [filterCorporation, setFilterCorporation] = useState('All');
    const [locations, setLocations] = useState([]);

    const CORPORATIONS = [
        { value: 'pmc', label: 'PMC (Pune)', keywords: ['pmc', 'pune municipal', 'pune'] },
        { value: 'pcmc', label: 'PCMC (Pimpri-Chinchwad)', keywords: ['pcmc', 'pimpri', 'chinchwad'] },
        { value: 'mumbai', label: 'Mumbai (BMC)', keywords: ['mumbai', 'bmc', 'bombay'] },
        { value: 'alandi', label: 'Alandi', keywords: ['alandi'] },
    ];

    const matchesCorporation = (sub) => {
        if (filterCorporation === 'All') return true;
        const corp = CORPORATIONS.find(c => c.value === filterCorporation);
        if (!corp) return true;
        const haystack = `${sub.location?.name || ''} ${sub.location?.address || ''} ${sub.location?.city || ''} ${sub.location?.corporation || ''}`.toLowerCase();
        return corp.keywords.some(k => haystack.includes(k));
    };

    const filteredSubmissions = submissions.filter(matchesCorporation);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [points, setPoints] = useState(50);
    const [notes, setNotes] = useState('');

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/submissions?status=${filterStatus}&location=${filterLocation}`);
            if (res?.success) {
                setSubmissions(Array.isArray(res.data) ? res.data : []);
            } else {
                setSubmissions([]);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await api.get('/admin/submissions/locations');
            setLocations(Array.isArray(res?.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching locations:", error);
            setLocations([]);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [filterStatus, filterLocation]);

    useEffect(() => {
        fetchLocations();
    }, []);

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
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Corporation:</span>
                        <select
                            value={filterCorporation}
                            onChange={(e) => setFilterCorporation(e.target.value)}
                            className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm min-w-[180px]"
                        >
                            <option value="All">All Corporations</option>
                            {CORPORATIONS.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Area:</span>
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm min-w-[150px]"
                        >
                            <option value="All">All Areas</option>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="p-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm min-w-[150px]"
                        >
                            <option value="All">All Submissions</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Initial Approved</option>
                            <option value="verified">Fully Verified</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
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
                                <th className="p-4">Est. Credits</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.map(sub => (
                                <tr key={sub._id} className={`border-b hover:bg-gray-50 transition-colors ${sub.isPrioritySLA ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                                    <td className="p-4">
                                        <div className="font-bold flex items-center gap-2">
                                            {sub.user?.name || 'Unknown'}
                                            {sub.isPrioritySLA && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full animate-pulse">URGENT</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">{sub.user?.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="capitalize">{sub.type}</div>
                                        <div className="text-[10px] text-gray-400">Phase {sub.approvalPhase || 0}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className={`${sub.isPrioritySLA ? 'text-red-600 font-bold' : ''}`}>
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </div>
                                        {sub.isPrioritySLA && <div className="text-[10px] text-red-500 font-semibold italic">SLA Breached (&gt;24h)</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            sub.status === 'verified' ? 'bg-green-100 text-green-800' : 
                                            sub.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                            'bg-red-100 text-red-800'
                                            }`}>
                                            {sub.status === 'approved' ? 'Initial Approved' : (sub.status === 'verified' ? 'Fully Verified' : sub.status)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                         <div className="font-bold text-emerald-600">
                                            {sub.status === 'verified' || sub.status === 'approved' 
                                                ? (sub.creditsAwarded || sub.totalCreditsAwarded || sub.verificationDetails?.tokensEarned || sub.verificationDetails?.suggestedCredits || 0)
                                                : (sub.verificationDetails?.tokensEarned || sub.verificationDetails?.suggestedCredits || 0)
                                            }
                                            <span className="text-[10px] text-gray-400 ml-1 font-normal uppercase">pts</span>
                                         </div>
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
                            {filteredSubmissions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">No submissions found.</td>
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
                                    <p className="text-sm text-gray-500">Approval Phase</p>
                                    <p className="font-bold text-blue-600">
                                        {selectedSubmission.approvalPhase === 0 ? 'Phase 0: Initial Review' : 
                                         selectedSubmission.approvalPhase === 1 ? 'Phase 1: Waiting for Cleanup' :
                                         'Phase 2: Completed'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Tokens Pool</p>
                                    <p className="font-bold text-emerald-600">{selectedSubmission.totalCreditsAwarded || 'Calculated on Approval'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Weight/Quantity</p>
                                    <p className="font-bold">{selectedSubmission.weightKg || selectedSubmission.weight || 1} kg</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="font-medium">{selectedSubmission.location?.name || 'N/A'}</p>
                                </div>
                            </div>

                            {/* AI Analysis Details */}
                            {selectedSubmission.verificationDetails && (
                                <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                         AI Analysis Results
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p><span className="text-gray-500">Category:</span> {selectedSubmission.verificationDetails.category}</p>
                                        <p><span className="text-gray-500">CO2 Saved:</span> {selectedSubmission.verificationDetails.co2Saved}kg</p>
                                        <p className="col-span-2"><span className="text-gray-500">AI Tokens:</span> {selectedSubmission.verificationDetails.tokensEarned || selectedSubmission.verificationDetails.suggestedCredits}</p>
                                    </div>
                                </div>
                            )}

                            {/* Phase 2: RE-VERIFICATION PHOTO */}
                            {selectedSubmission.approvalPhase === 1 && (
                                <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                                    <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                                         Phase 2: Clean Site Proof
                                    </h4>
                                    {selectedSubmission.reverificationPhoto ? (
                                        <div className="space-y-3">
                                            <img
                                                src={selectedSubmission.reverificationPhoto.startsWith('http') ? selectedSubmission.reverificationPhoto : `http://localhost:5000${selectedSubmission.reverificationPhoto}`}
                                                alt="Clean Site Proof"
                                                className="w-full h-48 object-cover rounded-lg border-2 border-orange-300"
                                                onClick={() => window.open(selectedSubmission.reverificationPhoto.startsWith('http') ? selectedSubmission.reverificationPhoto : `http://localhost:5000${selectedSubmission.reverificationPhoto}`, '_blank')}
                                            />
                                            <p className="text-xs text-orange-700 italic text-center">Click image to enlarge</p>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-orange-600 bg-white/50 rounded-lg border border-dashed border-orange-300">
                                            <p className="font-bold italic">User hasn't uploaded clean site photo yet</p>
                                            <p className="text-xs mt-1">48h Window Still Active</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Initial Photos */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-700 mb-3">Initial Proof Photos ({selectedSubmission.photos?.length || 0})</h4>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {selectedSubmission.photos && selectedSubmission.photos.map((photo, i) => {
                                        const photoUrl = photo.startsWith('http') ? photo : `http://localhost:5000${photo}`;
                                        return (
                                            <img
                                                key={i}
                                                src={photoUrl}
                                                alt={`Proof ${i + 1}`}
                                                className="h-32 w-auto rounded-lg border border-gray-200"
                                                onClick={() => window.open(photoUrl, '_blank')}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {(selectedSubmission.status === 'pending' || (selectedSubmission.status === 'approved' && selectedSubmission.approvalPhase === 1 && selectedSubmission.reverificationPhoto)) && (
                                <div className="border-t pt-4">
                                    <h4 className="font-bold mb-2">
                                        {selectedSubmission.approvalPhase === 0 ? 'Phase 1: Initial Approval' : 'Phase 2: Final Verification'}
                                    </h4>
                                    
                                    <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                                        {selectedSubmission.approvalPhase === 0 ? (
                                            <p>Approving this will award <strong>50%</strong> of the credits instantly and open a 48h window for the user to upload final cleanup proof.</p>
                                        ) : (
                                            <p>Final verification will award the <strong>remaining 50%</strong> credits and mark the ticket as fully resolved.</p>
                                        )}
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
                                        {selectedSubmission.approvalPhase === 0 && (
                                            <button
                                                onClick={() => handleVerify('rejected')}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            >
                                                Reject Submission
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleVerify('approved')}
                                            className={`px-4 py-2 text-white rounded transition-colors ${selectedSubmission.approvalPhase === 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            {selectedSubmission.approvalPhase === 0 ? 'Approve Phase 1 (50% Credits)' : 'Approve Phase 2 (Remaining 50%)'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Admin Management Actions */}
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-bold mb-3 text-red-700">Admin Management</h4>
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
                                            Delete Submission
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
