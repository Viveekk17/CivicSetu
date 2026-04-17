import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck, faTimes, faEye, faRotate,
    faImage, faMapMarkerAlt, faWeightHanging, faCalendar,
    faCoins, faUser, faTriangleExclamation, faClock,
    faCircleCheck, faCircleXmark, faSpinner, faRecycle,
    faComments, faTags, faUsers, faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CHIP = {
    open:          { cls: 'a-chip-warning', icon: faClock,        label: 'Open' },
    'in-progress': { cls: 'a-chip-info',    icon: faSpinner,      label: 'In Progress' },
    resolved:      { cls: 'a-chip-success', icon: faCircleCheck,  label: 'Resolved' },
    closed:        { cls: 'a-chip-neutral', icon: faCircleXmark,  label: 'Closed' },
    escalated:     { cls: 'a-chip-danger',  icon: faTriangleExclamation, label: 'Escalated' },
};

const PRIORITY_CHIP = {
    urgent: 'a-chip-danger',
    high:   'a-chip-warning',
    medium: 'a-chip-neutral',
    low:    'a-chip-neutral',
};

const photoUrl = (p) => {
    if (!p) return null;
    return p.startsWith('http') ? p : `http://localhost:5000${p}`;
};

const AdminRequests = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [editCredits, setEditCredits] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null); // { kind, message }

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/all-tickets?status=${filterStatus}&type=${filterCategory}`);
            if (res?.success) setTickets(Array.isArray(res.data) ? res.data : []);
            else setTickets([]);
        } catch (err) {
            console.error('Failed to load tickets', err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, [filterStatus, filterCategory]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tickets;
        return tickets.filter(t =>
            (t.ticketId || '').toLowerCase().includes(q) ||
            (t.user || '').toLowerCase().includes(q) ||
            (t.userEmail || '').toLowerCase().includes(q) ||
            (t.issueType || '').toLowerCase().includes(q)
        );
    }, [tickets, search]);

    const counts = useMemo(() => ({
        total:    tickets.length,
        open:     tickets.filter(t => t.status === 'open').length,
        progress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed:   tickets.filter(t => t.status === 'closed').length,
    }), [tickets]);

    const openTicket = (t) => {
        setSelected(t);
        setEditCredits(
            t.verificationDetails?.suggestedCredits ??
            t.creditsAwarded ??
            0
        );
        setAdminNotes(t.verificationDetails?.notes ?? '');
        setToast(null);
    };

    const closeTicket = () => {
        setSelected(null);
        setEditCredits('');
        setAdminNotes('');
        setToast(null);
    };

    // Submission action — verified or rejected (Phase 1 uses 'approved' verb on backend)
    const handleSubmissionAction = async (action) => {
        if (!selected) return;
        setActionLoading(true);
        setToast(null);
        try {
            await api.put(`/admin/submissions/${selected._id}`, {
                status: action, // 'approved' | 'verified' | 'rejected'
                points: action === 'rejected' ? 0 : (parseInt(editCredits) || 0),
                notes: adminNotes,
            });
            setToast({
                kind: 'success',
                message: action === 'rejected'
                    ? 'Submission rejected and citizen notified.'
                    : `Submission ${action} — ${selected.user} notified.`,
            });
            await fetchTickets();
            setTimeout(closeTicket, 1500);
        } catch (err) {
            setToast({ kind: 'error', message: err?.message || 'Failed to update submission.' });
        } finally {
            setActionLoading(false);
        }
    };

    // Report action — open/in-progress/resolved/closed
    const handleReportAction = async (newStatus) => {
        if (!selected) return;
        setActionLoading(true);
        setToast(null);
        try {
            await api.put(`/admin/reports/${selected._id}`, { status: newStatus });
            setToast({ kind: 'success', message: `Ticket marked ${STATUS_CHIP[newStatus]?.label.toLowerCase() || newStatus}.` });
            await fetchTickets();
            setTimeout(closeTicket, 1200);
        } catch (err) {
            setToast({ kind: 'error', message: err?.message || 'Failed to update ticket.' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <p className="a-eyebrow mb-1">Operations</p>
                    <h1 className="a-page-title">Helpdesk Tickets</h1>
                    <p className="a-page-sub">
                        Unified queue for citizen submissions and complaint reports.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchTickets} className="a-btn a-btn-ghost">
                        <FontAwesomeIcon icon={faRotate} className="text-xs" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatTile label="Total" value={counts.total}    tone="accent" />
                <StatTile label="Open"  value={counts.open}     tone="warning" />
                <StatTile label="In Progress" value={counts.progress} tone="info" />
                <StatTile label="Resolved" value={counts.resolved} tone="success" />
                <StatTile label="Closed" value={counts.closed}    tone="neutral" />
            </div>

            {/* Filters */}
            <div className="a-card a-card-pad">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Category tabs */}
                    <div className="flex items-center gap-1 p-1 rounded-xl"
                         style={{ background: 'var(--a-surface-2)' }}>
                        {[
                            { key: 'all',       label: 'All',        icon: faComments },
                            { key: 'cleanup',   label: 'Cleanups',   icon: faRecycle },
                            { key: 'complaint', label: 'Complaints', icon: faTriangleExclamation },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setFilterCategory(opt.key)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                style={{
                                    background: filterCategory === opt.key ? 'var(--a-surface)' : 'transparent',
                                    color: filterCategory === opt.key ? 'var(--a-text-1)' : 'var(--a-text-2)',
                                    boxShadow: filterCategory === opt.key ? 'var(--a-shadow-sm)' : 'none',
                                }}
                            >
                                <FontAwesomeIcon icon={opt.icon} className="text-[10px]" />
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Status select */}
                    <select
                        className="a-select w-full lg:w-48"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All statuses</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by ticket ID, citizen, type"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="a-input flex-1"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="a-card a-card-flush">
                {loading ? (
                    <div className="p-16 text-center" style={{ color: 'var(--a-text-3)' }}>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl mb-3" />
                        <p className="text-sm">Loading tickets…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center" style={{ color: 'var(--a-text-3)' }}>
                        <FontAwesomeIcon icon={faComments} className="text-2xl mb-3" />
                        <p className="text-sm font-medium">No tickets found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="a-table">
                            <thead>
                                <tr>
                                    <th>Ticket</th>
                                    <th>Citizen</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Priority</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((t) => {
                                    const statusCfg = STATUS_CHIP[t.status] || STATUS_CHIP.open;
                                    return (
                                        <tr
                                            key={`${t.rawType}-${t.id}`}
                                            onClick={() => openTicket(t)}
                                            className="cursor-pointer"
                                        >
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="font-mono text-xs font-bold"
                                                        style={{ color: 'var(--a-accent)' }}
                                                    >
                                                        {t.ticketId || `TKT-${String(t.id).slice(-6)}`}
                                                    </span>
                                                    {t.rawType === 'Submission' && t.photos?.length > 0 && (
                                                        <span
                                                            className="a-chip a-chip-neutral"
                                                            style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}
                                                            title={`${t.photos.length} photo(s)`}
                                                        >
                                                            <FontAwesomeIcon icon={faImage} className="text-[8px]" />
                                                            {t.photos.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="a-avatar" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>
                                                        {(t.user || 'A').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="leading-tight min-w-0">
                                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--a-text-1)' }}>
                                                            {t.user}
                                                        </p>
                                                        <p className="text-[11px] truncate max-w-[180px]" style={{ color: 'var(--a-text-3)' }}>
                                                            {t.userEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`a-chip ${t.category === 'cleanup' ? 'a-chip-success' : 'a-chip-info'}`}>
                                                    <FontAwesomeIcon
                                                        icon={t.category === 'cleanup' ? faRecycle : faTriangleExclamation}
                                                        className="text-[8px]"
                                                    />
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-sm capitalize" style={{ color: 'var(--a-text-2)' }}>
                                                    {(t.issueType || '').replace(/_/g, ' ') || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`a-chip ${PRIORITY_CHIP[t.priority] || 'a-chip-neutral'}`}>
                                                    {t.priority || 'medium'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-sm tabular-nums" style={{ color: 'var(--a-text-2)' }}>
                                                    {new Date(t.date).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`a-chip ${statusCfg.cls}`}>
                                                    <FontAwesomeIcon icon={statusCfg.icon} className="text-[8px]" />
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openTicket(t); }}
                                                    className="a-btn a-btn-ghost a-btn-sm"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                                    Open
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

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: 'rgba(11,18,32,0.85)' }}
                        onClick={() => setLightbox(null)}
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white"
                            style={{ background: 'rgba(255,255,255,0.12)' }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <motion.img
                            src={lightbox}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            alt=""
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <AnimatePresence>
                {selected && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ background: 'rgba(11,18,32,0.55)' }}
                        onClick={closeTicket}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="a-card a-card-flush w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
                            style={{ boxShadow: 'var(--a-shadow-lg)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ModalHeader ticket={selected} onClose={closeTicket} />

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {toast && (
                                    <div
                                        className="px-4 py-3 rounded-xl text-sm font-medium border"
                                        style={{
                                            background: toast.kind === 'success' ? 'var(--a-success-soft)' : 'var(--a-danger-soft)',
                                            color: toast.kind === 'success' ? '#047857' : '#B91C1C',
                                            borderColor: toast.kind === 'success' ? '#A7F3D0' : '#FECACA',
                                        }}
                                    >
                                        {toast.message}
                                    </div>
                                )}

                                {selected.rawType === 'Submission'
                                    ? <SubmissionBody
                                        ticket={selected}
                                        editCredits={editCredits}
                                        setEditCredits={setEditCredits}
                                        adminNotes={adminNotes}
                                        setAdminNotes={setAdminNotes}
                                        onLightbox={setLightbox}
                                      />
                                    : <ReportBody ticket={selected} onLightbox={setLightbox} />}
                            </div>

                            <ModalFooter
                                ticket={selected}
                                actionLoading={actionLoading}
                                editCredits={editCredits}
                                onSubmissionAction={handleSubmissionAction}
                                onReportAction={handleReportAction}
                                onClose={closeTicket}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─────────── Helpers ─────────── */

const TONE = {
    accent:  { bg: 'var(--a-accent-soft)',  fg: 'var(--a-accent)' },
    success: { bg: 'var(--a-success-soft)', fg: '#047857' },
    warning: { bg: 'var(--a-warning-soft)', fg: '#B45309' },
    info:    { bg: 'var(--a-info-soft)',    fg: '#0369A1' },
    danger:  { bg: 'var(--a-danger-soft)',  fg: '#B91C1C' },
    neutral: { bg: 'var(--a-surface-2)',    fg: 'var(--a-text-2)' },
};

const StatTile = ({ label, value, tone = 'neutral' }) => {
    const t = TONE[tone];
    return (
        <div className="a-card a-card-pad" style={{ padding: '14px 18px' }}>
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--a-text-3)' }}>
                    {label}
                </p>
                <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: t.fg }}
                />
            </div>
            <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--a-text-1)' }}>
                {value}
            </p>
        </div>
    );
};

const ModalHeader = ({ ticket, onClose }) => {
    const statusCfg = STATUS_CHIP[ticket.status] || STATUS_CHIP.open;
    return (
        <div
            className="px-6 py-4 flex items-start justify-between"
            style={{ borderBottom: '1px solid var(--a-border)', background: 'var(--a-surface)' }}
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`a-chip ${ticket.category === 'cleanup' ? 'a-chip-success' : 'a-chip-info'}`}>
                        <FontAwesomeIcon
                            icon={ticket.category === 'cleanup' ? faRecycle : faTriangleExclamation}
                            className="text-[8px]"
                        />
                        {ticket.category}
                    </span>
                    <span className={`a-chip ${statusCfg.cls}`}>
                        <FontAwesomeIcon icon={statusCfg.icon} className="text-[8px]" />
                        {statusCfg.label}
                    </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--a-text-1)' }}>
                    {ticket.ticketId || `TKT-${String(ticket.id).slice(-6)}`}
                </h3>
                <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--a-text-3)' }}>
                    {ticket._id || ticket.id}
                </p>
            </div>
            <button onClick={onClose} className="a-btn a-btn-ghost a-btn-icon" aria-label="Close">
                <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>
    );
};

const SectionTitle = ({ icon, children }) => (
    <h4
        className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3 flex items-center gap-2"
        style={{ color: 'var(--a-text-3)' }}
    >
        {icon && <FontAwesomeIcon icon={icon} className="text-[10px]" />}
        {children}
    </h4>
);

const InfoTile = ({ icon, label, value, tone = 'neutral' }) => {
    const t = TONE[tone];
    return (
        <div className="rounded-xl p-3" style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: 'var(--a-text-3)' }}>
                {icon && <FontAwesomeIcon icon={icon} className="text-[9px]" />}
                {label}
            </p>
            <p className="text-sm font-semibold" style={{ color: tone !== 'neutral' ? t.fg : 'var(--a-text-1)' }}>
                {value || '—'}
            </p>
        </div>
    );
};

/* ─────────── Submission body ─────────── */

const SubmissionBody = ({ ticket, editCredits, setEditCredits, adminNotes, setAdminNotes, onLightbox }) => {
    const before = photoUrl(ticket.photos?.[0]);
    const after  = photoUrl(ticket.photos?.[1]);
    const reverif = photoUrl(ticket.reverificationPhoto);
    const taggedUsers = ticket.participantIds?.length
        ? ticket.participantIds
        : (ticket.verificationDetails?.taggedUsers || []);
    const taggedComms = ticket.verificationDetails?.taggedCommunities || [];
    const aiCredits   = ticket.verificationDetails?.suggestedCredits ?? ticket.creditsAwarded ?? 0;
    const participantCount = ticket.participantCount || (taggedUsers.length + 1);

    return (
        <>
            {/* Citizen */}
            <div className="flex items-center gap-3 p-4 rounded-xl"
                 style={{ background: 'var(--a-accent-soft)', border: '1px solid #C7D2FE' }}>
                <div className="a-avatar" style={{ width: 44, height: 44 }}>
                    {(ticket.user || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-bold" style={{ color: 'var(--a-text-1)' }}>{ticket.user}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--a-text-2)' }}>{ticket.userEmail}</p>
                </div>
            </div>

            {/* Photos */}
            <div>
                <SectionTitle icon={faImage}>Before & After Photos</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                    <PhotoSlot label="BEFORE" tone="warning" url={before} onClick={() => before && onLightbox(before)} />
                    <PhotoSlot label="AFTER"  tone="success" url={after}  onClick={() => after  && onLightbox(after)} />
                </div>
                {reverif && (
                    <div className="mt-3">
                        <PhotoSlot label="CLEAN-SITE PROOF (PHASE 2)" tone="info" url={reverif} onClick={() => onLightbox(reverif)} fullWidth />
                    </div>
                )}
                {!before && !after && (
                    <p className="text-xs text-center mt-2" style={{ color: 'var(--a-text-3)' }}>
                        No photos uploaded with this submission.
                    </p>
                )}
            </div>

            {/* Details grid */}
            <div>
                <SectionTitle>Submission Details</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    <InfoTile
                        icon={faRecycle}
                        label="Type"
                        value={(ticket.type || '—').replace(/_/g, ' ')}
                    />
                    <InfoTile
                        icon={faWeightHanging}
                        label="Weight"
                        value={ticket.weightKg || ticket.weight ? `${ticket.weightKg || ticket.weight} kg` : '—'}
                    />
                    <InfoTile
                        icon={faCalendar}
                        label="Submitted"
                        value={new Date(ticket.createdAt).toLocaleDateString()}
                    />
                    <InfoTile
                        icon={faTags}
                        label="Mode"
                        value={ticket.verificationDetails?.taggingMode || ticket.submissionType || 'Solo'}
                    />
                    <InfoTile
                        icon={faCoins}
                        label="Credits Awarded"
                        value={ticket.creditsAwarded || 0}
                        tone={ticket.creditsAwarded ? 'success' : 'neutral'}
                    />
                    <InfoTile
                        icon={faSpinner}
                        label="Stage"
                        value={ticket.rawStatus === 'pending'  ? 'Awaiting Review'
                             : ticket.rawStatus === 'verified' ? 'Verified'
                             : ticket.rawStatus === 'rejected' ? 'Rejected'
                             : 'In Progress'}
                    />
                    {ticket.location?.name && (
                        <div className="rounded-xl p-3 col-span-2 md:col-span-3"
                             style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"
                               style={{ color: 'var(--a-text-3)' }}>
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[9px]" />
                                Location
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--a-text-1)' }}>
                                {ticket.location.name}
                            </p>
                            {ticket.location.coordinates && (
                                <p className="text-xs tabular-nums" style={{ color: 'var(--a-text-3)' }}>
                                    {ticket.location.coordinates.lat?.toFixed(5)}, {ticket.location.coordinates.lng?.toFixed(5)}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tagged */}
            {(taggedUsers.length > 0 || taggedComms.length > 0) && (
                <div>
                    <SectionTitle icon={faUsers}>
                        Tagged Participants
                        {taggedUsers.length > 0 && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider"
                                  style={{ color: 'var(--a-accent)' }}>
                                · {participantCount} will be paid
                            </span>
                        )}
                    </SectionTitle>
                    <div className="flex flex-wrap gap-1.5">
                        {taggedUsers.map(u => (
                            <span key={u._id} className="a-chip a-chip-accent">
                                <FontAwesomeIcon icon={faUser} className="text-[8px]" />
                                {u.name || u.username}
                            </span>
                        ))}
                        {taggedComms.map(c => (
                            <span key={c._id} className="a-chip a-chip-success">
                                <FontAwesomeIcon icon={faUsers} className="text-[8px]" />
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Description */}
            {ticket.description && (
                <div>
                    <SectionTitle>AI Analysis Description</SectionTitle>
                    <div className="rounded-xl p-4 text-sm leading-relaxed"
                         style={{ background: 'var(--a-info-soft)', color: '#075985', border: '1px solid #BAE6FD' }}>
                        {ticket.description}
                    </div>
                </div>
            )}

            {/* Credits editor */}
            <div className="rounded-xl p-4"
                 style={{ background: 'var(--a-warning-soft)', border: '1px solid #FDE68A' }}>
                <SectionTitle icon={faCoins}>
                    <span style={{ color: '#B45309' }}>Credits Allocation</span>
                </SectionTitle>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#B45309' }}>
                    Credits per person (AI suggested: {aiCredits})
                    {participantCount > 1 && (
                        <span className="ml-1 font-semibold">
                            · {participantCount} participants will each receive {editCredits || 0} credits
                            (total {(parseInt(editCredits) || 0) * participantCount})
                        </span>
                    )}
                </label>
                <input
                    type="number"
                    min="0"
                    value={editCredits}
                    onChange={(e) => setEditCredits(e.target.value)}
                    className="a-input"
                    style={{ borderColor: '#FCD34D', background: '#FFFFFF', fontWeight: 700 }}
                    placeholder="Enter credits to award"
                />
            </div>

            {/* Admin notes */}
            <div>
                <SectionTitle>Admin Notes / Remarks</SectionTitle>
                <textarea
                    rows="3"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="a-textarea resize-none"
                    placeholder="Add an internal note or rejection reason"
                />
            </div>

            {/* Verification history */}
            {ticket.verificationDetails?.verifiedBy && (
                <div className="rounded-xl p-4 text-sm"
                     style={{ background: 'var(--a-surface-2)', border: '1px solid var(--a-border)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--a-text-3)' }}>
                        Verification History
                    </p>
                    <p style={{ color: 'var(--a-text-2)' }}>
                        Verified by: <strong style={{ color: 'var(--a-text-1)' }}>{ticket.verificationDetails.verifiedBy}</strong>
                    </p>
                    {ticket.verificationDetails.verifiedAt && (
                        <p style={{ color: 'var(--a-text-2)' }}>
                            At: <strong style={{ color: 'var(--a-text-1)' }}>{new Date(ticket.verificationDetails.verifiedAt).toLocaleString()}</strong>
                        </p>
                    )}
                    {ticket.verificationDetails.notes && (
                        <p className="mt-1" style={{ color: 'var(--a-text-2)' }}>
                            Notes: <em>{ticket.verificationDetails.notes}</em>
                        </p>
                    )}
                </div>
            )}
        </>
    );
};

const PhotoSlot = ({ label, tone, url, onClick, fullWidth }) => {
    const t = TONE[tone];
    return (
        <div className={`relative ${fullWidth ? '' : ''}`}>
            <span
                className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider text-white"
                style={{ background: t.fg }}
            >
                {label}
            </span>
            {url ? (
                <img
                    src={url}
                    alt={label}
                    onClick={onClick}
                    className="w-full h-52 object-cover rounded-xl cursor-pointer transition-transform hover:scale-[1.01]"
                    style={{ border: `2px solid ${t.fg}` }}
                />
            ) : (
                <div
                    className="w-full h-52 rounded-xl flex items-center justify-center"
                    style={{
                        background: 'var(--a-surface-2)',
                        border: `2px dashed ${t.fg}`,
                        color: 'var(--a-text-3)',
                    }}
                >
                    <div className="text-center">
                        <FontAwesomeIcon icon={faImage} className="text-2xl mb-1.5" />
                        <p className="text-xs">No image</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────── Report body ─────────── */

const ReportBody = ({ ticket, onLightbox }) => {
    const img = photoUrl(ticket.image);
    return (
        <>
            <div className="flex items-center gap-3 p-4 rounded-xl"
                 style={{ background: 'var(--a-info-soft)', border: '1px solid #BAE6FD' }}>
                <div className="a-avatar" style={{ width: 44, height: 44, background: '#BAE6FD', color: '#0369A1' }}>
                    {(ticket.user || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-bold" style={{ color: 'var(--a-text-1)' }}>{ticket.user}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--a-text-2)' }}>{ticket.userEmail}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                <InfoTile icon={faTriangleExclamation} label="Issue Type"
                          value={(ticket.issueType || '—').replace(/_/g, ' ')} />
                <InfoTile label="Priority" value={ticket.priority || 'medium'} />
                <InfoTile icon={faCalendar} label="Reported"
                          value={new Date(ticket.createdAt).toLocaleDateString()} />
            </div>

            <div>
                <SectionTitle icon={faComments}>Description</SectionTitle>
                <div className="rounded-xl p-4 text-sm leading-relaxed"
                     style={{ background: 'var(--a-surface-2)', color: 'var(--a-text-1)', border: '1px solid var(--a-border)' }}>
                    {ticket.message || 'No description provided.'}
                </div>
            </div>

            {img && (
                <div>
                    <SectionTitle icon={faImage}>Evidence</SectionTitle>
                    <img
                        src={img}
                        alt="Evidence"
                        onClick={() => onLightbox(img)}
                        className="w-full h-64 object-cover rounded-xl cursor-pointer"
                        style={{ border: '1px solid var(--a-border)' }}
                    />
                </div>
            )}
        </>
    );
};

/* ─────────── Modal footer ─────────── */

const ModalFooter = ({ ticket, actionLoading, editCredits, onSubmissionAction, onReportAction, onClose }) => {
    if (ticket.rawType === 'Submission') {
        // Pending submissions get a single approve/reject decision (full credits awarded immediately).
        if (ticket.rawStatus === 'pending') {
            return (
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3"
                     style={{ borderTop: '1px solid var(--a-border)', background: 'var(--a-surface-2)' }}>
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--a-text-2)' }}>
                        <FontAwesomeIcon icon={faPaperPlane} className="text-[10px]" />
                        Citizen will be notified and credits awarded immediately
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={actionLoading}
                            onClick={() => onSubmissionAction('rejected')}
                            className="a-btn a-btn-ghost"
                            style={{ color: 'var(--a-danger)', borderColor: '#FECACA' }}
                        >
                            <FontAwesomeIcon icon={actionLoading ? faSpinner : faTimes}
                                             className={actionLoading ? 'animate-spin text-xs' : 'text-xs'} />
                            Reject
                        </button>
                        <button
                            disabled={actionLoading}
                            onClick={() => onSubmissionAction('verified')}
                            className="a-btn a-btn-success"
                        >
                            <FontAwesomeIcon icon={actionLoading ? faSpinner : faCheck}
                                             className={actionLoading ? 'animate-spin text-xs' : 'text-xs'} />
                            Approve & Award {editCredits || 0} Credits
                        </button>
                    </div>
                </div>
            );
        }
        // Already verified/rejected
        const isVerified = ticket.rawStatus === 'verified';
        return (
            <div className="px-6 py-4 flex items-center justify-between"
                 style={{
                     borderTop: '1px solid var(--a-border)',
                     background: isVerified ? 'var(--a-success-soft)' : 'var(--a-danger-soft)',
                 }}>
                <p className="text-sm font-medium flex items-center gap-2"
                   style={{ color: isVerified ? '#047857' : '#B91C1C' }}>
                    <FontAwesomeIcon icon={isVerified ? faCircleCheck : faCircleXmark} />
                    Submission has been {isVerified ? 'fully verified' : 'rejected'}.
                </p>
                <button onClick={onClose} className="a-btn a-btn-primary">Close</button>
            </div>
        );
    }

    // Report actions
    return (
        <div className="px-6 py-4 flex flex-wrap items-center justify-end gap-2"
             style={{ borderTop: '1px solid var(--a-border)', background: 'var(--a-surface-2)' }}>
            {ticket.status !== 'closed' && (
                <button disabled={actionLoading} onClick={() => onReportAction('closed')} className="a-btn a-btn-ghost">
                    Close Ticket
                </button>
            )}
            {ticket.status === 'open' && (
                <button disabled={actionLoading} onClick={() => onReportAction('in-progress')} className="a-btn a-btn-ghost"
                        style={{ color: 'var(--a-info)', borderColor: '#BAE6FD' }}>
                    Mark In Progress
                </button>
            )}
            <button disabled={actionLoading} onClick={() => onReportAction('resolved')} className="a-btn a-btn-success">
                <FontAwesomeIcon icon={actionLoading ? faSpinner : faCheck}
                                 className={actionLoading ? 'animate-spin text-xs' : 'text-xs'} />
                Mark Resolved
            </button>
        </div>
    );
};

export default AdminRequests;
