import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faPlus,
    faTimes,
    faSearch,
    faTrophy,
    faLeaf,
    faTrash,
    faSpinner,
    faSignInAlt,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { searchUsers } from '../services/authService';
import { getStoredUser } from '../services/authService';
import api from '../services/api';
import NotificationToast from '../components/common/NotificationToast';

const Community = () => {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [communityName, setCommunityName] = useState('');
    const [communityDescription, setCommunityDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [toast, setToast] = useState(null);

    const currentUser = getStoredUser();

    // Fetch communities
    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/communities');
            if (res.data.success) {
                setCommunities(res.data.data);
            }
        } catch (err) {
            console.error(err);
            setToast({ type: 'error', message: 'Failed to load communities' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            setIsSearching(true);
            try {
                const res = await searchUsers(query);
                if (res.success) {
                    // Filter out already selected members and self
                    const available = res.data.filter(
                        u => !selectedMembers.find(m => m._id === u._id) && u._id !== currentUser?.id
                    );
                    setSearchResults(available);
                }
            } catch (err) {
                console.error(err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const addMember = (user) => {
        setSelectedMembers([...selectedMembers, user]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const removeMember = (userId) => {
        setSelectedMembers(selectedMembers.filter(m => m._id !== userId));
    };

    const handleCreateCommunity = async () => {
        if (!communityName.trim()) {
            setToast({ type: 'error', message: 'Please enter a community name' });
            return;
        }

        try {
            const res = await api.post('/communities', {
                name: communityName,
                description: communityDescription,
                members: selectedMembers.map(m => m._id) // Explicitly map to IDs
            });

            setToast({
                type: 'success',
                message: `${communityName} has been created!`
            });

            // Refresh list
            fetchCommunities();

            // Reset form
            setShowCreateModal(false);
            setCommunityName('');
            setCommunityDescription('');
            setSelectedMembers([]);
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to create community'
            });
        }
    };

    const handleDeleteCommunity = async (communityId) => {
        if (!window.confirm('Are you sure you want to delete this community?')) return;

        try {
            await api.delete(`/communities/${communityId}`);
            setToast({ type: 'success', message: 'Community deleted successfully' });
            fetchCommunities();
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to delete community' });
        }
    };

    const handleJoin = async (communityId) => {
        try {
            await api.put(`/communities/${communityId}/join`);
            setToast({ type: 'success', message: 'Joined community successfully!' });
            fetchCommunities();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to join' });
        }
    };

    const handleLeave = async (communityId) => {
        if (!window.confirm('Are you sure you want to leave this community?')) return;

        try {
            await api.put(`/communities/${communityId}/leave`);
            setToast({ type: 'success', message: 'Left community successfully' });
            fetchCommunities();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to leave' });
        }
    };

    // Derived state
    const leaderboard = [...communities]; // Already sorted from backend
    const myCommunities = communities.filter(c =>
        c.members.some(m => m._id === currentUser?.id)
    );

    const getRankBadge = (rank) => {
        if (rank === 1) return '';
        if (rank === 2) return '';
        if (rank === 3) return '';
        return rank;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {toast && (
                <NotificationToast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Community Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Create communities and collaborate for bigger environmental impact
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
                    style={{ background: '#14248a' }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Create Community
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-emerald-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Community Leaderboard */}
                    <div className="lg:col-span-2">
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faTrophy} className="text-yellow-500 text-2xl" />
                                </div>
                                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Community Leaderboard
                                </h3>
                            </div>

                            {leaderboard.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">️</div>
                                    <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                        No Communities Yet
                                    </p>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        Be the first to create a community!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {leaderboard.map((community, index) => {
                                            const rank = index + 1;
                                            const isMine = community.members.some(m => m._id === currentUser?.id);

                                            return (
                                                <motion.div
                                                    key={community._id || community.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="flex items-center gap-4 p-4 rounded-xl transition-all"
                                                    style={{
                                                        background: isMine ? 'var(--gradient-primary)' : 'var(--bg-hover)',
                                                        border: isMine ? '2px solid var(--primary)' : '2px solid transparent',
                                                    }}
                                                >
                                                    {/* Rank */}
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                                                        style={{
                                                            backgroundColor: rank <= 3 ? '#FEF3C7' : 'rgba(0,0,0,0.1)',
                                                            color: isMine ? '#fff' : (rank <= 3 ? '#D97706' : 'var(--text-secondary)')
                                                        }}
                                                    >
                                                        {getRankBadge(rank)}
                                                    </div>

                                                    {/* Community Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className="font-bold truncate"
                                                            style={{ color: isMine ? '#fff' : 'var(--text-primary)' }}
                                                        >
                                                            {community.name}
                                                            {isMine && (
                                                                <span className="ml-2 text-xs font-normal opacity-90">(Your Community)</span>
                                                            )}
                                                        </p>
                                                        <p
                                                            className="text-xs"
                                                            style={{ color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}
                                                        >
                                                            {community.members.length} members • Created by {community.creator?.name || 'Unknown'}
                                                        </p>
                                                    </div>

                                                    {/* Metrics */}
                                                    <div className="text-right flex-shrink-0 flex items-center gap-4">
                                                        <div className="flex flex-col gap-1 items-end">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <p
                                                                    className="font-bold text-sm"
                                                                    style={{ color: isMine ? '#fff' : 'var(--primary)' }}
                                                                >
                                                                    {(community.totalPollutionSaved || 0).toFixed(1)} kg
                                                                </p>
                                                                <span className="text-xs">️</span>
                                                            </div>
                                                            <div className="flex items-center justify-end gap-1">
                                                                <p
                                                                    className="font-bold text-sm"
                                                                    style={{ color: isMine ? '#fff' : '#998fc7' }}
                                                                >
                                                                    {community.totalTreesPlanted || 0}
                                                                </p>
                                                                <span className="text-xs"></span>
                                                            </div>
                                                        </div>

                                                        {/* Join Button (if not mine) */}
                                                        {!isMine && (
                                                            <button
                                                                onClick={() => handleJoin(community._id || community.id)}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm"
                                                            >
                                                                Join
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* My Communities */}
                    <div>
                        <div className="card p-6">
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                                My Communities
                            </h3>

                            {myCommunities.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2"></div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        You haven't joined any communities yet
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myCommunities.map((community) => (
                                        <div
                                            key={community._id || community.id}
                                            className="p-4 rounded-xl relative group"
                                            style={{ backgroundColor: 'var(--bg-hover)' }}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    {community.name}
                                                </h4>

                                                <div className="flex gap-2">
                                                    {community.creator?._id === currentUser?.id || community.creator === currentUser?.id ? (
                                                        <button
                                                            onClick={() => handleDeleteCommunity(community._id || community.id)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            title="Delete Community"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} size="sm" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleLeave(community._id || community.id)}
                                                            className="text-orange-500 hover:text-orange-700 p-1"
                                                            title="Leave Community"
                                                        >
                                                            <FontAwesomeIcon icon={faSignOutAlt} size="sm" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                {community.members.length} members
                                            </p>
                                            <div className="flex gap-2 text-xs">
                                                <span className="flex items-center gap-1">
                                                    ️ {(community.totalPollutionSaved || 0).toFixed(1)} kg
                                                </span>
                                                <span className="flex items-center gap-1">
                                                     {community.totalTreesPlanted || 0}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Community Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Create New Community
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCommunityName('');
                                    setCommunityDescription('');
                                    setSelectedMembers([]);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                        </div>

                        {/* Community Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Community Name *
                            </label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-xl border border-gray-300"
                                placeholder="e.g., Green Warriors Delhi"
                                value={communityName}
                                onChange={(e) => setCommunityName(e.target.value)}
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Description
                            </label>
                            <textarea
                                className="w-full p-3 rounded-xl border border-gray-300"
                                placeholder="Describe your community's mission and goals..."
                                rows="3"
                                value={communityDescription}
                                onChange={(e) => setCommunityDescription(e.target.value)}
                                style={{ color: 'var(--text-primary)' }}
                            />
                        </div>

                        {/* Member Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Add Members (Total: {selectedMembers.length + 1})
                            </label>

                            {/* Search */}
                            <div className="relative mb-3">
                                <div className="relative">
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-300"
                                        placeholder="Search users by name..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        style={{ color: 'var(--text-primary)' }}
                                    />
                                    {isSearching && (
                                        <FontAwesomeIcon icon={faSpinner} spin className="absolute right-3 top-3.5 text-gray-400" />
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                                        {searchResults.map(user => (
                                            <div
                                                key={user._id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                onClick={() => addMember(user)}
                                            >
                                                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {user.name}
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    {user.email}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Members */}
                            <div className="flex flex-wrap gap-2">
                                {/* Current User (Creator) */}
                                <div className="px-3 py-2 rounded-lg flex items-center gap-2 bg-green-100">
                                    <span className="text-sm font-medium text-green-800">
                                        {currentUser?.name} (You)
                                    </span>
                                </div>

                                {/* Added Members */}
                                {selectedMembers.map(member => (
                                    <div key={member._id} className="px-3 py-2 rounded-lg flex items-center gap-2 bg-blue-100">
                                        <span className="text-sm font-medium text-blue-800">{member.name}</span>
                                        <button
                                            onClick={() => removeMember(member._id)}
                                            className="text-blue-800 hover:text-blue-900"
                                        >
                                            <FontAwesomeIcon icon={faTimes} size="sm" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCommunityName('');
                                    setCommunityDescription('');
                                    setSelectedMembers([]);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCommunity}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
                                style={{ background: '#14248a' }}
                            >
                                Create Community
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Community;
