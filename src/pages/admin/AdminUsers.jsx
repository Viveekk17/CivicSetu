import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionType, setActionType] = useState(null); // 'credits' or 'notify'
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'credits', 'manage'

    // Form States
    const [creditAmount, setCreditAmount] = useState('');
    const [creditAction, setCreditAction] = useState('add');
    const [creditReason, setCreditReason] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            if (res.success) {
                setUsers(res.data);
                setFilteredUsers(res.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Search Filter
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(
                users.filter(user =>
                    user.name?.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, users]);

    const handleUserClick = async (userId) => {
        setDetailsLoading(true);
        try {
            const res = await api.get(`/admin/users/${userId}`);
            if (res.success) {
                setUserDetails(res.data);
                setSelectedUser(res.data.user);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const openAction = (user, type) => {
        setActionType(type);
        // Reset forms
        setCreditAmount('');
        setCreditAction('add');
        setCreditReason('');
        setNotificationMessage('');
    };

    const handleCreditUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${selectedUser._id}/credits`, {
                amount: creditAmount,
                action: creditAction,
                reason: creditReason
            });
            alert('Credits updated successfully!');
            setActionType(null);
            fetchUsers();
            handleUserClick(selectedUser._id); // Refresh details
        } catch (error) {
            console.error(error);
            alert('Failed to update credits');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('️ WARNING: This will permanently delete the user and ALL their data:\n• All submissions\n• All transactions\n• Community memberships\n• All reports\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
            return;
        }
        try {
            const res = await api.delete(`/admin/users/${userId}`);
            alert('User deleted successfully');
            setSelectedUser(null);
            setUserDetails(null);
            setActionType(null);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(error.message || "Failed to delete user");
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        alert(`Notification sent to ${selectedUser.name}! (Simulated)`);
        setActionType(null);
    };

    const closeDetails = () => {
        setSelectedUser(null);
        setUserDetails(null);
        setActionType(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A8A8] w-80"
                />
            </div>

            {loading ? (
                <div>Loading users...</div>
            ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr
                                    key={user._id}
                                    onClick={() => handleUserClick(user._id)}
                                    className="border-b hover:bg-blue-50 cursor-pointer transition"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                                {user.name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="font-bold text-gray-800">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{user.email}</td>
                                    <td className="p-4 text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr><td colSpan="3" className="p-8 text-center text-gray-500">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* User Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl sticky top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{selectedUser.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                                <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                            </div>

                            {/* Tab Navigation */}
                            <div className="border-b border-gray-200 px-6">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`py-3 px-4 font-medium transition-all ${activeTab === 'overview'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('credits')}
                                        className={`py-3 px-4 font-medium transition-all ${activeTab === 'credits'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Edit Credits
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('manage')}
                                        className={`py-3 px-4 font-medium transition-all ${activeTab === 'manage'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>

                            {detailsLoading ? (
                                <div className="p-8 text-center">Loading details...</div>
                            ) : userDetails ? (
                                <div className="p-6 space-y-6">
                                    {/* Overview Tab */}
                                    {activeTab === 'overview' && (
                                        <>
                                            {/* User Stats */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-1">Credits</p>
                                                    <p className="text-2xl font-bold text-blue-600">{selectedUser.credits}</p>
                                                </div>
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-1">Trees Planted</p>
                                                    <p className="text-2xl font-bold text-green-600">{selectedUser.impact?.treesPlanted || 0}</p>
                                                </div>
                                                <div className="bg-emerald-50 p-4 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-1">Pollution Saved</p>
                                                    <p className="text-2xl font-bold text-emerald-600">{selectedUser.impact?.pollutionSaved?.toFixed(1) || 0} kg</p>
                                                </div>
                                                <div className="bg-purple-50 p-4 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-1">Total Submissions</p>
                                                    <p className="text-2xl font-bold text-purple-600">{userDetails.submissions?.length || 0}</p>
                                                </div>
                                            </div>

                                            {/* Submissions List */}
                                            <div>
                                                <h4 className="font-bold text-gray-700 mb-4">All Submissions ({userDetails.submissions?.length || 0})</h4>
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                    {userDetails.submissions && userDetails.submissions.length > 0 ? (
                                                        userDetails.submissions.map(sub => (
                                                            <div key={sub._id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                <div className="flex-shrink-0">
                                                                    {sub.photos && sub.photos.length > 0 ? (
                                                                        <img
                                                                            src={sub.photos[0]}
                                                                            alt="Submission"
                                                                            className="w-16 h-16 object-cover rounded-lg"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                                                                            No Image
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="text-xs text-gray-600">
                                                                                <span className="font-semibold">Location:</span> {sub.location?.address || 'N/A'}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                {new Date(sub.createdAt).toLocaleDateString()}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className={`text-xs px-2 py-1 rounded font-bold ${sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                                sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                                    'bg-yellow-100 text-yellow-700'
                                                                                }`}>
                                                                                {sub.status}
                                                                            </span>
                                                                            <p className="text-xs text-emerald-600 font-bold mt-1">
                                                                                {sub.creditsAwarded || 0} Credits
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500 text-sm text-center py-8">No submissions yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Edit Credits Tab */}
                                    {activeTab === 'credits' && (
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-gray-700">Edit User Credits</h4>
                                            <form onSubmit={handleCreditUpdate} className="space-y-4 bg-gray-50 p-6 rounded-lg">
                                                <div className="flex bg-gray-200 rounded-lg p-1">
                                                    <button type="button" className={`flex-1 py-2 rounded-md text-sm font-bold transition ${creditAction === 'add' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`} onClick={() => setCreditAction('add')}>Add Credits</button>
                                                    <button type="button" className={`flex-1 py-2 rounded-md text-sm font-bold transition ${creditAction === 'deduct' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`} onClick={() => setCreditAction('deduct')}>Deduct Credits</button>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                                    <input type="number" required placeholder="Enter credit amount" className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                                    <input type="text" required placeholder="Enter reason" className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={creditReason} onChange={(e) => setCreditReason(e.target.value)} />
                                                </div>
                                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">{creditAction === 'add' ? 'Add' : 'Deduct'} Credits</button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Manage Tab */}
                                    {activeTab === 'manage' && (
                                        <div className="space-y-6">
                                            <h4 className="text-lg font-bold text-gray-700">Manage User</h4>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                                <h5 className="font-bold text-red-800 mb-2">️ Danger Zone</h5>
                                                <p className="text-sm text-red-700 mb-4">Deleting this user will permanently remove all submissions, transactions, memberships, and reports.</p>
                                                <button onClick={() => handleDeleteUser(selectedUser._id)} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition">️ Delete User Permanently</button>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                                <h5 className="font-bold text-blue-800 mb-3">Send Notification</h5>
                                                <form onSubmit={handleSendNotification} className="space-y-4">
                                                    <textarea required rows="4" className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your message..." value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)}></textarea>
                                                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">Send Notification</button>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">Error loading user details</div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminUsers;
