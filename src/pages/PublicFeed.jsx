import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import FeedCard from '../components/FeedCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faNewspaper, faGlobe, faUser } from '@fortawesome/free-solid-svg-icons';
import { getStoredUser } from '../services/authService';

const PublicFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showMyPosts, setShowMyPosts] = useState(false);
    const currentUser = getStoredUser();

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    // Check URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('myPosts') === 'true') {
            setShowMyPosts(true);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [showMyPosts]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const endpoint = showMyPosts
                ? `/posts/user/${currentUser._id}?page=${page}&limit=10`
                : `/posts?page=${page}&limit=10`;
            const response = await api.get(endpoint);
            if (response.data.success) {
                setPosts(response.data.data);
                setHasMore(response.data.pagination.page < response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            const response = await api.post(`/posts/${postId}/like`);
            if (response.data.success) {
                // Update the post in state
                setPosts(posts.map(post =>
                    post._id === postId
                        ? { ...post, likes: response.data.data.likes }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    const handleComment = async (postId, text) => {
        try {
            const response = await api.post(`/posts/${postId}/comment`, { text });
            if (response.data.success) {
                // Update the post with the new comment
                setPosts(posts.map(post =>
                    post._id === postId
                        ? { ...post, comments: [...(post.comments || []), response.data.data] }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const response = await api.delete(`/posts/${postId}/comment/${commentId}`);
            if (response.data.success) {
                // Remove the comment from the post
                setPosts(posts.map(post =>
                    post._id === postId
                        ? { ...post, comments: post.comments.filter(c => c._id !== commentId) }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    if (loading && posts.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-emerald-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header with Filter Toggle */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-1">
                                {showMyPosts ? 'My Posts' : 'Public Feed'}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {showMyPosts
                                    ? 'Your shared activities'
                                    : 'See what the community is doing to make a difference'
                                }
                            </p>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => setShowMyPosts(!showMyPosts)}
                            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                            style={{
                                backgroundColor: showMyPosts ? '#10b981' : '#6b7280',
                                color: 'white'
                            }}
                        >
                            <FontAwesomeIcon icon={showMyPosts ? faUser : faGlobe} />
                            {showMyPosts ? 'View All Posts' : 'My Posts'}
                        </button>
                    </div>
                </div>

                {/* Posts */}
                {posts.length > 0 ? (
                    <div>
                        {posts.map((post) => (
                            <FeedCard
                                key={post._id}
                                post={post}
                                onLike={handleLike}
                                onComment={handleComment}
                                onDeleteComment={handleDeleteComment}
                            />
                        ))}

                        {/* Load More */}
                        {hasMore && (
                            <button
                                onClick={() => {
                                    setPage(page + 1);
                                    fetchPosts();
                                }}
                                className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold mb-4"
                            >
                                {loading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More'
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            No posts yet. Be the first to share your eco-activity!
                        </p>
                        <a
                            href="/upload"
                            className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold"
                        >
                            Upload Activity
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicFeed;
