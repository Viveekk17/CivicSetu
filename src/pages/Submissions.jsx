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

  const [uploading, setUploading] = useState(false);
  const [reverifyPhoto, setReverifyPhoto] = useState(null);

  const handleReverifyUpload = async (id) => {
    if (!reverifyPhoto) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('photo', reverifyPhoto);

      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/submissions/${id}/re-verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        alert('Re-verification photo uploaded successfully!');
        setReverifyPhoto(null);
        fetchSubmissions();
        setSelectedSubmission(null);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (item) => {
    if (item.approvalPhase === 1) return 'text-orange-600 dark:text-orange-500 border-orange-600 dark:border-orange-500';
    switch (item.status) {
      case 'verified':
        return 'text-green-600 dark:text-green-500 border-green-600 dark:border-green-500';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-500 border-yellow-600 dark:border-yellow-500';
      case 'approved':
        return 'text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500';
      case 'rejected':
        return 'text-red-600 dark:text-red-500 border-red-600 dark:border-red-500';
      default:
        return 'dark:bg-transparent border-gray-600 dark:border-gray-500';
    }
  };

  const getStatusIcon = (item) => {
    if (item.approvalPhase === 1) return faClock;
    switch (item.status) {
      case 'verified': return faCheckCircle;
      case 'pending': return faClock;
      case 'approved': return faCheckCircle;
      case 'rejected': return faTimesCircle;
      default: return faClock;
    }
  };

  const getStatusLabel = (item) => {
    if (item.approvalPhase === 1) return 'Phase 2: Action Required';
    if (item.approvalPhase === 2) return 'Verified (Phase 2)';
    if (item.status === 'approved' && item.approvalPhase === 1) return 'Phase 1 Approved';
    return item.status;
  };

  const getRemainingTime = (deadline) => {
    if (!deadline) return '';
    const remaining = new Date(deadline) - new Date();
    if (remaining <= 0) return 'Expired';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    return `${hours}h ${minutes}m left`;
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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'all' ? 'font-bold' : ''
                      }`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setStatusFilter('verified'); setShowFilterMenu(false); }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'verified' ? 'font-bold' : ''
                      }`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                     Verified
                  </button>
                  <button
                    onClick={() => { setStatusFilter('pending'); setShowFilterMenu(false); }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'pending' ? 'font-bold' : ''
                      }`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    ⏱ Pending
                  </button>
                  <button
                    onClick={() => { setStatusFilter('rejected'); setShowFilterMenu(false); }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${statusFilter === 'rejected' ? 'font-bold' : ''
                      }`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                     Rejected
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
          <div className="space-y-4">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-20 card">
                <FontAwesomeIcon icon={faImage} className="text-6xl mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {submissions.length === 0 ? 'No submissions yet' : 'No results found'}
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {submissions.length === 0 ? 'Upload your first photo to get started!' : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="card overflow-hidden hidden md:block">
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
                            className="transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {/* Photo thumbnail */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border-light)' }}>
                                  {item.photos && item.photos[0] ? (
                                    <img
                                      src={item.photos[0].startsWith('http') ? item.photos[0] : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.photos[0]}`}
                                      alt={item.type}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><svg class="text-emerald-500" style="width: 1.5rem; height: 1.5rem;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                      <FontAwesomeIcon icon={faImage} className="text-emerald-500" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-base capitalize" style={{ color: 'var(--text-primary)' }}>
                                    {item.type || 'Submission'}
                                  </div>
                                  {item.description && (
                                    <div className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
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
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-2 ${getStatusColor(item)}`}>
                                <FontAwesomeIcon icon={getStatusIcon(item)} />
                                {getStatusLabel(item)}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                +{item.creditsAwarded || item.totalCreditsAwarded || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {filteredSubmissions.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => setSelectedSubmission(item)}
                      className="card p-4 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border-light)' }}>
                            {item.photos && item.photos[0] ? (
                              <img
                                src={item.photos[0].startsWith('http') ? item.photos[0] : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.photos[0]}`}
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
                            <h3 className="font-bold text-base capitalize" style={{ color: 'var(--text-primary)' }}>
                              {item.type || 'Submission'}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{item.creditsAwarded || 0}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>credits</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faCalendar} />
                          {formatDate(item.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          <span className="truncate">{item.location?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
            style={{ margin: 0, backdropFilter: 'blur(5px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
              <div className="mb-6">
                <h3 className="font-bold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>Initial Evidence (Before/After)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedSubmission.photos && selectedSubmission.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${photo}`}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                      style={{ borderColor: 'var(--border-light)' }}
                    />
                  ))}
                </div>
              </div>

              {/* Phase 2: Action Required / Re-verification */}
              {selectedSubmission.approvalPhase === 1 && (
                <div className="mb-6 p-6 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-800 dark:text-orange-400">Action Required: Final Verification</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-500">
                        Upload a photo of the cleaned site to unlock the remaining 50% credits.
                        <span className="block font-bold mt-1">Deadline: {getRemainingTime(selectedSubmission.reverificationDeadline)}</span>
                      </p>
                    </div>
                  </div>

                  {selectedSubmission.reverificationPhoto ? (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Re-verification photo uploaded! Waiting for final admin review.
                      </p>
                      <img
                        src={selectedSubmission.reverificationPhoto.startsWith('http') ? selectedSubmission.reverificationPhoto : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${selectedSubmission.reverificationPhoto}`}
                        alt="Re-verification"
                        className="w-full h-48 object-cover rounded-lg border border-orange-200"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReverifyPhoto(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      <button
                        onClick={() => handleReverifyUpload(selectedSubmission._id)}
                        disabled={!reverifyPhoto || uploading}
                        className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload Clean Site Photo'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Phase 2: Success Case */}
              {selectedSubmission.approvalPhase === 2 && selectedSubmission.reverificationPhoto && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3 text-lg" style={{ color: 'var(--text-primary)' }}>Final Clean Site Verification</h3>
                  <img
                    src={selectedSubmission.reverificationPhoto.startsWith('http') ? selectedSubmission.reverificationPhoto : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${selectedSubmission.reverificationPhoto}`}
                    alt="Re-verification Success"
                    className="w-full h-64 object-cover rounded-lg border-4 border-green-500"
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase border-2 ${getStatusColor(selectedSubmission)}`}>
                  <FontAwesomeIcon icon={getStatusIcon(selectedSubmission)} />
                  {getStatusLabel(selectedSubmission)}
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
