import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTicketAlt, faExclamationTriangle, faHistory, faSearch, faFilter,
    faChevronDown, faCheck, faClock, faImage, faShieldHalved, faCopy,
    faBuilding, faLaptopCode, faRecycle, faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import NotificationToast from '../components/common/NotificationToast';

const STAGES = [
    { id: 'open',        label: 'Submitted'   },
    { id: 'in-progress', label: 'In progress' },
    { id: 'resolved',    label: 'Resolved'    },
    { id: 'closed',      label: 'Closed'      },
];
const STAGE_INDEX = STAGES.reduce((a, s, i) => ({ ...a, [s.id]: i }), {});

const STATUS_COLOR = {
    open:          '#2563eb',
    'in-progress': '#d97706',
    resolved:      '#16a34a',
    closed:        '#64748b',
    escalated:     '#dc2626',
};

const TYPE_LABELS = {
    dumping: 'Garbage Dumping', waterbody: 'Waterbody Pollution',
    government: 'Civic Negligence', other_civic: 'Other Public Issue',
    submission: 'Submission Stuck', credit: 'Credit Mismatch',
    bug: 'App Bug / Crash', other_platform: 'Other / Feedback',
};

const TrackingBar = ({ status, isCleanup }) => {
    const isEscalated = status === 'escalated';
    const currentIndex = isEscalated ? STAGE_INDEX['in-progress'] : (STAGE_INDEX[status] ?? 0);
    const progressPct = Math.round((currentIndex / (STAGES.length - 1)) * 100);
    const fillColor = isEscalated ? '#dc2626' : (STATUS_COLOR[status] || '#2563eb');

    return (
        <div className="space-y-3">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        Resolution progress
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: fillColor }}>
                        {STAGES[currentIndex]?.label}
                        {isEscalated && ' · Escalated'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        Complete
                    </p>
                    <p className="text-2xl font-black tabular-nums" style={{ color: fillColor }}>
                        {progressPct}%
                    </p>
                </div>
            </div>

            <div className="relative pt-1">
                <div className="absolute left-0 right-0 top-[14px] h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                <motion.div
                    className="absolute left-0 top-[14px] h-1 rounded-full"
                    style={{ backgroundColor: fillColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                />
                <div className="relative grid grid-cols-4 gap-2">
                    {STAGES.map((stage, i) => {
                        const reached = i <= currentIndex;
                        const active = i === currentIndex;
                        return (
                            <div key={stage.id} className="flex flex-col items-center text-center">
                                <motion.div
                                    initial={{ scale: 0.6 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="w-7 h-7 rounded-full flex items-center justify-center relative z-10 bg-white dark:bg-gray-800"
                                    style={{
                                        border: `2px solid ${reached ? fillColor : '#cbd5e1'}`,
                                        backgroundColor: reached ? fillColor : undefined,
                                        color: reached ? '#fff' : '#94a3b8',
                                        boxShadow: active ? `0 0 0 4px ${fillColor}26` : 'none',
                                    }}
                                >
                                    {reached
                                        ? <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
                                        : <span className="text-[9px] font-bold">{i + 1}</span>}
                                </motion.div>
                                <p
                                    className="mt-1.5 text-[10px] font-semibold leading-tight"
                                    style={{ color: reached ? fillColor : '#94a3b8' }}
                                >
                                    {isCleanup && stage.id === 'in-progress' ? 'Verifying' :
                                     isCleanup && stage.id === 'resolved'    ? 'Verified'  :
                                     stage.label}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TicketCard = ({ ticket, expanded, onToggle, registerRef }) => {
    const isCleanup = ticket.ticketType === 'Civic Action';
    const ticketIdDisplay = ticket.ticketId || `TKT-${ticket._id.slice(-6)}`;
    const created = new Date(ticket.createdAt);
    const updated = new Date(ticket.updatedAt || ticket.createdAt);
    const [copied, setCopied] = useState(false);

    const { description, diagnostics } = useMemo(() => {
        const raw = ticket.message || '';
        const marker = '\n\n— Diagnostics —\n';
        if (raw.includes(marker)) {
            const [d, diag] = raw.split(marker);
            return {
                description: d.trim(),
                diagnostics: diag.split('\n').map((l) => l.trim()).filter(Boolean),
            };
        }
        return { description: raw, diagnostics: [] };
    }, [ticket]);

    const copyId = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(ticketIdDisplay);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* ignore */ }
    };

    const statusColor = STATUS_COLOR[ticket.status] || '#64748b';
    const Icon = isCleanup ? faRecycle : (ticket.category === 'civic' ? faBuilding : faLaptopCode);

    return (
        <motion.div
            ref={registerRef}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden self-start"
            style={{
                borderColor: expanded ? statusColor : undefined,
                boxShadow: expanded ? `0 8px 24px -8px ${statusColor}33` : undefined,
            }}
        >
            {/* Clickable summary header */}
            <button
                type="button"
                onClick={onToggle}
                className="w-full text-left p-6 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            >
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${statusColor}1a`, color: statusColor }}
                        >
                            <FontAwesomeIcon icon={Icon} className="text-xs" />
                        </div>
                        <span
                            onClick={copyId}
                            role="button"
                            className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg inline-flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        >
                            {ticketIdDisplay}
                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[9px] opacity-70" />
                        </span>
                    </div>
                    <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${statusColor}1a`, color: statusColor, border: `1px solid ${statusColor}33` }}
                    >
                        {ticket.status?.replace('-', ' ')}
                    </span>
                </div>

                <div className="mb-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                        {ticket.ticketType || 'Complaint'}
                    </span>
                </div>

                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2 capitalize">
                    {TYPE_LABELS[ticket.type] || ticket.type?.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                        Filed {created.toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        {expanded ? 'Hide details' : 'Track ticket'}
                        <motion.span
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                        </motion.span>
                    </span>
                </div>
            </button>

            {/* Expanded body */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="body"
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden', willChange: 'height' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{
                                duration: 0.3,
                                ease: 'easeOut',
                                delay: expanded ? 0.08 : 0,
                            }}
                            className="px-6 pb-6 pt-1 space-y-5 border-t border-gray-100 dark:border-gray-700"
                        >
                            <div className="pt-5">
                                <TrackingBar status={ticket.status} isCleanup={isCleanup} />
                            </div>

                            {ticket.status === 'escalated' && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5" />
                                    <span><strong>Escalated.</strong> This ticket exceeded its SLA and is now with a senior responder.</span>
                                </div>
                            )}

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                                    Full description
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                    {description || '—'}
                                </p>
                            </div>

                            {ticket.image && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                                        <FontAwesomeIcon icon={faImage} className="mr-1.5" />
                                        Attached evidence
                                    </p>
                                    <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                                        <img
                                            src={ticket.image.startsWith('http')
                                                ? ticket.image
                                                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${ticket.image}`}
                                            alt="Evidence"
                                            className="w-full max-h-80 object-contain bg-gray-50 dark:bg-gray-900"
                                        />
                                    </div>
                                </div>
                            )}

                            {diagnostics.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
                                        <FontAwesomeIcon icon={faShieldHalved} className="mr-1.5" />
                                        Auto-attached diagnostics
                                    </p>
                                    <div className="rounded-xl px-3.5 py-2.5 font-mono text-[11px] leading-relaxed bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 space-y-0.5">
                                        {diagnostics.map((line, i) => <div key={i}>{line}</div>)}
                                    </div>
                                </div>
                            )}

                            {/* Activity timeline with timestamps */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">
                                    <FontAwesomeIcon icon={faClock} className="mr-1.5" />
                                    Activity timeline
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                                                {isCleanup ? 'Cleanup submitted' : 'Ticket filed'}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                {created.toLocaleString()}
                                            </p>
                                        </div>
                                    </li>
                                    {ticket.status !== 'open' && (
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statusColor }} />
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 capitalize">
                                                    Status changed to {ticket.status?.replace('-', ' ')}
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    {updated.toLocaleString()}
                                                </p>
                                            </div>
                                        </li>
                                    )}
                                    {ticket.isEscalated && (
                                        <li className="flex items-start gap-2.5">
                                            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-500" />
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                                                    Escalated to senior responder
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    {new Date(ticket.escalatedAt || updated).toLocaleString()}
                                                </p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Detail rows */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2.5">
                                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Channel</p>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                                        {isCleanup ? 'Civic Action' : (ticket.category === 'civic' ? 'Civic Response' : 'Engineering')}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2.5">
                                    <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Priority</p>
                                    <p className="text-xs font-semibold capitalize text-gray-800 dark:text-gray-100 mt-0.5">
                                        {ticket.priority || 'medium'}
                                    </p>
                                </div>
                                {ticket.location?.address && (
                                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2.5 col-span-2">
                                        <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                                            Location
                                        </p>
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                                            {ticket.location.address}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const MyTickets = () => {
    const navigate = useNavigate();
    const { ticketId: paramTicketId } = useParams();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [toast, setToast] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const cardRefs = useRef({});

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/all-my-tickets');
            if (response.success) setTickets(response.data);
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to fetch tickets' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, []);

    // Auto-expand and scroll to ticket from URL param (e.g. email deep link)
    useEffect(() => {
        if (!paramTicketId || tickets.length === 0) return;
        const found = tickets.find((t) => t.ticketId === paramTicketId);
        if (!found) return;
        setExpandedId(found._id);
        setTimeout(() => {
            const el = cardRefs.current[found._id];
            if (el?.scrollIntoView) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 250);
    }, [paramTicketId, tickets]);

    const handleToggle = (ticket) => {
        setExpandedId((prev) => (prev === ticket._id ? null : ticket._id));
        if (paramTicketId && paramTicketId !== ticket.ticketId) {
            navigate('/my-tickets', { replace: true });
        }
    };

    const filteredTickets = filter === 'All'
        ? tickets
        : tickets.filter((t) => t.status?.toLowerCase() === filter.toLowerCase());

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {toast && <NotificationToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <FontAwesomeIcon icon={faTicketAlt} className="text-blue-500" />
                        My Helpdesk Tickets
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Tap any ticket to track resolution progress</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                        >
                            <option value="All">All Status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="escalated">Escalated</option>
                        </select>
                    </div>
                    <button
                        onClick={fetchTickets}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FontAwesomeIcon icon={faHistory} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Tickets Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : filteredTickets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {filteredTickets.map((ticket) => (
                        <TicketCard
                            key={ticket._id}
                            ticket={ticket}
                            expanded={expandedId === ticket._id}
                            onToggle={() => handleToggle(ticket)}
                            registerRef={(el) => { cardRefs.current[ticket._id] = el; }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FontAwesomeIcon icon={faSearch} className="text-2xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">No tickets found</h3>
                    <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                        {filter === 'All'
                            ? "You haven't submitted any cleanup actions or helpdesk tickets yet."
                            : `You don't have any tickets with status "${filter}".`}
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={() => navigate('/report-issue')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Submit Complaint
                        </button>
                        <button
                            onClick={() => navigate('/upload')}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                        >
                            Report Cleanup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTickets;
