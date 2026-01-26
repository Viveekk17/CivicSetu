import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, faImage, faTimes, faCheckCircle, faSpinner, 
  faMapMarkerAlt, faTrash, faWater, faWind, faSeedling,
  faEdit, faWeightHanging, faCoins, faLeaf
} from '@fortawesome/free-solid-svg-icons';
import { analyzePhotos, createSubmission } from '../services/submissionService';
import { getStoredUser } from '../services/authService';
import { startCamera, stopCamera, capturePhoto, isCameraAvailable } from '../utils/cameraService';
import { getCurrentLocation, reverseGeocode, isGeolocationAvailable } from '../utils/locationService';

const Upload = () => {
  const navigate = useNavigate();
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
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (currentStream) {
        stopCamera(currentStream);
      }
    };
  }, [currentStream]);

  // Handle file upload
  const handleFileSelect = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const photoData = {
        file,
        preview: URL.createObjectURL(file)
      };
      
      if (target === 'before') {
        setBeforePhoto(photoData);
      } else {
        setAfterPhoto(photoData);
      }
    }
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

      // Create FormData
      const formData = new FormData();
      formData.append('photos', beforePhoto.file);
      formData.append('photos', afterPhoto.file);
      formData.append('type', 'garbage'); // Temporary, AI will detect
      formData.append('weight', 1);
      formData.append('location', JSON.stringify({
        name: locationName,
        coordinates: location || { lat: 0, lng: 0 }
      }));

      // Call analyze endpoint (doesn't save to database)
      const response = await analyzePhotos(formData);

      if (response.success) {
        // ============================================
        // 🔍 DEBUG: Print AI analysis response
        // ============================================
        console.log('\n========== AI ANALYSIS RESPONSE ==========');
        console.log('Full Response:', JSON.stringify(response, null, 2));
        console.log('========================================\n');

        // Extract AI data from verification
        const verification = response.data.verification;
        
        // Check if AI detected fraud
        if (verification.isFraud || verification.category === 'fraud' || (verification.notes && verification.notes.toLowerCase().includes('fraud')) || (verification.notes && verification.notes.toLowerCase().includes('ai generated'))) {
          setError('❌ Fraud images are not accepted. Please upload genuine before and after photos of your environmental cleanup work.');
          return;
        }
        
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
          setError('❌ Fraud images are not accepted. Please upload genuine before and after photos of your environmental cleanup work.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze images');
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
      formData.append('photos', beforePhoto.file);
      formData.append('photos', afterPhoto.file);
      formData.append('type', aiData.category);
      formData.append('weight', aiData.weight);
      formData.append('location', JSON.stringify({
        name: locationName,
        coordinates: location || { lat: 0, lng: 0 }
      }));
      formData.append('description', aiData.description);

      const response = await createSubmission(formData);

      if (response.success) {
        // Update user credits in localStorage
        const updatedUser = {
          ...user,
          credits: user.credits + response.data.creditsAwarded
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch custom event to update header credits
        window.dispatchEvent(new CustomEvent('creditsUpdated', {
          detail: { credits: updatedUser.credits }
        }));
        
        // Show success
        setResult({
          credits: response.data.creditsAwarded,
          co2Saved: aiData.co2Saved,
          category: aiData.category
        });
      } else {
        setError(response.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

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
              <h2 className="text-3xl font-bold mb-2">Environmental Impact Upload</h2>
              <p className="text-gray-500 mb-8">Capture or upload before & after photos to verify your impact</p>

              {/* Location Display */}
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
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faLeaf} />
                    Analyze Impact
                  </>
                )}
              </button>
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
              <h2 className="text-3xl font-bold mb-2">AI Verification Results</h2>
              <p className="text-gray-500 mb-8">Review the AI-generated analysis before submitting</p>

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
                <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeIcons[aiData.category]?.bg}`}>
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
                <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}>
                  <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                    <FontAwesomeIcon icon={faWeightHanging} className="text-xl text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estimated Weight</p>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{aiData.weight} kg</p>
                  </div>
                </div>

                {/* Credits */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center gap-4" style={{ border: '1px solid var(--primary)' }}>
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCoins} className="text-xl text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Credits Earned</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{aiData.credits} Credits</p>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>AI Description</p>
                  <p style={{ color: 'var(--text-primary)' }}>{aiData.description}</p>
                </div>

                {/* CO2 Saved */}
                {aiData.co2Saved > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl" style={{ border: '1px solid var(--secondary)' }}>
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

// Photo Upload Card Component
const PhotoUploadCard = ({ title, photo, onRemove, onCamera, onFileSelect, color }) => {
  const colorClasses = {
    red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' }
  };

  const colors = colorClasses[color] || colorClasses.red;

  return (
    <div>
      <h3 className="font-bold mb-3 text-gray-700">{title}</h3>
      {!photo ? (
        <div className={`border-2 border-dashed ${colors.border} rounded-xl p-6 h-64 flex flex-col items-center justify-center gap-4`}>
          <FontAwesomeIcon icon={faImage} className={`text-4xl ${colors.icon}`} />
          <p className="text-gray-600 text-center">Click below to upload or capture</p>
          <div className="flex gap-3">
            {isCameraAvailable() && (
              <button
                onClick={onCamera}
                className={`px-6 py-2 rounded-lg ${colors.bg} ${colors.icon} font-bold hover:opacity-80 transition-opacity`}
              >
                <FontAwesomeIcon icon={faCamera} className="mr-2" />
                Camera
              </button>
            )}
            <label className={`px-6 py-2 rounded-lg ${colors.bg} ${colors.icon} font-bold hover:opacity-80 transition-opacity cursor-pointer`}>
              <FontAwesomeIcon icon={faImage} className="mr-2" />
              Upload
              <input type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
            </label>
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
      )}
    </div>
  );
};

export default Upload;
