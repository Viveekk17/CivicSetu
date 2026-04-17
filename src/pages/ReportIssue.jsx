import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationCircle, faPaperPlane, faSpinner, faBuilding,
    faLaptopCode, faArrowLeft, faCamera, faTimes, faCheck,
    faMapMarkerAlt, faClock, faShieldHalved, faTriangleExclamation,
    faCircleInfo, faBug, faGauge, faRoute, faCopy, faArrowRight,
    faLocationCrosshairs, faTag,
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import NotificationToast from '../components/common/NotificationToast';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
    hidden: { y: 14, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

const ISSUE_TYPES = {
    civic: [
        { id: 'dumping',      label: 'Garbage Dumping',     icon: faBuilding         },
        { id: 'waterbody',    label: 'Waterbody Pollution', icon: faMapMarkerAlt     },
        { id: 'government',   label: 'Civic Negligence',    icon: faShieldHalved     },
        { id: 'other_civic',  label: 'Other Public Issue',  icon: faCircleInfo       },
    ],
    platform: [
        { id: 'submission',     label: 'Submission Stuck',    icon: faRoute },
        { id: 'credit',         label: 'Credit Mismatch',     icon: faGauge },
        { id: 'bug',            label: 'App Bug / Crash',     icon: faBug   },
        { id: 'other_platform', label: 'Other / Feedback',    icon: faCircleInfo },
    ],
};

const SEVERITIES = [
    { id: 'low',      label: 'Low',      hint: 'Minor inconvenience',  color: '#16a34a' },
    { id: 'medium',   label: 'Medium',   hint: 'Affecting workflow',   color: '#d97706' },
    { id: 'high',     label: 'High',     hint: 'Blocking action',      color: '#dc2626' },
    { id: 'critical', label: 'Critical', hint: 'Urgent / public risk', color: '#7c2d12' },
];

const SLA_BY_SEVERITY = {
    low: '48h', medium: '24h', high: '6h', critical: '1h',
};

const HeroCard = () => (
    <div className="card p-6 md:p-7 relative overflow-hidden">
        <div className="grid md:grid-cols-5 gap-6 items-center relative z-10">
            <div className="md:col-span-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                    Support &amp; Reports
                </p>
                <h2 className="text-2xl md:text-3xl font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>
                    File a structured report
                </h2>
                <p className="text-sm mt-2 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                    Civic incidents go to the local response cell; platform tickets reach the engineering team. Every report is tracked end-to-end.
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                        Avg response: 6h
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: 'var(--bg-hover, #f3eeff)', color: 'var(--text-secondary)' }}>
                        <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                        Encrypted &amp; logged
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)', color: '#fff' }}>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Active workflow
                    </span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-amber-300 text-sm" />
                    </div>
                </div>
                <div className="space-y-1.5 mt-1">
                    {['Submitted', 'Triaged', 'In progress', 'Resolved'].map((stage, i) => (
                        <div key={stage} className="flex items-center gap-2 text-[11px]">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                                <span className="text-[9px] font-bold">{i + 1}</span>
                            </div>
                            <span className="opacity-90">{stage}</span>
                        </div>
                    ))}
                </div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.25), transparent 70%)' }} />
            </div>
        </div>
    </div>
);

const CategoryCard = ({ icon, eyebrow, title, description, bullets, sla, onSelect }) => (
    <button
        onClick={onSelect}
        className="card p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col h-full"
    >
        <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                <FontAwesomeIcon icon={icon} className="text-base" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-1 rounded-full"
                style={{ backgroundColor: 'var(--bg-hover, #f3eeff)', color: 'var(--text-tertiary)' }}>
                SLA · {sla}
            </span>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
            {eyebrow}
        </p>
        <h3 className="text-lg font-bold mt-1 mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            {description}
        </p>

        <ul className="space-y-1.5 mb-5">
            {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faCheck} className="text-[10px] mt-1" style={{ color: 'var(--primary)' }} />
                    <span>{b}</span>
                </li>
            ))}
        </ul>

        <div className="mt-auto pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Continue
            </span>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" style={{ color: 'var(--primary)' }} />
        </div>
    </button>
);

const ReportIssue = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState(null);
    const [formData, setFormData] = useState({
        type: '',
        message: '',
        severity: 'medium',
        landmark: '',
        affectedRoute: '',
    });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [lastTicketId, setLastTicketId] = useState('');
    const [copied, setCopied] = useState(false);

    const sysContext = useMemo(() => ({
        page: window.location.pathname,
        ua: navigator.userAgent.split(' ').slice(-2).join(' '),
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        time: new Date().toLocaleString(),
    }), []);

    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1800);
        return () => clearTimeout(t);
    }, [copied]);

    const handleCategorySelect = (cat) => {
        setCategory(cat);
        setFormData((f) => ({ ...f, type: ISSUE_TYPES[cat][0].id }));
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
        setCategory(null);
        setImage(null);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setToast({ type: 'error', message: 'Image size must be less than 5MB' });
                return;
            }
            setImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const removeImage = () => {
        if (image?.preview) URL.revokeObjectURL(image.preview);
        setImage(null);
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setToast({ type: 'error', message: 'Geolocation not supported' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setFormData((f) => ({
                    ...f,
                    landmark: f.landmark
                        ? `${f.landmark} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                        : `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`,
                }));
                setToast({ type: 'success', message: 'Coordinates added' });
            },
            () => setToast({ type: 'error', message: 'Could not detect location' }),
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.message.trim() || formData.message.trim().length < 10) {
            setToast({ type: 'error', message: 'Please describe the issue (min. 10 characters)' });
            return;
        }
        try {
            setLoading(true);
            const data = new FormData();
            data.append('category', category);
            data.append('type', formData.type);

            const contextLines = [];
            if (formData.severity) contextLines.push(`Severity: ${formData.severity.toUpperCase()}`);
            if (category === 'civic' && formData.landmark) contextLines.push(`Landmark: ${formData.landmark}`);
            if (category === 'platform' && formData.affectedRoute) contextLines.push(`Affected page: ${formData.affectedRoute}`);
            if (category === 'platform') {
                contextLines.push(`User-Agent: ${sysContext.ua}`);
                contextLines.push(`Viewport: ${sysContext.viewport}`);
                contextLines.push(`Captured at: ${sysContext.time}`);
            }
            const composedMessage = contextLines.length
                ? `${formData.message.trim()}\n\n— Diagnostics —\n${contextLines.join('\n')}`
                : formData.message.trim();

            data.append('message', composedMessage);
            if (image?.file) data.append('image', image.file);

            const response = await api.post('/reports', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const ticketId = response.data.ticketId;
            setLastTicketId(ticketId);
            setToast({ type: 'success', message: `Ticket ${ticketId} registered` });
            setStep(3);
            setFormData({ type: '', message: '', severity: 'medium', landmark: '', affectedRoute: '' });
            removeImage();
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to submit report' });
        } finally {
            setLoading(false);
        }
    };

    const copyTicketId = async () => {
        try {
            await navigator.clipboard.writeText(lastTicketId || '');
            setCopied(true);
        } catch {
            setToast({ type: 'error', message: 'Could not copy' });
        }
    };

    const activeType = ISSUE_TYPES[category]?.find((t) => t.id === formData.type);
    const activeSeverity = SEVERITIES.find((s) => s.id === formData.severity);

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {toast && (
                <NotificationToast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            <motion.div variants={itemVariants}>
                <HeroCard />
            </motion.div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                    >
                        <CategoryCard
                            icon={faBuilding}
                            eyebrow="Field report"
                            title="Civic Issue"
                            description="On-the-ground problems that need action by municipal authorities or NGOs."
                            bullets={[
                                'Illegal dumping or burning sites',
                                'Drain, lake or waterbody pollution',
                                'Negligence by ULB / contractor',
                                'Public safety &amp; sanitation hazards',
                            ]}
                            sla="6–24h"
                            onSelect={() => handleCategorySelect('civic')}
                        />
                        <CategoryCard
                            icon={faLaptopCode}
                            eyebrow="Product ticket"
                            title="Platform Issue"
                            description="Bugs, misbehaving features, or anything that breaks your CivicSetu workflow."
                            bullets={[
                                'Submission stuck in pending / verification',
                                'Credits not awarded or wrong amount',
                                'UI bugs, crashes, or login failures',
                                'Feature requests &amp; usability feedback',
                            ]}
                            sla="1–48h"
                            onSelect={() => handleCategorySelect('platform')}
                        />
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                    >
                        {/* Form column */}
                        <div className="lg:col-span-2 space-y-5">
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center gap-2 text-xs font-semibold transition-opacity hover:opacity-100 opacity-70"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Change category
                            </button>

                            <form onSubmit={handleSubmit} className="card p-5 md:p-6 space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                                        <FontAwesomeIcon
                                            icon={category === 'civic' ? faBuilding : faLaptopCode}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                                            style={{ color: 'var(--text-tertiary)' }}>
                                            {category === 'civic' ? 'Civic Report' : 'Platform Ticket'}
                                        </p>
                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                            New issue · auto-routed by type &amp; severity
                                        </p>
                                    </div>
                                </div>

                                {/* Type chips */}
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2 block"
                                        style={{ color: 'var(--text-tertiary)' }}>
                                        Specific issue
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {ISSUE_TYPES[category].map((type) => {
                                            const active = formData.type === type.id;
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: type.id })}
                                                    className="px-3.5 py-3 rounded-xl text-left text-xs font-semibold inline-flex items-center gap-2.5 transition-colors"
                                                    style={{
                                                        backgroundColor: active ? 'var(--primary-lighter)' : 'transparent',
                                                        color: active ? 'var(--primary)' : 'var(--text-secondary)',
                                                        border: `1px solid ${active ? 'var(--primary)' : 'var(--border-light)'}`,
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={type.icon} className="text-[11px]" />
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Severity */}
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2 block"
                                        style={{ color: 'var(--text-tertiary)' }}>
                                        Severity
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {SEVERITIES.map((s) => {
                                            const active = formData.severity === s.id;
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, severity: s.id })}
                                                    className="px-3 py-2.5 rounded-xl text-left transition-colors"
                                                    style={{
                                                        backgroundColor: active ? 'var(--primary-lighter)' : 'transparent',
                                                        border: `1px solid ${active ? s.color : 'var(--border-light)'}`,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                        <span className="text-xs font-bold" style={{ color: active ? s.color : 'var(--text-primary)' }}>
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{s.hint}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Personalised contextual field */}
                                {category === 'civic' ? (
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2 block"
                                            style={{ color: 'var(--text-tertiary)' }}>
                                            Landmark / area
                                        </label>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                            style={{ border: '1px solid var(--border-light)' }}>
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" style={{ color: 'var(--text-tertiary)' }} />
                                            <input
                                                type="text"
                                                value={formData.landmark}
                                                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                                                placeholder="e.g. Behind Sector 12 metro station"
                                                className="bg-transparent outline-none w-full text-sm"
                                                style={{ color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={detectLocation}
                                                className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-1 rounded-full inline-flex items-center gap-1"
                                                style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
                                            >
                                                <FontAwesomeIcon icon={faLocationCrosshairs} className="text-[10px]" />
                                                GPS
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2 block"
                                            style={{ color: 'var(--text-tertiary)' }}>
                                            Affected page / flow
                                        </label>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                            style={{ border: '1px solid var(--border-light)' }}>
                                            <FontAwesomeIcon icon={faRoute} className="text-xs" style={{ color: 'var(--text-tertiary)' }} />
                                            <input
                                                type="text"
                                                value={formData.affectedRoute}
                                                onChange={(e) => setFormData({ ...formData, affectedRoute: e.target.value })}
                                                placeholder={`Defaults to ${sysContext.page}`}
                                                className="bg-transparent outline-none w-full text-sm"
                                                style={{ color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, affectedRoute: sysContext.page })}
                                                className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-1 rounded-full"
                                                style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}
                                            >
                                                Use current
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Message */}
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2 block"
                                        style={{ color: 'var(--text-tertiary)' }}>
                                        Detailed description
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder={
                                            category === 'civic'
                                                ? 'Describe what you saw, when, and any people / vehicles involved...'
                                                : 'Steps to reproduce, what you expected, and what happened instead...'
                                        }
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none focus:ring-2"
                                        style={{
                                            backgroundColor: 'var(--bg-surface)',
                                            border: '1px solid var(--border-light)',
                                            color: 'var(--text-primary)',
                                        }}
                                        required
                                        minLength={10}
                                    />
                                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                        {formData.message.length} characters · min. 10
                                    </p>
                                </div>

                                {/* Image */}
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2 block"
                                        style={{ color: 'var(--text-tertiary)' }}>
                                        Evidence / screenshot
                                    </label>
                                    {!image ? (
                                        <>
                                            <input
                                                type="file"
                                                id="report-image"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="report-image"
                                                className="flex flex-col items-center justify-center w-full h-28 rounded-xl cursor-pointer transition-colors"
                                                style={{
                                                    border: '1px dashed var(--border-medium)',
                                                    backgroundColor: 'var(--bg-hover, #f9f5ff)',
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCamera} className="text-base mb-1.5" style={{ color: 'var(--text-tertiary)' }} />
                                                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                    Tap to attach (max 5 MB)
                                                </span>
                                            </label>
                                        </>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
                                            <img src={image.preview} alt="Preview" className="w-full h-52 object-cover" />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white"
                                                style={{ backgroundColor: 'rgba(15,23,42,0.7)' }}
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full"
                                    style={{ opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? (
                                        <><FontAwesomeIcon icon={faSpinner} spin /> Submitting</>
                                    ) : (
                                        <><FontAwesomeIcon icon={faPaperPlane} /> Submit report</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Live preview sidebar */}
                        <div className="space-y-5">
                            <div className="card p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                                    Ticket preview
                                </p>
                                <h4 className="text-sm font-bold mt-1 mb-4" style={{ color: 'var(--text-primary)' }}>
                                    How the team will see it
                                </h4>

                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Channel</span>
                                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {category === 'civic' ? 'Civic Response' : 'Engineering'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Type</span>
                                        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {activeType?.icon && <FontAwesomeIcon icon={activeType.icon} className="text-[10px]" />}
                                            {activeType?.label || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Severity</span>
                                        <span className="inline-flex items-center gap-1.5 font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeSeverity?.color }} />
                                            <span style={{ color: activeSeverity?.color }}>{activeSeverity?.label}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Target SLA</span>
                                        <span className="font-semibold inline-flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                            <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                            {SLA_BY_SEVERITY[formData.severity]}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t space-y-1.5" style={{ borderColor: 'var(--border-light)' }}>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-tertiary) ' }}>
                                        Auto-attached
                                    </p>
                                    <div className="text-[11px] space-y-1" style={{ color: 'var(--text-secondary)' }}>
                                        <div className="flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faTag} className="text-[9px]" />
                                            <span className="truncate">{sysContext.page}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faGauge} className="text-[9px]" />
                                            <span>{sysContext.viewport}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                                            <span>{sysContext.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                                    Tips for faster resolution
                                </p>
                                <ul className="space-y-2 mt-3">
                                    {(category === 'civic'
                                        ? [
                                            'Add a clear photo of the site or hazard',
                                            'Use the GPS button to drop precise coordinates',
                                            'Mention nearby landmarks or pin codes',
                                        ]
                                        : [
                                            'Include exact steps to reproduce the bug',
                                            'Attach a screenshot of the broken state',
                                            'Mention your last successful action',
                                        ]
                                    ).map((tip) => (
                                        <li key={tip} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            <FontAwesomeIcon icon={faTriangleExclamation} className="text-[10px] mt-0.5" style={{ color: 'var(--primary)' }} />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                    >
                        <div className="lg:col-span-2 card p-6 md:p-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                                    <FontAwesomeIcon icon={faCheck} className="text-base" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                                        Ticket registered
                                    </p>
                                    <h2 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                                        We&apos;re on it
                                    </h2>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        A confirmation has been sent to your registered email. Track progress anytime from your profile.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 p-5 rounded-2xl flex items-center justify-between"
                                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)', color: '#fff' }}>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                                        Your ticket ID
                                    </p>
                                    <p className="text-2xl font-mono font-black mt-1 tabular-nums">
                                        {lastTicketId || 'TKT-PENDING'}
                                    </p>
                                </div>
                                <button
                                    onClick={copyTicketId}
                                    className="text-xs font-semibold rounded-full px-3 py-2 inline-flex items-center gap-1.5 transition-colors"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                                >
                                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[10px]" />
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                <button
                                    onClick={() => { setStep(1); setCategory(null); }}
                                    className="btn btn-outline"
                                >
                                    File another report
                                </button>
                                <button
                                    onClick={() =>
                                        navigate(lastTicketId ? `/my-tickets/${lastTicketId}` : '/my-tickets')
                                    }
                                    className="btn btn-primary"
                                >
                                    Track my tickets
                                    <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                                </button>
                            </div>
                        </div>

                        <div className="card p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                                What happens next
                            </p>
                            <ol className="mt-3 space-y-3">
                                {[
                                    { t: 'Triaged within 1h', d: 'Auto-routed to the right team based on type & severity.' },
                                    { t: 'Investigation', d: 'You may be contacted on email for additional details.' },
                                    { t: 'Resolution', d: 'You receive a closing note with action taken.' },
                                ].map((s, i) => (
                                    <li key={s.t} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                                            <span className="text-[10px] font-bold">{i + 1}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{s.t}</p>
                                            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ReportIssue;
