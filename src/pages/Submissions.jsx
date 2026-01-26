import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faTimesCircle, faSearch, faFilter, faSpinner, faImage, faMapMarkerAlt, faCalendar, faTimes, faWeight, faCoins, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { getSubmissions } from '../services/submissionService';

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Filter submissions when search or status changes
  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getSubmissions();
      
      if (response.success) {
        setSubmissions(response.data.submissions || []);
      } else {
        setError('Failed to load submissions');
      }
    } catch (err) {
      console.error('Fetch submissions error:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.location?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'verified':
        return 'text-green-600 dark:text-green-400 dark:bg-green-900/30 border-green-600 dark:border-green-500';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 dark:bg-yellow-900/30 border-yellow-600 dark:border-yellow-500';
      case 'rejected':
        return 'text-red-600 dark:text-red-400 dark:bg-red-900/30 border-red-600 dark:border-red-500';
      default:
        return 'text-gray-600 dark:text-gray-400 dark:bg-gray-800 border-gray-600 dark:border-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified': return faCheckCircle;
      case 'pending': return faClock;
      case 'rejected': return faTimesCircle;
      default: return faClock;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Submissions
        </h1>
        
        <div className="flex gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:flex-none">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" 
            />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:border-emerald-500 w-full" 
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:opacity-80 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-secondary)'
              }}
            >
              <FontAwesomeIcon icon={faFilter} />
              Filter
            </button>
            
            {showFilterMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 py-2 rounded-lg shadow-lg z-10 border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-light)'
                }}
              >
                <button
                  onClick={() => { setStatusFilter('all'); setShowFilterMenu(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    statusFilter === 'all' ? 'font-bold' : ''
                  }`}
                  style={{ color: 'var(--text-primary)' }}
                >
                  All
                </button>
                <button
                  onClick={() => { setStatusFilter('verified'); setShowFilterMenu(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    statusFilter === 'verified' ? 'font-bold' : ''
                  }`}
                  style={{ color: 'var(--text-primary)' }}
                >
                  ✓ Verified
                </button>
                <button
                  onClick={() => { setStatusFilter('pending'); setShowFilterMenu(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    statusFilter === 'pending' ? 'font-bold' : ''
                  }`}
                  style={{ color: 'var(--text-primary)' }}
                >
                  ⏱ Pending
                </button>
                <button
                  onClick={() => { setStatusFilter('rejected'); setShowFilterMenu(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    statusFilter === 'rejected' ? 'font-bold' : ''
                  }`}
                  style={{ color: 'var(--text-primary)' }}
                >
                  ✗ Rejected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl" style={{ color: 'var(--primary)' }} />
        </div>
      )}

      {/* Submissions Table */}
      {!loading && (
        <div className="card overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-20">
              <FontAwesomeIcon icon={faImage} className="text-6xl mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {submissions.length === 0 ? 'No submissions yet' : 'No results found'}
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                {submissions.length === 0 ? 'Upload your first photo to get started!' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-light)' }}>
                  <tr>
                    <th className="p-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Activity</th>
                    <th className="p-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Date</th>
                    <th className="p-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Location</th>
                    <th className="p-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                    <th className="p-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                  {filteredSubmissions.map((item) => (
                    <tr 
                      key={item._id} 
                      onClick={() => setSelectedSubmission(item)}
                      className="transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Photo thumbnail */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border-light)' }}>
                            {item.photos && item.photos[0] ? (
                              <img 
                                src={item.photos[0].startsWith('http') ? item.photos[0] : `http://localhost:5000${item.photos[0]}`}
                                alt={item.type}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <FontAwesomeIcon icon={faImage} className="text-emerald-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                              {item.type || 'Submission'}
                            </div>
                            {item.description && (
                              <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                          <span className="text-sm">{formatDate(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                          <span className="text-sm">{item.location?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-2 ${getStatusColor(item.status)}`}>
                          <FontAwesomeIcon icon={getStatusIcon(item.status)} />
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{item.creditsAwarded || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>
      
      {/* Details Modal - Outside of space-y container */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSubmission(null)}
            style={{ margin: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {selectedSubmission.type || 'Submission'}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                    {formatDate(selectedSubmission.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FontAwesomeIcon icon={faTimes} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* Photos */}
              {selectedSubmission.photos && selectedSubmission.photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Photos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSubmission.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.startsWith('http') ? photo : `http://localhost:5000${photo}`}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border"
                        style={{ borderColor: 'var(--border-light)' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span className="text-sm">Location</span>
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedSubmission.location?.name || 'Unknown'}
                  </p>
                  {selectedSubmission.location?.coordinates && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {selectedSubmission.location.coordinates.lat.toFixed(4)}, {selectedSubmission.location.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    <FontAwesomeIcon icon={faWeight} />
                    <span className="text-sm">Weight</span>
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedSubmission.weight || 0} kg
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    <FontAwesomeIcon icon={faCoins} />
                    <span className="text-sm">Credits Earned</span>
                  </div>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{selectedSubmission.creditsAwarded || 0}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    <FontAwesomeIcon icon={faLeaf} />
                    <span className="text-sm">CO₂ Saved</span>
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedSubmission.verificationDetails?.co2Saved || 0} kg
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedSubmission.description && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Description</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedSubmission.description}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="mb-6">
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Status</h3>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase border-2 ${getStatusColor(selectedSubmission.status)}`}>
                  <FontAwesomeIcon icon={getStatusIcon(selectedSubmission.status)} />
                  {selectedSubmission.status}
                </span>
              </div>

              {/* AI Verification Details */}
              {selectedSubmission.verificationDetails && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>AI Verification</h3>
                  <div className="space-y-2 text-sm">
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold">Category:</span> {selectedSubmission.verificationDetails.category || 'N/A'}
                    </p>
                    {selectedSubmission.verificationDetails.notes && (
                      <p style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-semibold">Notes:</span> {selectedSubmission.verificationDetails.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Submissions;
