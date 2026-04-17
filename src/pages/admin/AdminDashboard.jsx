import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faInbox,
    faTriangleExclamation,
    faSeedling,
    faLeaf,
    faArrowUp,
    faArrowRight,
    faBolt,
    faChartLine,
    faCheck,
    faList,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                if (res?.success) setStats(res.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="space-y-5">
                <div className="h-8 w-64 rounded-lg" style={{ background: 'var(--a-surface)' }} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="a-card a-card-pad h-[120px] animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    const kpis = [
        {
            key: 'users',
            title: 'Total Users',
            value: stats.kpi.users,
            icon: faUsers,
            tone: 'accent',
            delta: stats.sevenDay?.newUsers ? `+${stats.sevenDay.newUsers} this week` : null,
        },
        {
            key: 'pending',
            title: 'Pending Submissions',
            value: stats.kpi.pendingSubmissions,
            icon: faInbox,
            tone: 'warning',
            delta: 'Awaiting review',
        },
        {
            key: 'reports',
            title: 'Open Reports',
            value: stats.kpi.openReports,
            icon: faTriangleExclamation,
            tone: 'danger',
            delta: 'Needs attention',
        },
        {
            key: 'trees',
            title: 'Trees Planted',
            value: stats.kpi.totalTreesPlanted || 0,
            icon: faSeedling,
            tone: 'success',
            delta: `${(stats.kpi.totalPollutionSaved || 0).toFixed(1)} kg CO₂ saved`,
        },
    ];

    const quickActions = [
        { to: '/admin/submission-reviews', label: 'Action Reviews', icon: faInbox, tone: 'accent' },
        { to: '/admin/submissions', label: 'Verified Subs', icon: faCheck, tone: 'success' },
        { to: '/admin/requests', label: 'Helpdesk Tickets', icon: faList, tone: 'warning' },
        { to: '/admin/analytics', label: 'Analytics', icon: faChartLine, tone: 'info' },
    ];

    const sevenDayAvg = Math.round((stats.sevenDay?.activities || 0) / 7);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <p className="a-eyebrow mb-1">Overview</p>
                    <h1 className="a-page-title">Admin Dashboard</h1>
                    <p className="a-page-sub">
                        Real-time view of platform activity, submissions, and operations.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="a-btn a-btn-ghost">
                        <FontAwesomeIcon icon={faChartLine} className="text-xs" />
                        Export Report
                    </button>
                    <Link to="/admin/submission-reviews" className="a-btn a-btn-primary">
                        <FontAwesomeIcon icon={faBolt} className="text-xs" />
                        Review Queue
                    </Link>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                    <motion.div
                        key={kpi.key}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="a-card a-card-pad"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <ToneIcon icon={kpi.icon} tone={kpi.tone} />
                            <span className="a-chip a-chip-neutral">
                                <FontAwesomeIcon icon={faArrowUp} className="text-[8px]" />
                                Live
                            </span>
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--a-text-3)' }}>
                            {kpi.title}
                        </p>
                        <p className="text-3xl font-bold mt-1 tracking-tight" style={{ color: 'var(--a-text-1)' }}>
                            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                        </p>
                        {kpi.delta && (
                            <p className="text-xs mt-2" style={{ color: 'var(--a-text-2)' }}>
                                {kpi.delta}
                            </p>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="a-card a-card-flush">
                <div className="a-card-header">
                    <div>
                        <p className="a-card-title">Quick Actions</p>
                        <p className="a-card-subtitle">Jump straight into the most-used admin views</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--a-border)' }}>
                    {quickActions.map((action) => (
                        <Link
                            key={action.to}
                            to={action.to}
                            className="group flex items-center justify-between p-5 transition-colors"
                            style={{ background: 'var(--a-surface)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--a-surface-2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--a-surface)')}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <ToneIcon icon={action.icon} tone={action.tone} size={36} />
                                <span className="text-sm font-semibold truncate" style={{ color: 'var(--a-text-1)' }}>
                                    {action.label}
                                </span>
                            </div>
                            <FontAwesomeIcon
                                icon={faArrowRight}
                                className="text-xs transition-transform group-hover:translate-x-0.5"
                                style={{ color: 'var(--a-text-3)' }}
                            />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Platform totals */}
                <div className="a-card a-card-flush lg:col-span-3">
                    <div className="a-card-header">
                        <div>
                            <p className="a-card-title">Platform Totals</p>
                            <p className="a-card-subtitle">All-time aggregate counters</p>
                        </div>
                        <span className="a-chip a-chip-accent">All-time</span>
                    </div>
                    <ul className="divide-y" style={{ borderColor: 'var(--a-border)' }}>
                        <StatRow
                            label="Total Submissions"
                            value={stats.recent?.totalSubmissions || 0}
                            hint="Across all categories"
                        />
                        <StatRow
                            label="Active Communities"
                            value={stats.recent?.activeCommunities || 0}
                            hint="Verified and ongoing"
                        />
                        <StatRow
                            label="Total Credits Distributed"
                            value={(stats.recent?.totalCredits || 0).toLocaleString()}
                            hint="Awarded to verified submissions"
                            accent
                        />
                        <StatRow
                            label="CO₂ Saved (kg)"
                            value={(stats.kpi.totalPollutionSaved || 0).toFixed(1)}
                            hint="Estimated environmental impact"
                            icon={faLeaf}
                        />
                    </ul>
                </div>

                {/* 7-day activity */}
                <div className="a-card a-card-flush lg:col-span-2">
                    <div className="a-card-header">
                        <div>
                            <p className="a-card-title">Last 7 Days</p>
                            <p className="a-card-subtitle">Rolling weekly snapshot</p>
                        </div>
                        <span className="a-chip a-chip-success">Live</span>
                    </div>
                    <div className="p-5 space-y-4">
                        <MetricBlock
                            label="New Users"
                            value={stats.sevenDay?.newUsers || 0}
                            tone="accent"
                        />
                        <MetricBlock
                            label="Activities Uploaded"
                            value={stats.sevenDay?.activities || 0}
                            tone="success"
                        />
                        <MetricBlock
                            label="Avg Daily Activity"
                            value={sevenDayAvg}
                            tone="warning"
                            suffix="/ day"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- Helpers ---------- */

const TONE_STYLES = {
    accent:  { bg: 'var(--a-accent-soft)',  fg: 'var(--a-accent)' },
    success: { bg: 'var(--a-success-soft)', fg: '#047857' },
    warning: { bg: 'var(--a-warning-soft)', fg: '#B45309' },
    danger:  { bg: 'var(--a-danger-soft)',  fg: '#B91C1C' },
    info:    { bg: 'var(--a-info-soft)',    fg: '#0369A1' },
    neutral: { bg: 'var(--a-surface-2)',    fg: 'var(--a-text-2)' },
};

const ToneIcon = ({ icon, tone = 'accent', size = 40 }) => {
    const style = TONE_STYLES[tone] || TONE_STYLES.accent;
    return (
        <div
            className="rounded-xl flex items-center justify-center shrink-0"
            style={{
                width: size,
                height: size,
                background: style.bg,
                color: style.fg,
            }}
        >
            <FontAwesomeIcon icon={icon} className="text-sm" />
        </div>
    );
};

const StatRow = ({ label, value, hint, accent, icon }) => (
    <li className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
            {icon && <ToneIcon icon={icon} tone="success" size={32} />}
            <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--a-text-1)' }}>
                    {label}
                </p>
                {hint && (
                    <p className="text-xs truncate" style={{ color: 'var(--a-text-3)' }}>
                        {hint}
                    </p>
                )}
            </div>
        </div>
        <span
            className="text-lg font-bold tabular-nums"
            style={{ color: accent ? 'var(--a-accent)' : 'var(--a-text-1)' }}
        >
            {value}
        </span>
    </li>
);

const MetricBlock = ({ label, value, tone = 'accent', suffix }) => {
    const style = TONE_STYLES[tone];
    return (
        <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: style.bg }}
        >
            <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.fg }}>
                    {label}
                </p>
                <p className="text-2xl font-bold mt-0.5 tabular-nums" style={{ color: 'var(--a-text-1)' }}>
                    {value}
                    {suffix && (
                        <span className="text-xs font-medium ml-1" style={{ color: 'var(--a-text-3)' }}>
                            {suffix}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
};

export default AdminDashboard;
