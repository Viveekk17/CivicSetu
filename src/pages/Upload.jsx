import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera, faImage, faTimes, faCheckCircle, faSpinner,
  faMapMarkerAlt, faTrash, faWater, faWind, faSeedling,
  faEdit, faWeightHanging, faCoins, faLeaf, faClock, faHistory,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { analyzePhotos, createSubmission } from '../services/submissionService';
import { getStoredUser, searchUsers } from '../services/authService'; // Updated import
import { startCamera, stopCamera, capturePhoto, isCameraAvailable } from '../utils/cameraService';
import { getCurrentLocation, reverseGeocode, isGeolocationAvailable } from '../utils/locationService';
import { checkDuplicateImage } from '../services/submissionService';
import SparkMD5 from 'spark-md5';


const Upload = () => {
  const navigate = useNavigate();
  const routeLocation = useLocation(); // Renamed to avoid using 'location' state

  // Custom hook to resume draft from navigation state
  useEffect(() => {
    if (routeLocation.state?.resumeDraft) {
      handleResumeDraft(routeLocation.state.resumeDraft);
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [routeLocation.state]);

  const user = getStoredUser();
  const videoRef = useRef(null);
  const [currentStream, setCurrentStream] = useState(null);

  // Photos
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null); // 'before' or 'after'

  // Location
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [locationError, setLocationError] = useState('');

  // Drafts
  const [drafts, setDrafts] = useState([]);

  // Group Activity
  const [memberCount, setMemberCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload flow
  const [step, setStep] = useState(1); // 1 = capture, 2 = review AI data
  const [analyzing, setAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const typeIcons = {
    garbage: { icon: faTrash, color: 'text-blue-500', bg: 'bg-blue-50' },
    water: { icon: faWater, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    methane: { icon: faWind, color: 'text-gray-500', bg: 'bg-gray-50' },
    restoration: { icon: faSeedling, color: 'text-green-500', bg: 'bg-green-50' }
  };

  // Get location on mount
  useEffect(() => {
    if (isGeolocationAvailable()) {
      getCurrentLocation()
        .then(async (coords) => {
          setLocation(coords);
          const name = await reverseGeocode(coords.lat, coords.lng);
          setLocationName(name);
        })
        .catch((err) => {
          setLocationError(err.message);
          setLocationName('Location unavailable');
        });
    } else {
      setLocationError('Geolocation not supported');
      setLocationName('Location unavailable');
    }

    // Load drafts
    const savedDrafts = localStorage.getItem('eco_trace_drafts');
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (currentStream) {
        stopCamera(currentStream);
      }
    };
  }, [currentStream]);

  // Helpers for Drafts
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Draft Actions
  const handleSaveDraft = async () => {
    if (!beforePhoto) return;

    try {
      const base64 = await blobToBase64(beforePhoto.file);
      const newDraft = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        locationName,
        location,
        beforePhoto: base64
      };

      const updatedDrafts = [newDraft, ...drafts];
      setDrafts(updatedDrafts);
      localStorage.setItem('eco_trace_drafts', JSON.stringify(updatedDrafts));

      // Reset
      setBeforePhoto(null);

      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: {
          type: 'success',
          title: 'Draft Saved',
          message: 'Cleanup saved to Recent Activity.'
        }
      }));
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Failed to save draft');
    }
  };

  const handleResumeDraft = (draft) => {
    try {
      const blob = dataURLtoBlob(draft.beforePhoto);
      const file = new File([blob], "before_photo.jpg", { type: "image/jpeg" });

      setBeforePhoto({
        file: file,
        preview: draft.beforePhoto // It's already a Data URL
      });

      if (draft.location) setLocation(draft.location);
      if (draft.locationName) setLocationName(draft.locationName);

      // Remove this specific draft from list when resumed so they don't double submit? 
      // User might want to keep it if they cancel? Let's keep it until submission.
      // But typically "resuming" implies moving it to active.
      // Let's delete it from drafts now to avoid confusion, or keep it?
      // Better to delete ONLY on successful submission? 
      // User requested "the before images should be stored in recent activity... make a section... after when user add after image through camera after submission in recently stored image will be deleted"
      // So delete AFTER submission.
    } catch (err) {
      console.error('Error resuming draft:', err);
      alert('Failed to load draft');
    }
  };

  const handleDeleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem('eco_trace_drafts', JSON.stringify(updated));
  };

  // Handle file selection from input
  const handleFileSelect = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      // Create a preview
      const previewUrl = URL.createObjectURL(file);
      const photoData = {
        file,
        preview: previewUrl,
        timestamp: new Date().toISOString()
      };

      if (target === 'before') {
        setBeforePhoto(photoData);
      } else {
        setAfterPhoto(photoData);
      }
    }
  };

  // Calculate MD5 hash of file
  const calculateImageHash = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const spark = new SparkMD5.ArrayBuffer();
        spark.append(e.target.result);
        resolve(spark.end());
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Open camera
  const openCamera = async (target) => {
    if (!isCameraAvailable()) {
      alert('Camera not available on this device');
      return;
    }

    try {
      setCameraTarget(target);
      setShowCamera(true);

      // Wait a bit for modal to render
      setTimeout(async () => {
        const stream = await startCamera(videoRef.current);
        setCurrentStream(stream);

        // Wait for video to be ready
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }
      }, 100);
    } catch (err) {
      alert(err.message);
      setShowCamera(false);
    }
  };

  // Capture from camera
  const handleCapture = async () => {
    try {
      if (!videoRef.current || !videoRef.current.videoWidth) {
        alert('Camera not ready. Please wait a moment and try again.');
        return;
      }

      const photoData = await capturePhoto(videoRef.current);

      if (cameraTarget === 'before') {
        setBeforePhoto(photoData);
      } else {
        setAfterPhoto(photoData);
      }

      closeCamera();
    } catch (err) {
      console.error('Capture error:', err);
      alert('Failed to capture photo: ' + err.message);
    }
  };

  // Close camera
  const closeCamera = () => {
    if (currentStream) {
      stopCamera(currentStream);
      setCurrentStream(null);
    }
    setShowCamera(false);
    setCameraTarget(null);
  };

  // Remove photos
  const removePhoto = (target) => {
    if (target === 'before' && beforePhoto) {
      URL.revokeObjectURL(beforePhoto.preview);
      setBeforePhoto(null);
    } else if (target === 'after' && afterPhoto) {
      URL.revokeObjectURL(afterPhoto.preview);
      setAfterPhoto(null);
    }
  };

  // Analyze with AI (preview only, don't save)
  const handleAnalyze = async () => {
    if (!beforePhoto || !afterPhoto) {
      alert('Please upload both Before and After photos');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');

      // 1. Calculate hashes
      const beforeHash = await calculateImageHash(beforePhoto.file);
      const afterHash = await calculateImageHash(afterPhoto.file);
      const hashes = [beforeHash, afterHash];

      // 2. Check for duplicates
      console.log('Checking for duplicates with hashes:', hashes);
      const duplicateCheck = await checkDuplicateImage(hashes);

      if (duplicateCheck.exists) {
        // Trigger duplicate error notification
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: {
            type: 'error',
            title: 'Duplicate Image',
            message: duplicateCheck.message
          }
        }));
        setError(duplicateCheck.message);
        setAnalyzing(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('photos', beforePhoto.file);
      formData.append('photos', afterPhoto.file);
      formData.append('imageHashes', JSON.stringify(hashes)); // Send to backend for saving
      formData.append('type', 'garbage'); // Temporary, AI will detect
      formData.append('weight', 1);
      formData.append('location', JSON.stringify({
        name: locationName,
        coordinates: location || { lat: 0, lng: 0 }
      }));

      // Call analyze endpoint (doesn't save to database)
      const response = await analyzePhotos(formData);

      if (response.success) {
        // Extract AI data from verification
        const verification = response.data.verification;

        // ============================================
        // 🔍 DEBUG: AI Analysis Summary
        // ============================================
        console.group('🤖 AI Analysis Results');
        console.log(`✅ Status: ${verification.verified ? 'Verified' : 'Rejected'}`);
        console.log(`🏷️ Category: ${verification.category}`);
        console.log(`⚖️ Weight: ${verification.trashWeight} kg`);
        console.log(`🪙 Credits: ${verification.credits}`);
        console.log(`🌱 CO2 Saved: ${verification.co2Saved?.toFixed(2)} kg`);
        console.log(`📝 Description: ${verification.suggestedDescription || verification.notes}`);
        console.log(`📊 Confidence: ${(verification.confidence * 100).toFixed(1)}%`);
        console.groupEnd();

        setAiData({
          category: verification.category || 'NA',
          weight: verification.trashWeight || 0,
          description: verification.suggestedDescription || verification.notes,
          co2Saved: verification.co2Saved || 0,
          credits: verification.credits || 0,
          photos: response.data.photos // Save photo paths for final submission
        });

        setStep(2);
      } else {
        // Check if error is fraud-related
        const errorMsg = response.message || 'Analysis failed';
        if (errorMsg.toLowerCase().includes('fraud') || errorMsg.toLowerCase().includes('ai generated') || errorMsg.toLowerCase().includes('fake')) {
          const fraudMessage = '❌ Fraud images are not accepted. Please upload genuine before and after photos of your environmental cleanup work.';
          setError(fraudMessage);

          // Trigger fraud detection notification
          window.dispatchEvent(new CustomEvent('newNotification', {
            detail: {
              type: 'error',
              title: 'Fraud Detected',
              message: 'AI detected that the uploaded images may be fake or AI-generated. Please upload genuine photos of your cleanup work.'
            }
          }));
        } else {
          setError(errorMsg);

          // Trigger general error notification
          window.dispatchEvent(new CustomEvent('newNotification', {
            detail: {
              type: 'error',
              title: 'Analysis Failed',
              message: errorMsg
            }
          }));
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err.message || 'Failed to analyze images';
      setError(errorMessage);

      // Trigger error notification
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: {
          type: 'error',
          title: 'Analysis Error',
          message: errorMessage
        }
      }));
    } finally {
      setAnalyzing(false);
    }
  };

  // Final submission (actually save to database)
  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Create final submission with confirmed data
      const formData = new FormData();

      // 1. Append text data FIRST (Best practice for some parsers)
      formData.append('type', aiData.category);
      formData.append('weight', aiData.weight);
      formData.append('location', JSON.stringify({
        name: locationName,
        coordinates: location || { lat: 0, lng: 0 }
      }));
      formData.append('description', aiData.description);

      // Calculate member count from tagged users (including self)
      const totalMembers = taggedUsers.length + 1;
      formData.append('memberCount', totalMembers);
      formData.append('taggedUsers', JSON.stringify(taggedUsers.map(u => u._id))); // Send array of IDs

      // Calculate hashes again for submission (or store in state - recalculating is safer/easier dev)
      const beforeHash = await calculateImageHash(beforePhoto.file);
      const afterHash = await calculateImageHash(afterPhoto.file);
      const hashes = [beforeHash, afterHash];
      formData.append('imageHashes', JSON.stringify(hashes));

      const verData = JSON.stringify({
        verified: true,
        category: aiData.category,
        trashWeight: aiData.weight,
        weight: aiData.weight,
        credits: aiData.credits,
        co2Saved: aiData.co2Saved,
        confidence: 0.95,
        suggestedDescription: aiData.description,
        notes: 'Verified by AI (Confirmed by User)'
      });
      formData.append('verificationData', verData);

      // 🔍 DEBUG: Log what we are sending
      console.log('📤 Sending Submission...');
      console.log('Text Fields:', {
        type: aiData.category,
        weight: aiData.weight,
        verificationData: JSON.parse(verData)
      });

      // 2. Append Files LAST
      formData.append('photos', beforePhoto.file);
      formData.append('photos', afterPhoto.file);

      const response = await createSubmission(formData);

      if (response.success) {
        // Remove from drafts if this matches a draft (fuzzy match or just cleanup)
        // Ideally we track which draft ID was active, but for now let's just 
        // find a draft with matching "before" photo or just rely on user manually deleting?
        // Actually, the requirement said "after submission... recently stored image will be deleted".
        // Let's find if the current beforePhoto matches any draft and delete it.
        // Doing a simple check on base64 is expensive. 
        // Let's just delete the most recent draft if it matches location?
        // Or better: pass `draftId` if we resumed one.
        // For simplicity, I'll just clear the drafts that match the exact location/time?
        // No, let's keep it simple: The user just submitted, if they came from a draft we should know.
        // I won't overengineer the matching right now.
        // But wait, the requirement is specific on deletion.
        // "after submission in recently stored image will be deleted"

        // Let's just TRY to find a draft that looks like this one (same timestamp? no).
        // I will implement a "activeDraftId" state to track this.

        // Update user credits in localStorage
        const updatedUser = {
          ...user,
          credits: user.credits + response.data.creditsAwarded
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Dispatch custom event to update header credits and notification
        window.dispatchEvent(new CustomEvent('creditsUpdated', {
          detail: { credits: response.data.creditsAwarded }
        }));

        // Add success notification
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: {
            type: 'success',
            title: 'Submission Verified!',
            message: `Your ${aiData.category} cleanup has been verified. You earned ${response.data.creditsAwarded} credits and saved ${aiData.co2Saved?.toFixed(1)} kg of CO₂!`
          }
        }));

        // Show success
        setResult({
          credits: response.data.creditsAwarded,
          co2Saved: aiData.co2Saved,
          category: aiData.category
        });
      } else {
        setError(response.message || 'Submission failed');

        // Add error notification
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: {
            type: 'error',
            title: 'Submission Failed',
            message: response.message || 'Failed to submit your cleanup photos. Please try again.'
          }
        }));
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  // Track active draft for deletion
  const [activeDraftId, setActiveDraftId] = useState(null);

  // Hook into success to delete draft
  useEffect(() => {
    if (result && activeDraftId) {
      handleDeleteDraft(activeDraftId);
      setActiveDraftId(null);
    }
  }, [result]);

  // Success screen
  if (result) {
    const typeInfo = typeIcons[result.category] || typeIcons.garbage;

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 text-5xl mb-6"
        >
          <FontAwesomeIcon icon={faCheckCircle} />
        </motion.div>
        <h2 className="text-3xl font-bold mb-2">Submission Verified!</h2>
        <p className="text-gray-500 mb-2">You've earned {result.credits} credits!</p>
        <p className="text-sm text-gray-400 mb-8">
          CO₂ Saved: {result.co2Saved?.toFixed(1)} kg
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50"
          >
            Upload More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            style={{ zIndex: 9999 }}
          >
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={closeCamera}
                className="absolute top-4 right-4 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center z-10 hover:bg-red-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>

              {/* Instructions */}
              <div className="absolute top-4 left-4 px-4 py-2 rounded-lg z-10" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {cameraTarget === 'before' ? '📷 Before Photo' : '📷 After Photo'}
                </p>
              </div>

              {/* Video Preview */}
              <div className="relative w-full max-w-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl shadow-2xl"
                  style={{ maxHeight: '70vh' }}
                />
              </div>

              {/* Capture Button */}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={handleCapture}
                  className="px-12 py-4 bg-emerald-500 text-white rounded-full font-bold text-lg shadow-lg hover:bg-emerald-600 transition-colors flex items-center gap-3"
                >
                  <FontAwesomeIcon icon={faCamera} size="lg" />
                  Capture Photo
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* STEP 1: CAPTURE PHOTOS */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="card p-8">
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Environmental Impact Upload</h2>
              <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Capture or upload before & after photos to verify your impact</p>

              <div className="mb-8 p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500 text-xl" />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Location</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{locationName}</p>
                  {locationError && (
                    <p className="text-xs text-red-500 mt-1">{locationError}</p>
                  )}
                </div>
              </div>

              {/* Drafts / Recent Activity Section */}
              {drafts.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FontAwesomeIcon icon={faHistory} className="text-blue-500" />
                    Ongoing Cleanups (Recent Activity)
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {drafts.map(draft => (
                      <div key={draft.id} className="min-w-[200px] p-3 rounded-xl border relative group" style={{ borderColor: 'var(--border-medium)', backgroundColor: 'var(--bg-card)' }}>
                        <div className="h-32 mb-2 rounded-lg overflow-hidden relative">
                          <img src={draft.beforePhoto} alt="Draft" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs font-bold truncate mb-1" style={{ color: 'var(--text-primary)' }}>{draft.locationName}</p>
                        <p className="text-[10px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <FontAwesomeIcon icon={faClock} className="mr-1" />
                          {new Date(draft.timestamp).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleResumeDraft(draft);
                              setActiveDraftId(draft.id);
                            }}
                            className="flex-1 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="px-2 py-1 bg-red-50 text-red-500 rounded text-xs hover:bg-red-100"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo Upload Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Before Photo */}
                <PhotoUploadCard
                  title="Before Photo"
                  photo={beforePhoto}
                  onRemove={() => removePhoto('before')}
                  onCamera={() => openCamera('before')}
                  onFileSelect={(e) => handleFileSelect(e, 'before')}
                  color="red"
                />

                {/* After Photo */}
                <PhotoUploadCard
                  title="After Photo"
                  photo={afterPhoto}
                  onRemove={() => removePhoto('after')}
                  onCamera={() => openCamera('after')}
                  onFileSelect={(e) => handleFileSelect(e, 'after')}
                  color="green"
                />
              </div>

              {/* Group Activity - User Tagging */}
              <div className="mb-8">
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Tag Members (Total: {taggedUsers.length + 1})
                </label>

                {/* Search Input */}
                <div className="relative mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-full p-3 rounded-xl border border-gray-300"
                      placeholder="Search users by name..."
                      value={searchQuery}
                      onChange={async (e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.length > 2) {
                          setIsSearching(true);
                          try {
                            const res = await searchUsers(e.target.value);
                            if (res.success) {
                              // Filter out already tagged users
                              const available = res.data.filter(u => !taggedUsers.find(t => t._id === u._id));
                              setSearchResults(available);
                            }
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsSearching(false);
                          }
                        } else {
                          setSearchResults([]);
                        }
                      }}
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                      {searchResults.map(user => (
                        <div
                          key={user._id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                          onClick={() => {
                            setTaggedUsers([...taggedUsers, user]);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                        >
                          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tagged Users List */}
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold border border-emerald-200 flex items-center">
                    You (Owner)
                  </div>
                  {taggedUsers.map(user => (
                    <div key={user._id} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100 flex items-center gap-2">
                      {user.name}
                      <button
                        onClick={() => setTaggedUsers(taggedUsers.filter(u => u._id !== user._id))}
                        className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center hover:bg-blue-300"
                      >
                        <FontAwesomeIcon icon={faTimes} size="xs" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Credits will be distributed to all {taggedUsers.length + 1} members.
                </p>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!beforePhoto || !afterPhoto || analyzing}
                className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--gradient-primary)' }}
              >
                {analyzing ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Processing...(we are still working on Analysing AI and Fake Images)
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faLeaf} />
                    Upload
                  </>
                )}
              </button>

              {/* Save For Later Button */}
              {beforePhoto && !afterPhoto && (
                <button
                  onClick={handleSaveDraft}
                  className="w-full mt-3 py-3 rounded-xl font-bold border-2 border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faClock} />
                  Save for Later (Draft)
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: REVIEW AI DATA */}
        {step === 2 && aiData && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="card p-8">
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>AI Verification Results</h2>
              <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Review the AI-generated analysis before submitting</p>

              {/* Photos Preview */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Before</p>
                  <img src={beforePhoto.preview} alt="Before" className="w-full h-48 object-cover rounded-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">After</p>
                  <img src={afterPhoto.preview} alt="After" className="w-full h-48 object-cover rounded-xl" />
                </div>
              </div>

              {/* AI Analysis */}
              <div className="space-y-4 mb-8">
                {/* Category */}
                <div className="p-4 rounded-xl flex items-center gap-4 border" style={{ backgroundColor: 'var(--bg-body)', borderColor: 'var(--border-light)' }}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeIcons[aiData.category]?.bg} dark:bg-opacity-20`}>
                    <FontAwesomeIcon
                      icon={typeIcons[aiData.category]?.icon || faTrash}
                      className={`text-xl ${typeIcons[aiData.category]?.color}`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Category</p>
                    <p className="font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{aiData.category}</p>
                  </div>
                </div>

                {/* Weight */}
                {/* Weight */}
                <div className="p-4 rounded-xl flex items-center gap-4 border" style={{ backgroundColor: 'var(--bg-body)', borderColor: 'var(--border-light)' }}>
                  <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                    <FontAwesomeIcon icon={faWeightHanging} className="text-xl text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estimated Weight</p>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{aiData.weight} kg</p>
                  </div>
                </div>

                {/* Credits */}
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center gap-4 border border-green-100 dark:border-green-800/50">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-800 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCoins} className="text-xl text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Credits Earned (Per Person)</p>
                    {(() => {
                      const members = taggedUsers.length + 1;
                      const base = aiData.credits || 0;
                      let pool = base;
                      if (members > 1) {
                        pool = base * (1 + (members - 1) * 0.1);
                      }
                      const perPerson = Math.ceil(pool / members);
                      return <p className="font-bold text-green-600 dark:text-green-400">{perPerson} Credits</p>;
                    })()}
                  </div>
                </div>

                {/* Description */}
                {/* Description */}
                <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-body)', borderColor: 'var(--border-light)' }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>AI Description</p>
                  <p style={{ color: 'var(--text-primary)' }}>{aiData.description}</p>
                </div>

                {/* CO2 Saved */}
                {aiData.co2Saved > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Environmental Impact</p>
                    <p className="font-bold text-blue-800 dark:text-blue-300">🌱 CO₂ Saved: {aiData.co2Saved.toFixed(1)} kg</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {submitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Photo Upload Card Component (Refactored: Camera Only)
const PhotoUploadCard = ({ title, photo, onRemove, onCamera, onFileSelect, color }) => {
  const colorClasses = {
    red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' }
  };

  const colors = colorClasses[color] || colorClasses.red;

  return (
    <div>
      <h3 className="font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
      {!photo ? (
        <div className={`border-2 border-dashed rounded-xl p-6 h-64 flex flex-col items-center justify-center gap-4`} style={{ borderColor: 'var(--border-medium)' }}>
          <FontAwesomeIcon icon={faImage} className={`text-4xl ${colors.icon}`} />
          <p className="text-center" style={{ color: 'var(--text-tertiary)' }}>Click below to upload or capture</p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3">
              {isCameraAvailable() && (
                <button
                  onClick={onCamera}
                  className={`px-6 py-2 rounded-lg ${colors.bg} ${colors.icon} font-bold hover:opacity-80 transition-opacity flex items-center gap-2 shadow-sm`}
                >
                  <FontAwesomeIcon icon={faCamera} className="text-lg" />
                  <span>Camera</span>
                </button>
              )}
              <label className={`px-6 py-2 rounded-lg ${colors.bg} ${colors.icon} font-bold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-2 shadow-sm`}>
                <FontAwesomeIcon icon={faImage} className="text-lg" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
              </label>
            </div>
            <p className="text-[10px] text-gray-400 max-w-[200px] text-center italic">
              (upload from device option is only kept for judges to test the working of website)
            </p>
          </div>
        </div>

      ) : (
        <div className="relative group h-64">
          <img
            src={photo.preview}
            alt={title}
            className="w-full h-full object-cover rounded-xl"
          />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <div className={`absolute bottom-2 left-2 ${colors.bg} px-3 py-1 rounded-full text-sm font-bold ${colors.icon}`}>
            {title}
          </div>
        </div>
      )
      }
    </div >
  );
};

export default Upload;
