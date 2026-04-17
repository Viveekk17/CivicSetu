import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers, faPlus, faTimes, faSearch, faTrophy, faLeaf,
    faTrash, faSpinner, faSignOutAlt, faCrown, faMedal,
    faAward, faTree, faSeedling
} from '@fortawesome/free-solid-svg-icons';
import { searchUsers, getStoredUser } from '../services/authService';
import api from '../services/api';
import NotificationToast from '../components/common/NotificationToast';

const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

const Eyebrow = ({ children }) => (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
        {children}
    </p>
);

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

    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/communities');
            if (res.data.success) setCommunities(res.data.data);
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
    const removeMember = (userId) => setSelectedMembers(selectedMembers.filter(m => m._id !== userId));

    const resetForm = () => {
        setShowCreateModal(false);
        setCommunityName('');
        setCommunityDescription('');
        setSelectedMembers([]);
    };

    const handleCreateCommunity = async () => {
        if (!communityName.trim()) {
            setToast({ type: 'error', message: 'Please enter a community name' });
            return;
        }
        try {
            await api.post('/communities', {
                name: communityName,
                description: communityDescription,
                members: selectedMembers.map(m => m._id)
            });
            setToast({ type: 'success', message: `${communityName} has been created!` });
            fetchCommunities();
            resetForm();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Failed to create community' });
        }
    };

    const handleDeleteCommunity = async (communityId) => {
        if (!window.confirm('Are you sure you want to delete this community?')) return;
        try {
            await api.delete(`/communities/${communityId}`);
            setToast({ type: 'success', message: 'Community deleted successfully' });
            fetchCommunities();
        } catch {
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

    const leaderboard = [...communities];
    const myCommunities = communities.filter(c => c.members.some(m => m._id === currentUser?.id));

    const totalMembers = communities.reduce((acc, c) => acc + (c.members?.length || 0), 0);
    const totalPollution = communities.reduce((acc, c) => acc + (c.totalPollutionSaved || 0), 0);
    const totalTrees = communities.reduce((acc, c) => acc + (c.totalTreesPlanted || 0), 0);

    const rankIcon = (rank) => {
        if (rank === 1) return { icon: faCrown, color: '#f59e0b' };
        if (rank === 2) return { icon: faMedal, color: '#94a3b8' };
        if (rank === 3) return { icon: faAward, color: '#b45309' };
        return null;
    };

    return (
        <motion.div variants={container} initial="hidden" animate="visible" className="space-y-5 md:space-y-6">
            {toast && (
                <NotificationToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
            )}

            {/* Hero card */}
            <motion.div variants={item} className="card p-5 md:p-7 relative overflow-hidden">
                <div
                    className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.25), transparent 70%)' }}
                />
                <div className="grid md:grid-cols-5 gap-5 md:gap-6 items-center relative z-10">
                    <div className="md:col-span-3">
                        <Eyebrow>Community Hub</Eyebrow>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 md:mt-1.5 leading-tight" style={{ color: 'var(--text-primary)' }}>
                            Build a movement, together
                        </h1>
                        <p className="text-xs md:text-sm mt-2 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                            Create communities, join local groups, and amplify your impact through
                            collective civic action.
                        </p>
                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary mt-4 md:mt-5 w-full sm:w-auto">
                            <FontAwesomeIcon icon={faPlus} /> Create Community
                        </button>
                    </div>
                    <div
                        className="md:col-span-2 rounded-2xl p-4 md:p-5"
                        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)', color: '#fff' }}
                    >
                        <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Network impact</p>
                        <div className="grid grid-cols-3 gap-2 md:gap-3 mt-3">
                            <div className="min-w-0">
                                <p className="text-xl md:text-2xl font-bold leading-none">{communities.length}</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1 truncate">Groups</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl md:text-2xl font-bold leading-none">{totalMembers}</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1 truncate">Members</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl md:text-2xl font-bold leading-none">{totalTrees}</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1 truncate">Trees</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="card p-12 flex justify-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" style={{ color: 'var(--primary)' }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
                    {/* Leaderboard */}
                    <motion.div variants={item} className="card p-5 md:p-6 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                            >
                                <FontAwesomeIcon icon={faTrophy} />
                            </div>
                            <div>
                                <Eyebrow>Leaderboard</Eyebrow>
                                <h2 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                                    Top Communities
                                </h2>
                            </div>
                        </div>

                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12">
                                <FontAwesomeIcon icon={faUsers} className="text-3xl mb-3" style={{ color: 'var(--text-tertiary)' }} />
                                <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>No Communities Yet</p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    Be the first to create one.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {leaderboard.map((community, index) => {
                                        const rank = index + 1;
                                        const isMine = community.members.some(m => m._id === currentUser?.id);
                                        const badge = rankIcon(rank);
                                        return (
                                            <motion.div
                                                key={community._id || community.id}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className="p-3 md:p-4 rounded-xl transition-all"
                                                style={{
                                                    background: isMine ? 'rgba(20, 36, 138, 0.06)' : 'var(--bg-hover)',
                                                    border: isMine ? '1px solid var(--primary)' : '1px solid transparent',
                                                }}
                                            >
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div
                                                        className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                                                        style={{
                                                            background: badge ? `${badge.color}1f` : 'var(--bg-elevated)',
                                                            color: badge ? badge.color : 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        {badge ? <FontAwesomeIcon icon={badge.icon} className="text-sm md:text-base" /> : <span className="text-xs md:text-sm">#{rank}</span>}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-bold text-sm md:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                                                                {community.name}
                                                            </p>
                                                            {isMine && (
                                                                <span
                                                                    className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                                                                    style={{ background: 'var(--primary)', color: '#fff' }}
                                                                >
                                                                    YOURS
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] md:text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                                                            {community.members.length} members · by {community.creator?.name || 'Unknown'}
                                                        </p>
                                                    </div>

                                                    {!isMine && (
                                                        <button
                                                            onClick={() => handleJoin(community._id || community.id)}
                                                            className="btn btn-outline text-[11px] md:text-xs px-2.5 md:px-3 py-1.5 flex-shrink-0"
                                                        >
                                                            Join
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-2.5 pl-12 md:pl-14">
                                                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold" style={{ color: 'var(--primary)' }}>
                                                        <FontAwesomeIcon icon={faLeaf} className="text-[10px]" />
                                                        {(community.totalPollutionSaved || 0).toFixed(1)} kg
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold" style={{ color: '#22c55e' }}>
                                                        <FontAwesomeIcon icon={faTree} className="text-[10px]" />
                                                        {community.totalTreesPlanted || 0} trees
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>

                    {/* My Communities */}
                    <motion.div variants={item} className="card p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(153, 143, 199, 0.15)', color: '#998fc7' }}
                            >
                                <FontAwesomeIcon icon={faSeedling} />
                            </div>
                            <div>
                                <Eyebrow>My Groups</Eyebrow>
                                <h2 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                                    Communities
                                </h2>
                            </div>
                        </div>

                        {myCommunities.length === 0 ? (
                            <div className="text-center py-8 px-2">
                                <FontAwesomeIcon icon={faUsers} className="text-2xl mb-2" style={{ color: 'var(--text-tertiary)' }} />
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    You haven't joined any communities yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myCommunities.map((community) => {
                                    const isOwner = community.creator?._id === currentUser?.id || community.creator === currentUser?.id;
                                    return (
                                        <div
                                            key={community._id || community.id}
                                            className="p-4 rounded-xl"
                                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {community.name}
                                                </h3>
                                                <button
                                                    onClick={() => isOwner ? handleDeleteCommunity(community._id || community.id) : handleLeave(community._id || community.id)}
                                                    className="text-xs p-1.5 rounded-lg transition-colors hover:bg-black/5"
                                                    style={{ color: isOwner ? '#ef4444' : '#f59e0b' }}
                                                    title={isOwner ? 'Delete' : 'Leave'}
                                                >
                                                    <FontAwesomeIcon icon={isOwner ? faTrash : faSignOutAlt} />
                                                </button>
                                            </div>
                                            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                                                {community.members.length} members
                                            </p>
                                            <div className="flex gap-3 text-xs">
                                                <span className="flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                                                    <FontAwesomeIcon icon={faLeaf} className="text-[10px]" />
                                                    {(community.totalPollutionSaved || 0).toFixed(1)} kg
                                                </span>
                                                <span className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                                                    <FontAwesomeIcon icon={faTree} className="text-[10px]" />
                                                    {community.totalTreesPlanted || 0}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Create Community Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        onClick={resetForm}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="card p-5 md:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-5 md:mb-6">
                                <div className="min-w-0">
                                    <Eyebrow>New Community</Eyebrow>
                                    <h2 className="text-lg md:text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                                        Create a Group
                                    </h2>
                                </div>
                                <button
                                    onClick={resetForm}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <Eyebrow>Community Name *</Eyebrow>
                                    <input
                                        type="text"
                                        className="w-full mt-2 p-3 rounded-xl text-sm font-medium outline-none transition-all"
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border-light)',
                                            color: 'var(--text-primary)',
                                        }}
                                        placeholder="e.g., Green Warriors Delhi"
                                        value={communityName}
                                        onChange={(e) => setCommunityName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Eyebrow>Description</Eyebrow>
                                    <textarea
                                        className="w-full mt-2 p-3 rounded-xl text-sm font-medium outline-none transition-all"
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border-light)',
                                            color: 'var(--text-primary)',
                                        }}
                                        placeholder="Describe your community's mission and goals..."
                                        rows="3"
                                        value={communityDescription}
                                        onChange={(e) => setCommunityDescription(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Eyebrow>Members ({selectedMembers.length + 1})</Eyebrow>
                                    <div className="relative mt-2">
                                        <FontAwesomeIcon
                                            icon={faSearch}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        />
                                        <input
                                            type="text"
                                            className="w-full pl-11 p-3 rounded-xl text-sm font-medium outline-none"
                                            style={{
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-light)',
                                                color: 'var(--text-primary)',
                                            }}
                                            placeholder="Search users by name..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                        />
                                        {isSearching && (
                                            <FontAwesomeIcon icon={faSpinner} spin className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                                        )}

                                        {searchResults.length > 0 && (
                                            <div
                                                className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto"
                                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}
                                            >
                                                {searchResults.map(user => (
                                                    <div
                                                        key={user._id}
                                                        className="p-3 cursor-pointer transition-colors hover:bg-black/5"
                                                        style={{ borderBottom: '1px solid var(--border-light)' }}
                                                        onClick={() => addMember(user)}
                                                    >
                                                        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
                                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <div
                                            className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold"
                                            style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}
                                        >
                                            {currentUser?.name} (You)
                                        </div>
                                        {selectedMembers.map(member => (
                                            <div
                                                key={member._id}
                                                className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold"
                                                style={{ background: 'rgba(20, 36, 138, 0.1)', color: 'var(--primary)' }}
                                            >
                                                {member.name}
                                                <button onClick={() => removeMember(member._id)}>
                                                    <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={resetForm} className="btn btn-outline flex-1">
                                        Cancel
                                    </button>
                                    <button onClick={handleCreateCommunity} className="btn btn-primary flex-1">
                                        Create
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Community;
