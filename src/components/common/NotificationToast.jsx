import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationToast = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleNewNotification = (event) => {
            const { title, message, type = 'info', duration = 5000 } = event.detail;
            const id = Date.now();

            setNotifications((prev) => [...prev, { id, title, message, type }]);

            if (duration > 0) {
                setTimeout(() => {
                    removeNotification(id);
                }, duration);
            }
        };

        window.addEventListener('newNotification', handleNewNotification);

        return () => {
            window.removeEventListener('newNotification', handleNewNotification);
        };
    }, []);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return faCheckCircle;
            case 'error': return faExclamationCircle;
            default: return faInfoCircle;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-50 text-green-800 border-green-200';
            case 'error': return 'bg-red-50 text-red-800 border-red-200';
            default: return 'bg-blue-50 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-4 w-96 max-w-[calc(100vw-3rem)]">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        layout
                        className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 ${getColor(notification.type)}`}
                    >
                        <div className="mt-1">
                            <FontAwesomeIcon icon={getIcon(notification.type)} size="lg" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">{notification.title}</h4>
                            <p className="text-sm opacity-90">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-current opacity-50 hover:opacity-100 p-1"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default NotificationToast;
