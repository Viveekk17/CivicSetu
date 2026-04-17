import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart,
    faMapMarkerAlt,
    faTrash,
    faEllipsisH,
    faPaperPlane,
    faBookmark,
    faShareNodes,
    faCircleCheck,
    faRecycle,
    faCoins,
    faWeightHanging,
    faLeaf,
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
    faHeart as faHeartRegular,
    faBookmark as faBookmarkRegular,
    faComment as faCommentRegular,
} from '@fortawesome/free-regular-svg-icons';
import { getStoredUser } from '../services/authService';
import { avatarUrlFor, fallbackAvatarFor } from '../utils/avatar';

const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 5) return 'now';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;
    return `${Math.floor(days / 365)}y`;
};

const formatCount = (n) => {
    if (!n && n !== 0) return 0;
    if (n < 1000) return n;
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`;
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
};

const Avatar = ({ user, size = 40, ring = false }) => {
    const [src, setSrc] = useState(() => avatarUrlFor(user));
    return (
        <div
            className="relative rounded-full overflow-hidden shrink-0"
            style={{
                width: size,
                height: size,
                background: 'linear-gradient(135deg, #ebe3ff 0%, #d4c2fc 100%)',
                boxShadow: ring ? '0 0 0 2px #fff, 0 0 0 4px #14248a' : 'none',
            }}
        >
            <img
                src={src}
                alt={user?.name || 'Avatar'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
                onError={() => {
                    const fb = fallbackAvatarFor(user);
                    if (src !== fb) setSrc(fb);
                }}
            />
        </div>
    );
};

const ImpactPill = ({ icon, label, color, bg }) => (
    <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
        style={{ background: bg, color }}
    >
        <FontAwesomeIcon icon={icon} className="text-[10px]" />
        {label}
    </span>
);

const FeedCard = ({ post, onLike, onComment, onDeleteComment, onDeletePost }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showHeartBurst, setShowHeartBurst] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const lastTapRef = useRef(0);

    const currentUser = getStoredUser();
    const isLiked = post.likes?.includes(currentUser?._id);
    const likeCount = post.likes?.length || 0;
    const commentCount = post.comments?.length || 0;
    const isOwner = currentUser?._id === post.user?._id;
    const canDelete = currentUser?.role === 'admin' || isOwner;

    // ── Photos with labels (selectedPhotos: 'before' | 'after') ──
    const photos = [];
    const labels = [];
    const submissionPhotos = post.submission?.photos || [];
    if (post.selectedPhotos?.includes('before') && submissionPhotos[0]) {
        photos.push(submissionPhotos[0]); labels.push('BEFORE');
    }
    if (post.selectedPhotos?.includes('after') && submissionPhotos[1]) {
        photos.push(submissionPhotos[1]); labels.push('AFTER');
    }
    if (!photos.length && submissionPhotos.length) {
        photos.push(...submissionPhotos.slice(0, 2));
        labels.push('BEFORE', 'AFTER');
    }

    // ── Impact data ──
    const sub = post.submission || {};
    const kg = sub.weightKg || sub.weight || 0;
    const credits = sub.perPersonCreditsAwarded || sub.creditsAwarded || 0;
    const wasteType = sub.wasteType || sub.type || '';
    const co2 = sub.verificationDetails?.co2Saved || 0;
    const tags = post.tags || [];

    const description = post.description || '';
    const isLong = description.length > 220;
    const displayDesc = expanded || !isLong ? description : `${description.slice(0, 220)}…`;

    // ── Handlers ──
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        await onComment(post._id, commentText.trim());
        setCommentText('');
        setSubmittingComment(false);
    };

    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            if (!isLiked) onLike(post._id);
            setShowHeartBurst(true);
            setTimeout(() => setShowHeartBurst(false), 700);
        }
        lastTapRef.current = now;
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/feed?post=${post._id}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${post.user?.name || 'Citizen'} on CivicSetu`,
                    text: description.slice(0, 140),
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                window.dispatchEvent(new CustomEvent('newNotification', {
                    detail: { type: 'success', title: 'Link copied', message: 'Post link copied to clipboard.' },
                }));
            }
        } catch { /* user cancelled */ }
    };

    const next = () => setCurrentIndex((i) => (i + 1) % photos.length);
    const prev = () => setCurrentIndex((i) => (i === 0 ? photos.length - 1 : i - 1));

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl border overflow-hidden mb-5"
            style={{
                borderColor: 'var(--border-light)',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)',
            }}
        >
            {/* ─── Header ─── */}
            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                <Avatar user={post.user} size={42} />
                <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--text-primary)' }}>
                            {post.user?.name || 'Anonymous'}
                        </p>
                        {credits > 0 && (
                            <FontAwesomeIcon
                                icon={faCircleCheck}
                                className="text-[12px]"
                                style={{ color: 'var(--primary)' }}
                                title="Verified cleanup"
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {sub.location?.name && (
                            <>
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[9px]" style={{ color: 'var(--secondary)' }} />
                                <span className="truncate max-w-[140px]">{sub.location.name}</span>
                                <span>·</span>
                            </>
                        )}
                        <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <FontAwesomeIcon icon={faEllipsisH} />
                    </button>
                    <AnimatePresence>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    className="absolute right-0 top-10 z-50 w-44 rounded-xl bg-white py-1.5"
                                    style={{ border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}
                                >
                                    <button
                                        onClick={() => { handleShare(); setMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        <FontAwesomeIcon icon={faShareNodes} className="text-[12px]" /> Copy link
                                    </button>
                                    {canDelete && onDeletePost && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this post?')) onDeletePost(post._id);
                                                setMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2"
                                            style={{ color: '#dc2626' }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="text-[12px]" /> Delete post
                                        </button>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ─── Media (swipe-enabled carousel) ─── */}
            {photos.length > 0 && (
                <SwipeCarousel
                    photos={photos}
                    labels={labels}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    onDoubleTap={handleDoubleTap}
                    showHeartBurst={showHeartBurst}
                    onPrev={prev}
                    onNext={next}
                />
            )}

            {/* ─── Action Bar ─── */}
            <div className="px-3 pt-3 pb-1 flex items-center gap-1">
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => onLike(post._id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50"
                    title={isLiked ? 'Unlike' : 'Like'}
                >
                    <FontAwesomeIcon
                        icon={isLiked ? faHeart : faHeartRegular}
                        className="text-[20px]"
                        style={{ color: isLiked ? '#ef4444' : 'var(--text-primary)' }}
                    />
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setShowComments((v) => !v)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50"
                    title="Comment"
                >
                    <FontAwesomeIcon icon={faCommentRegular} className="text-[20px]" style={{ color: 'var(--text-primary)' }} />
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50"
                    title="Share"
                >
                    <FontAwesomeIcon icon={faPaperPlane} className="text-[18px]" style={{ color: 'var(--text-primary)' }} />
                </motion.button>
                <div className="flex-1" />
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setSaved((v) => !v)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50"
                    title={saved ? 'Unsave' : 'Save'}
                >
                    <FontAwesomeIcon
                        icon={saved ? faBookmark : faBookmarkRegular}
                        className="text-[19px]"
                        style={{ color: saved ? 'var(--primary)' : 'var(--text-primary)' }}
                    />
                </motion.button>
            </div>

            {/* ─── Like count ─── */}
            {likeCount > 0 && (
                <div className="px-4 pb-1">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
                    </p>
                </div>
            )}

            {/* ─── Description ─── */}
            {description && (
                <div className="px-4 pt-1 pb-2">
                    <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        <span className="font-semibold mr-1.5">{post.user?.name}</span>
                        {displayDesc}
                        {isLong && !expanded && (
                            <button
                                onClick={() => setExpanded(true)}
                                className="ml-1 text-[13px] font-medium"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                more
                            </button>
                        )}
                    </p>
                </div>
            )}

            {/* ─── Impact pills ─── */}
            {(kg > 0 || credits > 0 || co2 > 0 || wasteType) && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {kg > 0 && (
                        <ImpactPill icon={faWeightHanging} label={`${kg} kg cleaned`} color="#0E7490" bg="rgba(14,165,233,0.10)" />
                    )}
                    {wasteType && (
                        <ImpactPill icon={faRecycle} label={wasteType} color="#15803D" bg="rgba(34,197,94,0.10)" />
                    )}
                    {credits > 0 && (
                        <ImpactPill icon={faCoins} label={`+${credits} credits`} color="#A16207" bg="rgba(234,179,8,0.12)" />
                    )}
                    {co2 > 0 && (
                        <ImpactPill icon={faLeaf} label={`${Number(co2).toFixed(1)} kg CO₂`} color="#15803D" bg="rgba(34,197,94,0.10)" />
                    )}
                </div>
            )}

            {/* ─── Community tags ─── */}
            {tags.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1">
                    {tags.map((t) => (
                        <span key={t._id} className="text-[12px] font-medium" style={{ color: 'var(--primary)' }}>
                            #{(t.name || '').replace(/\s+/g, '')}
                        </span>
                    ))}
                </div>
            )}

            {/* ─── Comments preview / toggle ─── */}
            {commentCount > 0 && !showComments && (
                <div className="px-4 pb-3">
                    <button
                        onClick={() => setShowComments(true)}
                        className="text-[13px] hover:underline"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                    </button>
                    {post.comments?.[0] && (
                        <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-primary)' }}>
                            <span className="font-semibold mr-1.5">{post.comments[0].user?.name}</span>
                            <span className="line-clamp-1">{post.comments[0].text}</span>
                        </p>
                    )}
                </div>
            )}

            {/* ─── Full comments panel ─── */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                        style={{ borderTop: '1px solid var(--border-light)' }}
                    >
                        <div className="px-4 py-3" style={{ background: '#FAFAFB' }}>
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {post.comments?.length ? (
                                    post.comments.map((c) => (
                                        <div key={c._id} className="flex gap-2.5">
                                            <Avatar user={c.user} size={30} />
                                            <div className="flex-1 min-w-0">
                                                <div className="rounded-2xl px-3 py-2" style={{ background: '#fff', border: '1px solid var(--border-light)' }}>
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <p className="text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                            {c.user?.name}
                                                        </p>
                                                        {(currentUser?._id === c.user?._id || isOwner) && (
                                                            <button
                                                                onClick={() => onDeleteComment(post._id, c._id)}
                                                                className="text-[11px]"
                                                                style={{ color: 'var(--text-tertiary)' }}
                                                                title="Delete comment"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-[13px] leading-snug" style={{ color: 'var(--text-primary)' }}>{c.text}</p>
                                                </div>
                                                <p className="text-[10.5px] mt-1 ml-1" style={{ color: 'var(--text-tertiary)' }}>
                                                    {formatTimeAgo(c.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[13px] text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                                        No comments yet — start the conversation.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Add comment */}
                        {currentUser && (
                            <form
                                onSubmit={handleCommentSubmit}
                                className="flex items-center gap-2 px-4 py-2.5"
                                style={{ borderTop: '1px solid var(--border-light)' }}
                            >
                                <Avatar user={currentUser} size={28} />
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment…"
                                    maxLength={500}
                                    className="flex-1 px-3 py-2 text-[13.5px] bg-transparent focus:outline-none"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!commentText.trim() || submittingComment}
                                    className="text-[13px] font-bold tracking-tight transition-opacity disabled:opacity-40"
                                    style={{ color: 'var(--primary)' }}
                                >
                                    {submittingComment ? '…' : 'Post'}
                                </button>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// Swipeable carousel (touch + mouse drag, snaps to nearest slide).
// Side-by-side track translated by index; framer-motion handles the drag.
// ────────────────────────────────────────────────────────────────────────────
const SwipeCarousel = ({
    photos, labels, currentIndex, setCurrentIndex,
    onDoubleTap, showHeartBurst, onPrev, onNext,
}) => {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(0);
    const lastTapRef = useRef(0);

    React.useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const update = () => setWidth(el.clientWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const SWIPE_THRESHOLD = 60;       // px
    const VELOCITY_THRESHOLD = 400;   // px/s

    const handleDragEnd = (_event, info) => {
        const { offset, velocity } = info;
        const goNext = offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD;
        const goPrev = offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD;
        if (goNext && currentIndex < photos.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (goPrev && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Tap → handle double-tap-to-like without consuming drag intent
    const handleTap = () => {
        const now = Date.now();
        if (now - lastTapRef.current < 280) onDoubleTap();
        lastTapRef.current = now;
    };

    return (
        <div ref={containerRef} className="relative bg-black overflow-hidden group select-none"
             style={{ touchAction: 'pan-y' }}>
            <div className="relative" style={{ aspectRatio: '4/5', maxHeight: 600 }}>
                {width > 0 && (
                    <motion.div
                        className="absolute inset-0 flex"
                        drag={photos.length > 1 ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.18}
                        dragMomentum={false}
                        animate={{ x: -currentIndex * width }}
                        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                        onDragEnd={handleDragEnd}
                        onTap={handleTap}
                        style={{ width: photos.length * width }}
                    >
                        {photos.map((src, i) => (
                            <div
                                key={i}
                                className="h-full flex items-center justify-center bg-black"
                                style={{ width }}
                            >
                                <img
                                    src={src}
                                    alt={labels[i]}
                                    className="w-full h-full object-cover pointer-events-none"
                                    draggable={false}
                                />
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Top badges (above track, ignore pointer) */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.12em] backdrop-blur-md"
                        style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                        {labels[currentIndex]}
                    </span>
                    {photos.length > 1 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md tabular-nums"
                            style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                            {currentIndex + 1}/{photos.length}
                        </span>
                    )}
                </div>

                {/* Hover arrows (desktop fallback) */}
                {photos.length > 1 && currentIndex > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hidden md:flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 z-10"
                        style={{ background: 'rgba(255,255,255,0.92)', color: '#111' }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                    </button>
                )}
                {photos.length > 1 && currentIndex < photos.length - 1 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hidden md:flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 z-10"
                        style={{ background: 'rgba(255,255,255,0.92)', color: '#111' }}
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </button>
                )}

                {/* Dot indicators */}
                {photos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                        {photos.map((_, i) => (
                            <span key={i}
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                    width: i === currentIndex ? 18 : 6,
                                    background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.55)',
                                }} />
                        ))}
                    </div>
                )}

                {/* Heart burst */}
                <AnimatePresence>
                    {showHeartBurst && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                        >
                            <FontAwesomeIcon icon={faHeart} className="text-7xl"
                                style={{ color: 'rgba(255,255,255,0.95)', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FeedCard;
