import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRobot, 
    faTimes, 
    faPaperPlane, 
    faTicketAlt, 
    faCircle,
    faMinus,
    faExpandAlt
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        { 
            id: 'welcome', 
            type: 'bot', 
            text: "Namaste! I'm your CivicSetu Assistant. How can I help you today? You can ask me about your ticket status by typing something like 'Status of TKT-123456'." 
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    // Fetch history on mount if logged in
    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await api.get('/chat/history');
                if (response.success && response.data.length > 0) {
                    setMessages(prev => {
                        // Keep welcome message and append history
                        const historyFormatted = response.data.map((m, idx) => ({
                            id: `hist-${idx}`,
                            type: m.type,
                            text: m.text
                        }));
                        return [prev[0], ...historyFormatted];
                    });
                }
            } catch (error) {
                console.error('️ Failed to fetch chat history:', error);
            }
        };

        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // If the user clicks outside and it's not the toggle button (handled separately)
                // We add a small delay to ensure the toggle button click doesn't immediately close it
                if (!event.target.closest('.chatbot-toggle')) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen && !isMinimized) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isMinimized]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isMinimized]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        
        // Add user message to UI immediately
        const userMsgObj = { id: Date.now(), type: 'user', text: userMessage };
        setMessages(prev => [...prev, userMsgObj]);

        setIsTyping(true);

        try {
            // Call the Smart Assistant API
            const response = await api.post('/chat', { message: userMessage });
            
            if (response.success) {
                setMessages(prev => [...prev, { 
                    id: Date.now() + 1, 
                    type: 'bot', 
                    text: response.data.response 
                }]);
            } else {
                throw new Error(response.message || 'Failed to get a response');
            }
        } catch (error) {
            console.error(' Chatbot Error:', error);
            const errorMsg = error.message === 'Network Error' 
                ? "I'm having trouble connecting to the server. Please check if the backend is running."
                : "I encountered an error while processing your request. Please try again later.";
                
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                type: 'bot', 
                text: errorMsg 
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]" ref={containerRef}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            height: isMinimized ? '72px' : '550px'
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="bg-white dark:bg-gray-800 w-[350px] md:w-[400px] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div 
                            className="p-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white flex justify-between items-center cursor-pointer"
                            onClick={() => isMinimized && setIsMinimized(false)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                    <FontAwesomeIcon icon={faRobot} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">CivicSetu Assistant</h3>
                                    <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                                        <FontAwesomeIcon icon={faCircle} className="text-emerald-400 text-[6px]" />
                                        Online
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMinimized(!isMinimized);
                                    }}
                                    className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    <FontAwesomeIcon icon={isMinimized ? faExpandAlt : faMinus} />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                    }}
                                    className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area - Hidden when minimized */}
                        <AnimatePresence>
                            {!isMinimized && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col h-[478px]"
                                >
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                                        {messages.map((msg, idx) => (
                                            <div key={msg.id || idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                                    msg.type === 'user' 
                                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600 shadow-sm'
                                                }`}>
                                                    <div className="whitespace-pre-wrap">
                                                        {(msg.text || '').split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-600">
                                                    <div className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <form onSubmit={handleSend} className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                        <input 
                                            type="text" 
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 transition-all"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!input.trim() || isTyping}
                                            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-blue-500/20"
                                        >
                                            <FontAwesomeIcon icon={faPaperPlane} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setIsOpen(!isOpen);
                    setIsMinimized(false);
                }}
                className={`chatbot-toggle w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 overflow-hidden relative ${
                    isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-br from-blue-600 to-emerald-600'
                }`}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                <FontAwesomeIcon icon={isOpen ? faTimes : faRobot} className="text-xl relative z-10" />
            </motion.button>
        </div>
    );
};

export default Chatbot;
