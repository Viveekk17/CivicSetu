import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FeedCard from '../components/FeedCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faGlobe,
    faUser,
    faPlus,
    faMagnifyingGlass,
    faFire,
    faClock,
    faHeart,
    faSeedling,
    faCamera,
    faImage,
    faArrowUp,
    faTrophy,
    faHashtag,
    faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { getStoredUser } from '../services/authService';
import { avatarUrlFor, fallbackAvatarFor } from '../utils/avatar';

const UserAvatar = ({ user, size = 40, className = '' }) => {
    const [src, setSrc] = useState(() => avatarUrlFor(user));
    return (
        <div
            className={`rounded-full overflow-hidden shrink-0 ${className}`}
            style={{
                width: size,
                height: size,
                background: 'linear-gradient(135deg, #ebe3ff 0%, #d4c2fc 100%)',
            }}
        >
            <img
                src={src}
                alt={user?.name || ''}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => {
                    const fb = fallbackAvatarFor(user);
                    if (src !== fb) setSrc(fb);
                }}
            />
        </div>
    );
};

const SORTS = [
    { id: 'recent', label: 'Recent', icon: faClock },
    { id: 'top',    label: 'Top',    icon: faHeart },
    { id: 'trend',  label: 'Trending', icon: faFire },
];

const TABS = [
    { id: 'all',   label: 'For You', icon: faGlobe },
    { id: 'mine',  label: 'My Posts', icon: faUser },
];

const SkeletonCard = () => (
    <div
        className="bg-white rounded-2xl border overflow-hidden mb-5 animate-pulse"
        style={{ borderColor: 'var(--border-light)' }}
    >
        <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-gray-200" />
                <div className="h-2.5 w-1/4 rounded bg-gray-100" />
            </div>
        </div>
        <div className="w-full bg-gray-200" style={{ aspectRatio: '4/5', maxHeight: 480 }} />
        <div className="p-4 space-y-2">
            <div className="h-3 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
    </div>
);

const PublicFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [tab, setTab] = useState('all');
    const [sort, setSort] = useState('recent');
    const [search, setSearch] = useState('');
    const [showScrollTop, setShowScrollTop] = useState(false);

    const navigate = useNavigate();
    const currentUser = getStoredUser();

    const api = useMemo(() => axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }), []);

    // ── URL hint: ?myPosts=true ──
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('myPosts') === 'true') setTab('mine');
    }, []);

    // ── Refresh stored user once on mount so the avatar reflects the latest
    // Google profilePicture (existing sessions stored before the avatar fix had
    // an empty profilePicture; /auth/me returns the up-to-date record).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/auth/me');
                const fresh = res.data?.data || res.data?.user || res.data;
                if (!cancelled && fresh && (fresh.profilePicture || fresh._id)) {
                    const stored = JSON.parse(localStorage.getItem('user') || '{}');
                    const merged = { ...stored, ...fresh, _id: fresh._id || fresh.id || stored._id };
                    if (merged.profilePicture !== stored.profilePicture) {
                        localStorage.setItem('user', JSON.stringify(merged));
                    }
                }
            } catch { /* ignore — anonymous viewers */ }
        })();
        return () => { cancelled = true; };
    }, [api]);

    // ── Reset on tab/sort change ──
    useEffect(() => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        fetchPosts(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    // ── Scroll-top FAB ──
    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 700);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const fetchPosts = async (pageNum = page, replace = false) => {
        try {
            if (replace) setLoading(true);
            const path = tab === 'mine' && currentUser?._id
                ? `/posts/user/${currentUser._id}?page=${pageNum}&limit=10`
                : `/posts?page=${pageNum}&limit=10`;
            const res = await api.get(path);
            if (res.data.success) {
                setPosts((prev) => replace ? res.data.data : [...prev, ...res.data.data]);
                setHasMore(res.data.pagination.page < res.data.pagination.pages);
            }
        } catch (e) {
            console.error('Failed to fetch posts:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setPage(1);
        await fetchPosts(1, true);
    };

    const handleLoadMore = async () => {
        const next = page + 1;
        setPage(next);
        await fetchPosts(next, false);
    };

    const handleLike = async (postId) => {
        // Optimistic toggle
        setPosts((prev) => prev.map((p) => {
            if (p._id !== postId) return p;
            const liked = p.likes?.includes(currentUser?._id);
            const likes = liked
                ? p.likes.filter((id) => id !== currentUser._id)
                : [...(p.likes || []), currentUser._id];
            return { ...p, likes };
        }));
        try {
            await api.post(`/posts/${postId}/like`);
        } catch (e) {
            console.error('Failed to like post:', e);
            // Revert on error
            handleRefresh();
        }
    };

    const handleComment = async (postId, text) => {
        try {
            const res = await api.post(`/posts/${postId}/comment`, { text });
            if (res.data.success) {
                setPosts((prev) => prev.map((p) =>
                    p._id === postId ? { ...p, comments: [...(p.comments || []), res.data.data] } : p
                ));
            }
        } catch (e) { console.error('Failed to add comment:', e); }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const res = await api.delete(`/posts/${postId}/comment/${commentId}`);
            if (res.data.success) {
                setPosts((prev) => prev.map((p) =>
                    p._id === postId ? { ...p, comments: p.comments.filter((c) => c._id !== commentId) } : p
                ));
            }
        } catch (e) { console.error('Failed to delete comment:', e); }
    };

    const handleDeletePost = async (postId) => {
        try {
            await api.delete(`/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p._id !== postId));
        } catch (e) { console.error('Failed to delete post:', e); }
    };

    // ── Filter + sort client-side (search + ranking) ──
    const visiblePosts = useMemo(() => {
        let list = posts;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((p) =>
                (p.description || '').toLowerCase().includes(q) ||
                (p.user?.name || '').toLowerCase().includes(q) ||
                (p.submission?.location?.name || '').toLowerCase().includes(q)
            );
        }
        if (sort === 'top') {
            list = [...list].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        } else if (sort === 'trend') {
            // simple trending = likes + 2*comments / age-hours+2
            list = [...list].sort((a, b) => {
                const score = (p) => {
                    const ageH = Math.max(2, (Date.now() - new Date(p.createdAt)) / 36e5);
                    return ((p.likes?.length || 0) + 2 * (p.comments?.length || 0)) / ageH;
                };
                return score(b) - score(a);
            });
        }
        return list;
    }, [posts, search, sort]);

    // ── Trending tags + top contributors derived from posts ──
    const trendingTags = useMemo(() => {
        const counts = new Map();
        posts.forEach((p) => (p.tags || []).forEach((t) => {
            const k = t?.name; if (!k) return;
            counts.set(k, (counts.get(k) || 0) + 1);
        }));
        return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    }, [posts]);

    const topContributors = useMemo(() => {
        const map = new Map();
        posts.forEach((p) => {
            if (!p.user?._id) return;
            const cur = map.get(p.user._id) || { user: p.user, posts: 0, kg: 0 };
            cur.posts += 1;
            cur.kg += p.submission?.weightKg || p.submission?.weight || 0;
            map.set(p.user._id, cur);
        });
        return [...map.values()].sort((a, b) => b.kg - a.kg).slice(0, 5);
    }, [posts]);

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>
            {/* Sticky top bar */}
            <div
                className="sticky top-0 z-30 backdrop-blur-md"
                style={{
                    background: 'rgba(249,245,255,0.85)',
                    borderBottom: '1px solid var(--border-light)',
                }}
            >
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
                    {/* Brand pill */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                            style={{ background: 'linear-gradient(135deg, #14248a 0%, #998fc7 100%)', boxShadow: 'var(--shadow-md)' }}
                        >
                            <FontAwesomeIcon icon={faSeedling} />
                        </div>
                        <div className="hidden sm:block leading-tight">
                            <p className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Community Feed</p>
                            <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: 'var(--text-tertiary)' }}>CivicSetu</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-md mx-auto">
                        <div className="relative">
                            <FontAwesomeIcon
                                icon={faMagnifyingGlass}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px]"
                                style={{ color: 'var(--text-tertiary)' }}
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search cleanups, citizens, places…"
                                className="w-full text-[13.5px] rounded-full focus:outline-none"
                                style={{
                                    paddingLeft: '2.5rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.55rem',
                                    paddingBottom: '0.55rem',
                                    background: '#fff',
                                    border: '1px solid var(--border-light)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Compose CTA */}
                    <button
                        onClick={() => navigate('/upload')}
                        className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[12.5px] font-semibold text-white transition-all hover:opacity-90"
                        style={{
                            background: 'linear-gradient(135deg, #14248a 0%, #998fc7 100%)',
                            boxShadow: 'var(--shadow-md)',
                        }}
                    >
                        <FontAwesomeIcon icon={faCamera} className="text-[12px]" />
                        New Cleanup
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center gap-1">
                        {TABS.map((t) => {
                            const active = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className="relative px-4 py-2.5 text-[13px] font-semibold tracking-tight"
                                    style={{ color: active ? 'var(--primary)' : 'var(--text-secondary)' }}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={t.icon} className="text-[12px]" />
                                        {t.label}
                                    </span>
                                    {active && (
                                        <motion.span
                                            layoutId="tabBar"
                                            className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full"
                                            style={{ background: 'var(--primary)' }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Body grid */}
            <div className="max-w-6xl mx-auto px-4 pt-5 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                    {/* ─── Left / center column ─── */}
                    <div className="max-w-2xl w-full mx-auto lg:mx-0">
                        {/* Composer prompt */}
                        {currentUser && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl p-4 mb-5 flex items-center gap-3"
                                style={{
                                    border: '1px solid var(--border-light)',
                                    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                                }}
                            >
                                <UserAvatar user={currentUser} size={44} />
                                <button
                                    onClick={() => navigate('/upload')}
                                    className="flex-1 text-left text-[14px] px-4 py-2.5 rounded-full transition-colors hover:bg-gray-100"
                                    style={{ background: 'var(--bg-body)', color: 'var(--text-tertiary)' }}
                                >
                                    What did you clean up today, {currentUser.name?.split(' ')[0] || 'friend'}?
                                </button>
                                <button
                                    onClick={() => navigate('/upload')}
                                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold"
                                    style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
                                >
                                    <FontAwesomeIcon icon={faImage} className="text-[11px]" />
                                    Photo
                                </button>
                            </motion.div>
                        )}

                        {/* Sort chips + refresh */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                {SORTS.map((s) => {
                                    const active = sort === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => setSort(s.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap"
                                            style={{
                                                background: active ? 'var(--primary)' : '#fff',
                                                color: active ? '#fff' : 'var(--text-secondary)',
                                                border: `1px solid ${active ? 'var(--primary)' : 'var(--border-light)'}`,
                                            }}
                                        >
                                            <FontAwesomeIcon icon={s.icon} className="text-[10.5px]" />
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                                style={{ color: 'var(--text-secondary)' }}
                                title="Refresh feed"
                            >
                                <FontAwesomeIcon
                                    icon={faRotateRight}
                                    className="text-[13px]"
                                    spin={refreshing}
                                />
                            </button>
                        </div>

                        {/* Posts */}
                        {loading && posts.length === 0 ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : visiblePosts.length > 0 ? (
                            <>
                                {visiblePosts.map((post) => (
                                    <FeedCard
                                        key={post._id}
                                        post={post}
                                        onLike={handleLike}
                                        onComment={handleComment}
                                        onDeleteComment={handleDeleteComment}
                                        onDeletePost={handleDeletePost}
                                    />
                                ))}

                                {hasMore && !search && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="w-full py-3 rounded-2xl text-[13.5px] font-semibold transition-colors hover:bg-gray-50"
                                        style={{ background: '#fff', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                                    >
                                        {loading ? (
                                            <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Loading…</>
                                        ) : 'Load more posts'}
                                    </button>
                                )}
                                {!hasMore && posts.length > 0 && (
                                    <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-tertiary)' }}>
                                        You're all caught up
                                    </p>
                                )}
                            </>
                        ) : (
                            <EmptyState onCompose={() => navigate('/upload')} mine={tab === 'mine'} hasSearch={!!search} />
                        )}
                    </div>

                    {/* ─── Right sidebar (desktop only) ─── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-[120px] space-y-5">
                            {/* Trending tags */}
                            <SidebarCard title="Trending Communities" icon={faHashtag}>
                                {trendingTags.length ? (
                                    <div className="space-y-2">
                                        {trendingTags.map(([name, count], i) => (
                                            <div key={name} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                                        style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
                                                    >
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                        #{name.replace(/\s+/g, '')}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                                    {count} {count === 1 ? 'post' : 'posts'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                                        No active hashtags yet. Tag a community on your next post.
                                    </p>
                                )}
                            </SidebarCard>

                            {/* Top cleaners */}
                            <SidebarCard title="Top Cleaners" icon={faTrophy}>
                                {topContributors.length ? (
                                    <div className="space-y-3">
                                        {topContributors.map((c, i) => (
                                            <div key={c.user._id} className="flex items-center gap-2.5">
                                                <span
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                                    style={{ background: i === 0 ? '#FEF3C7' : 'var(--primary-lighter)', color: i === 0 ? '#A16207' : 'var(--primary)' }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <UserAvatar user={c.user} size={36} />
                                                <div className="min-w-0 flex-1 leading-tight">
                                                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.user.name}</p>
                                                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{c.kg.toFixed(1)} kg · {c.posts} {c.posts === 1 ? 'post' : 'posts'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                                        Be the first to share a cleanup.
                                    </p>
                                )}
                            </SidebarCard>

                            {/* Footer note */}
                            <p className="text-[10.5px] leading-relaxed px-1" style={{ color: 'var(--text-tertiary)' }}>
                                CivicSetu · Built for cleaner streets and a stronger civic loop.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Mobile FAB */}
            <button
                onClick={() => navigate('/upload')}
                className="sm:hidden fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white"
                style={{
                    background: 'linear-gradient(135deg, #14248a 0%, #998fc7 100%)',
                    boxShadow: '0 12px 28px -6px rgba(20,36,138,0.45)',
                }}
                title="New cleanup"
            >
                <FontAwesomeIcon icon={faPlus} className="text-lg" />
            </button>

            {/* Scroll-top */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="fixed bottom-6 left-5 z-40 w-11 h-11 rounded-full flex items-center justify-center"
                        style={{
                            background: '#fff',
                            color: 'var(--primary)',
                            border: '1px solid var(--border-light)',
                            boxShadow: 'var(--shadow-lg)',
                        }}
                        title="Back to top"
                    >
                        <FontAwesomeIcon icon={faArrowUp} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

const SidebarCard = ({ title, icon, children }) => (
    <div
        className="bg-white rounded-2xl p-4"
        style={{ border: '1px solid var(--border-light)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
    >
        <div className="flex items-center gap-2 mb-3">
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
            >
                <FontAwesomeIcon icon={icon} className="text-[12px]" />
            </div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-secondary)' }}>
                {title}
            </h3>
        </div>
        {children}
    </div>
);

const EmptyState = ({ onCompose, mine, hasSearch }) => (
    <div
        className="bg-white rounded-2xl p-10 text-center"
        style={{ border: '1px dashed var(--border-medium)' }}
    >
        <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #14248a 0%, #998fc7 100%)' }}
        >
            <FontAwesomeIcon icon={hasSearch ? faMagnifyingGlass : faSeedling} className="text-2xl" />
        </div>
        <h3 className="text-lg font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            {hasSearch ? 'No matches' : mine ? 'You haven’t shared yet' : 'The feed is quiet'}
        </h3>
        <p className="text-[13px] mb-5 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            {hasSearch
                ? 'Try a different keyword, place, or person.'
                : mine
                    ? 'Share your first cleanup to inspire others — your story belongs on the public feed.'
                    : 'Be the first to share a cleanup and kickstart the community feed.'}
        </p>
        {!hasSearch && (
            <button
                onClick={onCompose}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #14248a 0%, #998fc7 100%)' }}
            >
                <FontAwesomeIcon icon={faCamera} />
                Share a cleanup
            </button>
        )}
    </div>
);

export default PublicFeed;
