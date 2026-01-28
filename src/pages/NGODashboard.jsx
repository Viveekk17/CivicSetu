import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faLeaf,
    faCheckCircle,
    faHandHoldingHeart,
    faAward,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

const mockNGOs = [
    {
        id: 1,
        name: "Green Earth Foundation",
        description: "Dedicated to reforestation and clean water initiatives across India",
        logo: "🌍",
        members: 1250,
        impact: "15,000 trees planted",
        activities: ["Tree Plantation", "Water Conservation", "Awareness Campaigns"],
        founded: "2015",
        location: "New Delhi"
    },
    {
        id: 2,
        name: "Clean Cities Alliance",
        description: "Urban waste management and pollution reduction in major cities",
        logo: "🏙️",
        members: 890,
        impact: "50 tons of waste recycled",
        activities: ["Waste Management", "City Cleanups", "Recycling Programs"],
        founded: "2018",
        location: "Mumbai"
    },
    {
        id: 3,
        name: "EcoWarriors India",
        description: "Community-driven environmental conservation and beach cleanup initiatives",
        logo: "🌊",
        members: 2100,
        impact: "100+ beach cleanups organized",
        activities: ["Beach Cleanups", "Marine Conservation", "Community Events"],
        founded: "2016",
        location: "Chennai"
    }
];

const NGODashboard = () => {
    const [joinedNGOs, setJoinedNGOs] = useState([]);
    const [selectedNGO, setSelectedNGO] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Load joined NGOs from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('joinedNGOs');
        if (stored) {
            setJoinedNGOs(JSON.parse(stored));
        }
    }, []);

    const handleJoinNGO = (ngo) => {
        setSelectedNGO(ngo);
        setShowModal(true);
    };

    const confirmJoin = () => {
        if (selectedNGO && !joinedNGOs.includes(selectedNGO.id)) {
            const updated = [...joinedNGOs, selectedNGO.id];
            setJoinedNGOs(updated);
            localStorage.setItem('joinedNGOs', JSON.stringify(updated));

            // Show success notification
            window.dispatchEvent(new CustomEvent('newNotification', {
                detail: {
                    type: 'success',
                    title: 'Successfully Joined!',
                    message: `You are now a member of ${selectedNGO.name}`
                }
            }));
        }
        setShowModal(false);
        setSelectedNGO(null);
    };

    const handleLeaveNGO = (ngoId) => {
        const updated = joinedNGOs.filter(id => id !== ngoId);
        setJoinedNGOs(updated);
        localStorage.setItem('joinedNGOs', JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent('newNotification', {
            detail: {
                type: 'info',
                title: 'Left NGO',
                message: 'You have left the organization'
            }
        }));
    };

    const isJoined = (ngoId) => joinedNGOs.includes(ngoId);
    const myNGOs = mockNGOs.filter(ngo => isJoined(ngo.id));
    const availableNGOs = mockNGOs.filter(ngo => !isJoined(ngo.id));

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    NGO Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Join registered NGOs and contribute to making our nation green and clean
                </p>
            </div>

            {/* My NGOs Section */}
            {myNGOs.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        My NGOs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myNGOs.map((ngo, index) => (
                            <motion.div
                                key={ngo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card p-6 relative border-2 border-green-500"
                            >
                                <div className="absolute top-4 right-4">
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        Member
                                    </span>
                                </div>

                                <div className="text-5xl mb-4">{ngo.logo}</div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    {ngo.name}
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                    {ngo.description}
                                </p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--text-tertiary)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {ngo.members.toLocaleString()} members
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faAward} style={{ color: 'var(--text-tertiary)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{ngo.impact}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleLeaveNGO(ngo.id)}
                                    className="w-full py-2 px-4 rounded-xl border-2 border-red-500 text-red-500 font-bold hover:bg-red-50 transition-colors"
                                >
                                    Leave NGO
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available NGOs Section */}
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faHandHoldingHeart} className="text-blue-500" />
                    {availableNGOs.length > 0 ? 'Available NGOs' : 'All NGOs Joined!'}
                </h2>

                {availableNGOs.length === 0 ? (
                    <div className="card p-8 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Great job!
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            You've joined all available NGOs on our platform
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableNGOs.map((ngo, index) => (
                            <motion.div
                                key={ngo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="text-5xl mb-4">{ngo.logo}</div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    {ngo.name}
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                    {ngo.description}
                                </p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--text-tertiary)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {ngo.members.toLocaleString()} members
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faAward} style={{ color: 'var(--text-tertiary)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{ngo.impact}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faLeaf} style={{ color: 'var(--text-tertiary)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            Since {ngo.founded} • {ngo.location}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        Activities:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {ngo.activities.map((activity, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs px-2 py-1 rounded-full"
                                                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                                            >
                                                {activity}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleJoinNGO(ngo)}
                                    className="w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
                                    style={{ background: 'var(--gradient-primary)' }}
                                >
                                    Join NGO
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Join Confirmation Modal */}
            {showModal && selectedNGO && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="card p-8 max-w-md w-full"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Join {selectedNGO.name}?
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                        </div>

                        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                            You're about to join <strong>{selectedNGO.name}</strong>. You'll be able to participate in their activities and contribute to their environmental mission.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmJoin}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
                                style={{ background: 'var(--gradient-primary)' }}
                            >
                                Confirm Join
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default NGODashboard;
