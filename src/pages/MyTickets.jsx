import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTicketAlt, 
    faClock, 
    faCheckCircle, 
    faExclamationTriangle, 
    faHistory,
    faSearch,
    faFilter
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import NotificationToast from '../components/common/NotificationToast';

const MyTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [toast, setToast] = useState(null);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/all-my-tickets');
            if (response.success) {
                setTickets(response.data);
            }
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to fetch tickets' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
            case 'in-progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
            case 'resolved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
            case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200';
            case 'escalated': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 animate-pulse';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'low': return 'text-gray-500';
            case 'medium': return 'text-blue-500';
            case 'high': return 'text-orange-500';
            case 'urgent': return 'text-red-600 font-bold';
            default: return 'text-gray-500';
        }
    };

    const filteredTickets = filter === 'All' 
        ? tickets 
        : tickets.filter(t => t.status.toLowerCase() === filter.toLowerCase());

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
                    <p className="text-gray-500 text-sm mt-1">Track and manage your reported issues</p>
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
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : filteredTickets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTickets.map((ticket, index) => (
                        <motion.div
                            key={ticket._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                                    {ticket.ticketId || `TKT-${ticket._id.slice(-6)}`}
                                </span>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${getStatusStyle(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                            </div>

                            <div className="mb-2">
                                <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500`}>
                                    {ticket.ticketType || 'Complaint'}
                                </span>
                            </div>

                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2 capitalize">
                                {ticket.type?.replace(/_/g, ' ')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                {ticket.message}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Priority</span>
                                        <span className={`text-xs capitalize ${getPriorityStyle(ticket.priority)}`}>
                                            {ticket.priority || 'medium'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col border-l pl-4 border-gray-100 dark:border-gray-700">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Category</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">
                                            {ticket.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Submitted</span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {ticket.status === 'escalated' && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span>This ticket has been escalated due to delay.</span>
                                </div>
                            )}
                        </motion.div>
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
                            onClick={() => window.location.href = '/report-issue'}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Submit Complaint
                        </button>
                        <button 
                            onClick={() => window.location.href = '/upload'}
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
