import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedCard from '../../components/FeedCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faSpinner, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import { getStoredUser } from '../../services/authService';

const AdminFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const currentUser = getStoredUser();

    // Use admin API endpoint or standard post endpoints?
    // Standard endpoints work if we just want to see the feed.
    // Admin features are enabled by getUser's role.

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/posts?page=${page}&limit=20`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setPosts(response.data.data);
                setHasMore(response.data.pagination.page < response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [page]);

    const handleLike = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/posts/${postId}/like`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setPosts(posts.map(post =>
                    post._id === postId ? { ...post, likes: response.data.data.likes } : post
                ));
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleComment = async (postId, text) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/posts/${postId}/comment`,
                { text },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setPosts(posts.map(post =>
                    post._id === postId ? {
                        ...post,
                        comments: [...(post.comments || []), response.data.data]
                    } : post
                ));
            }
        } catch (error) {
            console.error('Error commenting:', error);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/posts/${postId}/comment/${commentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setPosts(posts.map(post =>
                    post._id === postId ? {
                        ...post,
                        comments: post.comments.filter(c => c._id !== commentId)
                    } : post
                ));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/posts/${postId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setPosts(posts.filter(p => p._id !== postId));
                // Add notification or toast here if needed
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post');
        }
    };

    const filteredPosts = posts.filter(post =>
        post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        <FontAwesomeIcon icon={faNewspaper} className="mr-3 text-emerald-600" />
                        Public Feed Management
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Monitor and manage community posts
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
                        style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
            </div>

            {loading && posts.length === 0 ? (
                <div className="flex justify-center p-12">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-emerald-500" />
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No posts found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredPosts.map(post => (
                        <FeedCard
                            key={post._id}
                            post={post}
                            onLike={handleLike}
                            onComment={handleComment}
                            onDeleteComment={handleDeleteComment}
                            onDeletePost={handleDeletePost}
                        />
                    ))}
                </div>
            )}

            {/* Load More Button could go here */}
        </div>
    );
};

export default AdminFeed;
