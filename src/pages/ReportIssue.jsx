import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationCircle,
    faPaperPlane,
    faSpinner,
    faBuilding,
    faLaptopCode,
    faArrowLeft,
    faCamera,
    faImage,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import NotificationToast from '../components/common/NotificationToast';

const ReportIssue = () => {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState(null); // 'civic' or 'platform'
    const [formData, setFormData] = useState({
        type: '',
        message: ''
    });
    const [image, setImage] = useState(null); // { file, preview }
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Issue types mapping
    const issueTypes = {
        civic: [
            { id: 'dumping', label: 'Garbage Dumping' },
            { id: 'waterbody', label: 'Waterbody Issue' },
            { id: 'government', label: 'Government/Civic Issue' },
            { id: 'other_civic', label: 'Other' }
        ],
        platform: [
            { id: 'submission', label: 'Submission Issue' },
            { id: 'credit', label: 'Credit Issue' },
            { id: 'bug', label: 'App Bug/Error' },
            { id: 'other_platform', label: 'Other' }
        ]
    };

    const handleCategorySelect = (cat) => {
        setCategory(cat);
        setFormData({ ...formData, type: issueTypes[cat][0].id });
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
            setImage({
                file,
                preview: URL.createObjectURL(file)
            });
        }
    };

    const removeImage = () => {
        if (image?.preview) {
            URL.revokeObjectURL(image.preview);
        }
        setImage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) {
            setToast({ type: 'error', message: 'Please enter a message' });
            return;
        }

        try {
            setLoading(true);

            const data = new FormData();
            data.append('category', category);
            data.append('type', formData.type);
            data.append('message', formData.message);

            if (image?.file) {
                data.append('image', image.file);
            }

            await api.post('/reports', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setToast({ type: 'success', message: 'Report submitted successfully. We will investigate.' });

            // Reset
            setStep(1);
            setCategory(null);
            setFormData({ type: '', message: '' });
            removeImage();
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to submit report' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <NotificationToast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center p-6 md:p-8 rounded-2xl relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
                <div className="relative z-10 text-white w-full md:w-auto text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Report an Issue</h1>
                    <p className="opacity-80 max-w-lg text-sm md:text-base mx-auto md:mx-0">
                        Help us improve our community and platform.
                    </p>
                </div>
                <FontAwesomeIcon icon={faExclamationCircle} className="absolute -bottom-6 -right-6 text-9xl opacity-10 text-white" />
            </div>

            <AnimatePresence mode='wait'>
                {step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
                    >
                        {/* Civic Option */}
                        <button
                            onClick={() => handleCategorySelect('civic')}
                            className="p-8 rounded-2xl text-left border-2 transition-all hover:scale-105 group"
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-light)'
                            }}
                        >
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <FontAwesomeIcon icon={faBuilding} className="text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Report Civic Issue</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Large dumping grounds, waterbody pollution, government-led issues, or other public concerns.
                            </p>
                        </button>

                        {/* Platform Option */}
                        <button
                            onClick={() => handleCategorySelect('platform')}
                            className="p-8 rounded-2xl text-left border-2 transition-all hover:scale-105 group"
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-light)'
                            }}
                        >
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <FontAwesomeIcon icon={faLaptopCode} className="text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Report Platform Issue</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Problems with submissions, credits not updated, app bugs, or account issues.
                            </p>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="card p-6 md:p-8 max-w-2xl mx-auto"
                    >
                        <button
                            onClick={handleBack}
                            className="mb-6 flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to Categories
                        </button>

                        <div className="mb-6 flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${category === 'civic' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {category} Issue
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Specific Issue
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {issueTypes[category].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.id })}
                                            className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${formData.type === type.id
                                                ? 'ring-2 ring-offset-2'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            style={{
                                                backgroundColor: formData.type === type.id ? 'var(--primary-lighter)' : 'var(--bg-surface)',
                                                color: formData.type === type.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
                                                border: '1px solid var(--border-light)',
                                                ringColor: 'var(--primary)'
                                            }}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Attach Image (Optional)
                                </label>

                                {!image ? (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="report-image"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="report-image"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            style={{ borderColor: 'var(--border-medium)' }}
                                        >
                                            <FontAwesomeIcon icon={faCamera} className="text-2xl mb-2 text-gray-400" />
                                            <span className="text-sm text-gray-500">Click to upload screenshot or photo</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-light)' }}>
                                        <img src={image.preview} alt="Preview" className="w-full h-64 object-cover" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate">
                                            {image.file.name}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Details
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Please describe the issue in detail (location, severity, etc.)..."
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                                    style={{
                                        backgroundColor: 'var(--bg-surface)',
                                        borderColor: 'var(--border-light)',
                                        color: 'var(--text-primary)'
                                    }}
                                    required
                                    minLength={10}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                                style={{
                                    background: 'var(--gradient-primary)',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                        Submit Report
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReportIssue;
