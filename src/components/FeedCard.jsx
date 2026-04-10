import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart,
    faComment,
    faMapMarkerAlt,
    faTrash,
    faCalendarAlt,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { getStoredUser } from '../services/authService';

const FeedCard = ({ post, onLike, onComment, onDeleteComment, onDeletePost }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const currentUser = getStoredUser();

    const isLiked = post.likes?.includes(currentUser?._id);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        await onComment(post._id, commentText.trim());
        setCommentText('');
        setSubmittingComment(false);
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-4"
        >
            {/* User Header */}
            <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {(post.user?.profilePicture && !post.user.profilePicture.includes('default-avatar.png')) ? (
                        <img
                            src={post.user.profilePicture}
                            alt={post.user?.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-sm">
                            {post.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </span>
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-gray-900">{post.user?.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        {formatTimeAgo(post.createdAt)}
                    </p>
                </div>
                {onDeletePost && (currentUser?.role === 'admin' || currentUser?._id === post.user?._id) && (
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this post?')) {
                                onDeletePost(post._id);
                            }
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Delete Post"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                )}
            </div>

            {/* Post Description */}
            <div className="px-4 pb-3">
                <p className="text-gray-800 text-base leading-relaxed">{post.description}</p>
            </div>

            {/* Location */}
            {post.submission?.location?.name && (
                <div className="px-4 pb-3">
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500" />
                        {post.submission.location.name}
                    </p>
                </div>
            )}

            {/* Submission Image Carousel */}
            {post.submission?.photos && post.submission.photos.length > 0 && (() => {
                // Determine which photos to show based on selectedPhotos
                const photosToShow = [];
                const photoLabels = [];

                if (post.selectedPhotos?.includes('before') && post.submission.photos[0]) {
                    photosToShow.push(post.submission.photos[0]);
                    photoLabels.push('Before');
                }
                if (post.selectedPhotos?.includes('after') && post.submission.photos[1]) {
                    photosToShow.push(post.submission.photos[1]);
                    photoLabels.push('After');
                }

                // Fallback: if selectedPhotos is not set, show all available photos
                if (photosToShow.length === 0) {
                    photosToShow.push(...post.submission.photos.slice(0, 2));
                    photoLabels.push('Before', 'After');
                }

                const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
                const [isHovered, setIsHovered] = React.useState(false);

                return (
                    <div
                        className="w-full relative group"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Image Display */}
                        <div className="relative overflow-hidden">
                            <img
                                src={photosToShow[currentImageIndex]}
                                alt={photoLabels[currentImageIndex]}
                                className="w-full object-cover"
                                style={{ maxHeight: '500px' }}
                            />

                            {/* Photo Label Badge */}
                            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                {photoLabels[currentImageIndex]}
                            </div>

                            {/* Navigation Arrows - only show on hover and if multiple photos */}
                            {photosToShow.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? photosToShow.length - 1 : prev - 1))}
                                        className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                            }`}
                                    >
                                        <span className="text-gray-800 text-xl">‹</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev === photosToShow.length - 1 ? 0 : prev + 1))}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                            }`}
                                    >
                                        <span className="text-gray-800 text-xl">›</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Dots Navigation - always visible if multiple photos */}
                        {photosToShow.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                {photosToShow.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/60'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Like/Comment Bar */}
            <div className="px-4 py-2 border-t border-b border-gray-200 flex items-center gap-6">
                <button
                    onClick={() => onLike(post._id)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-md transition-all ${isLiked ? 'text-red-500' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <FontAwesomeIcon icon={isLiked ? faHeart : faHeartRegular} className="text-lg" />
                    <span className="font-semibold text-sm">{post.likes?.length || 0}</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 py-2 px-3 rounded-md text-gray-600 hover:bg-gray-100 transition-all"
                >
                    <FontAwesomeIcon icon={faComment} className="text-lg" />
                    <span className="font-semibold text-sm">{post.comments?.length || 0}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-4 py-3 bg-gray-50">
                    {/* Existing Comments */}
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                                <div key={comment._id} className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                        {(comment.user?.profilePicture && !comment.user.profilePicture.includes('default-avatar.png')) ? (
                                            <img
                                                src={comment.user.profilePicture}
                                                alt={comment.user?.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{comment.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1) || '?'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-bold text-gray-900">{comment.user?.name}</p>
                                            {(currentUser?._id === comment.user?._id || currentUser?._id === post.user?._id) && (
                                                <button
                                                    onClick={() => onDeleteComment(post._id, comment._id)}
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-800">{comment.text}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(comment.createdAt)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first!</p>
                        )}
                    </div>

                    {/* Add Comment Form */}
                    {currentUser && (
                        <form onSubmit={handleCommentSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                                maxLength="500"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || submittingComment}
                                className="px-6 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
                            >
                                {submittingComment ? 'Posting...' : 'Post'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default FeedCard;
