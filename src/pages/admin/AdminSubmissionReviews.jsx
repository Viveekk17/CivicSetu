import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck, faTimes, faEye, faEdit, faCoins, faLeaf,
    faWeightHanging, faMapMarkerAlt, faUser, faCalendar,
    faImage, faFilter, faRefresh, faCheckCircle, faTimesCircle,
    faSpinner, faClock, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const AdminSubmissionReviews = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [editCredits, setEditCredits] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [lightboxImg, setLightboxImg] = useState(null);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/submissions?status=${filterStatus}`);
            if (res.success) {
                setSubmissions(res.data);
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [filterStatus]);

    const openDetail = (sub) => {
        setSelectedSubmission(sub);
        // Default to AI-suggested credits for pending; fall back to awarded credits for verified
        const suggestedCredits = sub.verificationDetails?.suggestedCredits ?? sub.creditsAwarded ?? 0;
        setEditCredits(suggestedCredits);
        setAdminNotes(sub.verificationDetails?.notes ?? '');
        setSuccessMsg('');
        setErrorMsg('');
    };

    const closeDetail = () => {
        setSelectedSubmission(null);
        setEditCredits('');
        setAdminNotes('');
        setSuccessMsg('');
        setErrorMsg('');
    };

    const handleAction = async (action) => {
        // action: 'verified' | 'rejected'
        if (!selectedSubmission) return;
        setActionLoading(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await api.put(`/admin/submissions/${selectedSubmission._id}`, {
                status: action,
                points: action === 'verified' ? parseInt(editCredits) || 0 : 0,
                notes: adminNotes
            });
            setSuccessMsg(action === 'verified'
                ? `✅ Submission approved! ${editCredits} credits will be credited to ${selectedSubmission.user?.name}.`
                : '❌ Submission rejected and user notified.');
            fetchSubmissions();
            setTimeout(closeDetail, 2000);
        } catch (err) {
            setErrorMsg('Failed to update submission. Please try again.');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateCreditsOnly = async () => {
        if (!selectedSubmission) return;
        setActionLoading(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await api.patch(`/admin/submissions/${selectedSubmission._id}/credits`, {
                creditsAwarded: parseInt(editCredits) || 0
            });
            setSuccessMsg(`✅ Credits updated to ${editCredits} for ${selectedSubmission.user?.name}.`);
            fetchSubmissions();
        } catch (err) {
            setErrorMsg('Failed to update credits. Please try again.');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        return photo.startsWith('http') ? photo : `http://localhost:5000${photo}`;
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-red-50 text-red-700 border-red-200'
        };
        return map[status] || 'bg-gray-50 text-gray-600 border-gray-200';
    };

    const getStatusIcon = (status) => {
        if (status === 'pending') return <FontAwesomeIcon icon={faClock} className="text-amber-500" />;
        if (status === 'verified') return <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500" />;
        if (status === 'rejected') return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
        return null;
    };

    const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s.status === 'pending').length,
        verified: submissions.filter(s => s.status === 'verified').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Submission Reviews</h2>
                    <p className="text-sm text-gray-500 mt-1">Review citizen before & after photo submissions and award credits</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#1F3C88]"
                    >
                        <option value="pending">Pending Review</option>
                        <option value="verified">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="All">All Submissions</option>
                    </select>
                    <button
                        onClick={fetchSubmissions}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1F3C88] text-white rounded-lg text-sm font-bold hover:bg-[#162d66] transition-colors"
                    >
                        <FontAwesomeIcon icon={faRefresh} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Shown', value: stats.total, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                    { label: 'Pending', value: stats.pending, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { label: 'Approved', value: stats.verified, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 border-red-200 text-red-700' },
                ].map((s) => (
                    <div key={s.label} className={`${s.color} border rounded-xl px-4 py-3`}>
                        <p className="text-2xl font-extrabold">{s.value}</p>
                        <p className="text-xs font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Submission List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center">
                        <FontAwesomeIcon icon={faSpinner} className="text-[#1F3C88] text-3xl animate-spin mb-3" />
                        <p className="text-gray-500">Loading submissions...</p>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="p-16 text-center text-gray-400">
                        <FontAwesomeIcon icon={faImage} className="text-5xl mb-3 text-gray-300" />
                        <p className="font-medium">No submissions found for this filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="py-4 pl-6 pr-2">Preview</th>
                                    <th className="py-4 pr-4">Citizen</th>
                                    <th className="py-4 pr-4">Type</th>
                                    <th className="py-4 pr-4">Weight</th>
                                    <th className="py-4 pr-4">Location</th>
                                    <th className="py-4 pr-4">Est. Credits</th>
                                    <th className="py-4 pr-4">Date</th>
                                    <th className="py-4 pr-4">Status</th>
                                    <th className="py-4 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {submissions.map((sub) => {
                                    const beforeImg = getPhotoUrl(sub.photos?.[0]);
                                    const afterImg = getPhotoUrl(sub.photos?.[1]);
                                    return (
                                        <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                                            {/* Thumbnails */}
                                            <td className="py-3 pl-6 pr-2">
                                                <div className="flex gap-1">
                                                    {beforeImg ? (
                                                        <img
                                                            src={beforeImg}
                                                            alt="Before"
                                                            className="w-10 h-10 object-cover rounded-lg border-2 border-red-200 cursor-pointer hover:scale-110 transition-transform"
                                                            onClick={() => setLightboxImg(beforeImg)}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                            title="Before"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px]">B</div>
                                                    )}
                                                    {afterImg ? (
                                                        <img
                                                            src={afterImg}
                                                            alt="After"
                                                            className="w-10 h-10 object-cover rounded-lg border-2 border-green-200 cursor-pointer hover:scale-110 transition-transform"
                                                            onClick={() => setLightboxImg(afterImg)}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                            title="After"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px]">A</div>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Citizen */}
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-gray-800 text-sm">{sub.user?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400 truncate max-w-[120px]">{sub.user?.email}</p>
                                            </td>
                                            {/* Type */}
                                            <td className="py-3 pr-4">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold capitalize">{sub.type}</span>
                                            </td>
                                            {/* Weight */}
                                            <td className="py-3 pr-4 text-sm text-gray-600">{sub.weight || '—'} kg</td>
                                            {/* Location */}
                                            <td className="py-3 pr-4 text-xs text-gray-500 max-w-[120px] truncate">{sub.location?.name || '—'}</td>
                                            {/* Credits */}
                                            <td className="py-3 pr-4">
                                                <span className="font-bold text-emerald-600">{sub.creditsAwarded || 0}</span>
                                                <span className="text-xs text-gray-400 ml-1">pts</span>
                                            </td>
                                            {/* Date */}
                                            <td className="py-3 pr-4 text-xs text-gray-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                                            {/* Status */}
                                            <td className="py-3 pr-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(sub.status)}`}>
                                                    {getStatusIcon(sub.status)}
                                                    {sub.status}
                                                </span>
                                            </td>
                                            {/* Action */}
                                            <td className="py-3 pr-6 text-right">
                                                <button
                                                    onClick={() => openDetail(sub)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3C88] text-white rounded-lg text-xs font-bold hover:bg-[#162d66] transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            <AnimatePresence>
                {lightboxImg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                        onClick={() => setLightboxImg(null)}
                    >
                        <button
                            onClick={() => setLightboxImg(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <motion.img
                            src={lightboxImg}
                            alt="Full size"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail / Review Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeDetail}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center rounded-t-2xl z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Submission Review</h3>
                                    <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {selectedSubmission._id}</p>
                                </div>
                                <button onClick={closeDetail} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Success / Error Messages */}
                                {successMsg && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
                                        {successMsg}
                                    </div>
                                )}
                                {errorMsg && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                                        {errorMsg}
                                    </div>
                                )}

                                {/* Before & After Images */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faImage} />
                                        Before &amp; After Photos
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Before */}
                                        <div className="relative">
                                            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">BEFORE</div>
                                            {selectedSubmission.photos?.[0] ? (
                                                <img
                                                    src={getPhotoUrl(selectedSubmission.photos[0])}
                                                    alt="Before"
                                                    className="w-full h-52 object-cover rounded-xl border-2 border-red-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setLightboxImg(getPhotoUrl(selectedSubmission.photos[0]))}
                                                    onError={(e) => { e.target.alt = 'Image unavailable'; }}
                                                />
                                            ) : (
                                                <div className="w-full h-52 bg-gray-100 rounded-xl border-2 border-dashed border-red-200 flex items-center justify-center text-gray-400">
                                                    <div className="text-center">
                                                        <FontAwesomeIcon icon={faImage} className="text-3xl mb-2" />
                                                        <p className="text-xs">No before image</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* After */}
                                        <div className="relative">
                                            <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">AFTER</div>
                                            {selectedSubmission.photos?.[1] ? (
                                                <img
                                                    src={getPhotoUrl(selectedSubmission.photos[1])}
                                                    alt="After"
                                                    className="w-full h-52 object-cover rounded-xl border-2 border-emerald-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setLightboxImg(getPhotoUrl(selectedSubmission.photos[1]))}
                                                    onError={(e) => { e.target.alt = 'Image unavailable'; }}
                                                />
                                            ) : (
                                                <div className="w-full h-52 bg-gray-100 rounded-xl border-2 border-dashed border-emerald-200 flex items-center justify-center text-gray-400">
                                                    <div className="text-center">
                                                        <FontAwesomeIcon icon={faImage} className="text-3xl mb-2" />
                                                        <p className="text-xs">No after image</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 text-center mt-2">Click on an image to view full size</p>
                                </div>

                                {/* Submission Details Grid */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Submission Details</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><FontAwesomeIcon icon={faUser} /> Citizen</p>
                                            <p className="font-bold text-gray-800 text-sm">{selectedSubmission.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-400 truncate">{selectedSubmission.user?.email}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-400 mb-0.5">Tagging Mode</p>
                                            <p className="font-bold text-gray-800 text-sm capitalize">
                                                {selectedSubmission.verificationDetails?.taggingMode || 'Members'}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><FontAwesomeIcon icon={faWeightHanging} /> Weight</p>
                                            <p className="font-bold text-gray-800">{selectedSubmission.weight || 0} kg</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><FontAwesomeIcon icon={faCalendar} /> Submitted</p>
                                            <p className="font-bold text-gray-800 text-sm">{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-400 mb-0.5">Status</p>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedSubmission.status)}`}>
                                                {getStatusIcon(selectedSubmission.status)} {selectedSubmission.status}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <p className="text-xs text-emerald-500 mb-0.5 flex items-center gap-1"><FontAwesomeIcon icon={faCoins} /> Final Credits</p>
                                            <p className="font-extrabold text-emerald-700 text-xl">{selectedSubmission.creditsAwarded || 0}</p>
                                        </div>
                                        {selectedSubmission.location?.name && (
                                            <div className="p-3 bg-gray-50 rounded-xl col-span-2 md:col-span-3">
                                                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><FontAwesomeIcon icon={faMapMarkerAlt} /> Location</p>
                                                <p className="font-bold text-gray-800 text-sm">{selectedSubmission.location.name}</p>
                                                {selectedSubmission.location.coordinates && (
                                                    <p className="text-xs text-gray-400">
                                                        {selectedSubmission.location.coordinates.lat?.toFixed(5)}, {selectedSubmission.location.coordinates.lng?.toFixed(5)}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {/* Tagged Items */}
                                        {(selectedSubmission.verificationDetails?.taggedUsers?.length > 0 || selectedSubmission.verificationDetails?.taggedCommunities?.length > 0) && (
                                            <div className="p-3 bg-blue-50 rounded-xl col-span-2 md:col-span-3 border border-blue-100">
                                                <p className="text-xs text-blue-500 mb-1 flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faUsers} /> 
                                                    {selectedSubmission.verificationDetails?.taggingMode === 'members' ? 'Tagged Citizens' : 'Tagged Communities'}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(selectedSubmission.verificationDetails?.taggedUsers || []).map(u => (
                                                        <span key={u._id} className="px-2 py-0.5 bg-white text-blue-700 rounded-lg text-[10px] font-bold shadow-sm border border-blue-100">
                                                            {u.name || u.username || 'User'}
                                                        </span>
                                                    ))}
                                                    {(selectedSubmission.verificationDetails?.taggedCommunities || []).map(c => (
                                                        <span key={c._id} className="px-2 py-0.5 bg-white text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm border border-emerald-100 uppercase">
                                                            {c.name || 'Community'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* AI Description */}
                                {selectedSubmission.description && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">AI Analysis Description</h4>
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 leading-relaxed">
                                            {selectedSubmission.description}
                                        </div>
                                    </div>
                                )}

                                {/* Credits Edit Section */}
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <h4 className="text-sm font-bold text-yellow-700 mb-3 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCoins} />
                                        Credits Allocation
                                    </h4>
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs text-yellow-700 font-medium mb-1">
                                                Credits to Award (AI suggested: {selectedSubmission.verificationDetails?.suggestedCredits ?? selectedSubmission.creditsAwarded ?? 0})
                                            </label>
                                            <input
                                                type="number"
                                                value={editCredits}
                                                onChange={(e) => setEditCredits(e.target.value)}
                                                min="0"
                                                className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                                                placeholder="Enter credits to award"
                                            />
                                        </div>
                                        {selectedSubmission.status === 'verified' && (
                                            <button
                                                onClick={handleUpdateCreditsOnly}
                                                disabled={actionLoading}
                                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-bold hover:bg-yellow-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                                Update Credits
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Notes / Remarks</label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3C88] resize-none"
                                        rows="3"
                                        placeholder="Add your notes or reason for approval/rejection..."
                                    />
                                </div>

                                {/* Existing Verification Details */}
                                {selectedSubmission.verificationDetails?.verifiedBy && (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                        <h4 className="font-bold text-gray-600 mb-2">Verification History</h4>
                                        <p className="text-gray-600">Verified By: <strong>{selectedSubmission.verificationDetails.verifiedBy}</strong></p>
                                        {selectedSubmission.verificationDetails.verifiedAt && (
                                            <p className="text-gray-600">Verified At: <strong>{new Date(selectedSubmission.verificationDetails.verifiedAt).toLocaleString()}</strong></p>
                                        )}
                                        {selectedSubmission.verificationDetails.notes && (
                                            <p className="text-gray-600 mt-1">Notes: <em>{selectedSubmission.verificationDetails.notes}</em></p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer - Action Buttons */}
                            {selectedSubmission.status === 'pending' && (
                                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-5 rounded-b-2xl flex flex-wrap gap-3 justify-between items-center">
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500" />
                                        Action will notify the citizen
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction('rejected')}
                                            disabled={actionLoading}
                                            className="px-5 py-2.5 rounded-xl font-bold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 flex items-center gap-2"
                                        >
                                            {actionLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faTimes} />}
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction('verified')}
                                            disabled={actionLoading}
                                            className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-colors disabled:opacity-60 flex items-center gap-2"
                                        >
                                            {actionLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheck} />}
                                            Approve &amp; Award {editCredits || 0} Credits
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedSubmission.status === 'verified' && (
                                <div className="sticky bottom-0 bg-emerald-50 border-t border-emerald-100 p-5 rounded-b-2xl flex items-center justify-between">
                                    <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        This submission has already been approved.
                                    </p>
                                    <button onClick={closeDetail} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">
                                        Close
                                    </button>
                                </div>
                            )}

                            {selectedSubmission.status === 'rejected' && (
                                <div className="sticky bottom-0 bg-red-50 border-t border-red-100 p-5 rounded-b-2xl flex items-center justify-between">
                                    <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                        This submission has been rejected.
                                    </p>
                                    <button onClick={closeDetail} className="px-5 py-2 bg-gray-600 text-white rounded-xl font-bold text-sm hover:bg-gray-700">
                                        Close
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSubmissionReviews;
