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
import { getStoredUser, searchUsers } from '../services/authService';
import { useLanguage } from '../context/LanguageContext';
import { startCamera, stopCamera, capturePhoto, isCameraAvailable } from '../utils/cameraService';
import { getCurrentLocation, reverseGeocode, isGeolocationAvailable } from '../utils/locationService';
import { checkDuplicateImage } from '../services/submissionService';
import { searchCommunities } from '../services/api';
import SparkMD5 from 'spark-md5';
import axios from 'axios';

const SKIP_AI_ANALYSIS = false;

// Cleanup protocols — caps per collaboration mode.
// `maxWeightKg`     hard ceiling on total cleanup weight reported in this mode
// `maxCreditsPerPerson` cap on credits any single participant can take home
// `minMembers`/`maxMembers` participant-count bounds (members mode only)
// These are enforced both in the UI (warnings + disabled submit) and on
// final validation in handleConfirmSubmit.
const COLLAB_PROTOCOLS = {
  solo: {
    label: 'Solo',
    maxWeightKg: 20,
    maxCreditsPerPerson: 1000,
    blurb: 'One-person cleanup. Full credits to you.',
  },
  members: {
    label: 'Members',
    maxWeightKg: 50,
    maxCreditsPerPerson: 750,
    minMembers: 2,
    maxMembers: 10,
    blurb: 'Tag 2–10 teammates. Credits split equally.',
  },
  community: {
    label: 'Community',
    maxWeightKg: 150,
    maxCreditsPerPerson: 600,
    blurb: 'Tag a registered community. Coordinated drive.',
  },
  ngo: {
    label: 'NGO',
    maxWeightKg: 1000,
    maxCreditsPerPerson: 500,
    blurb: 'Tag a verified NGO. Required for 50 kg+ cleanups.',
  },
};


const Upload = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const routeLocation = useLocation();

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
  const [areaCriticality, setAreaCriticality] = useState('low');
  const [zoneName, setZoneName] = useState('');

  // Credit Calculation State
  const [weightKg, setWeightKg] = useState(0);
  const [wasteType, setWasteType] = useState('general');
  const [submissionType, setSubmissionType] = useState('individual');
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  const [creditBreakdown, setCreditBreakdown] = useState(null);

  // Drafts
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // Group Activity
  const [memberCount, setMemberCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload flow
  const [step, setStep] = useState(1); // 1 = capture, 2 = review AI data
  const [analyzing, setAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Public Feed & Tagging
  const [shareToFeed, setShareToFeed] = useState(true);
  const [feedDescription, setFeedDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState(['before', 'after']);

  // Tagging System States
  const [enableTagging, setEnableTagging] = useState(false);
  const [taggingMode, setTaggingMode] = useState('members'); // 'members', 'community', 'ngo'
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [taggedCommunities, setTaggedCommunities] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [communityQuery, setCommunityQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [communityResults, setCommunityResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isSearchingCommunity, setIsSearchingCommunity] = useState(false);

  const typeIcons = {
    garbage: { icon: faTrash, color: 'text-blue-500', bg: 'bg-blue-50' },
    water: { icon: faWater, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    methane: { icon: faWind, color: 'text-gray-500', bg: 'bg-gray-50' },
    restoration: { icon: faSeedling, color: 'text-green-500', bg: 'bg-green-50' }
  };

  // Active collaboration mode (solo/members/community/ngo).
  const currentCollabMode = enableTagging ? taggingMode : 'solo';
  const currentProtocol = COLLAB_PROTOCOLS[currentCollabMode];

  // Participant count under the active mode.
  const participantCount =
    currentCollabMode === 'solo' ? 1
    : currentCollabMode === 'members' ? Math.max(1, taggedUsers.length + 1)
    : Math.max(1, taggedCommunities.length || 1);

  // Per-person credits after split, capped by protocol.
  const projectedCreditsPerPerson = Math.min(
    Math.floor((estimatedCredits || 0) / participantCount),
    currentProtocol.maxCreditsPerPerson
  );

  // Validation — true means user can submit, false blocks.
  const validateProtocol = () => {
    const errors = [];
    if (Number(weightKg) > currentProtocol.maxWeightKg) {
      errors.push(`${currentProtocol.label} mode caps cleanups at ${currentProtocol.maxWeightKg} kg. Switch modes for larger drives.`);
    }
    if (currentCollabMode === 'members') {
      const total = taggedUsers.length + 1;
      if (total < currentProtocol.minMembers) errors.push(`Tag at least ${currentProtocol.minMembers - 1} more teammate${currentProtocol.minMembers - 1 === 1 ? '' : 's'}.`);
      if (total > currentProtocol.maxMembers) errors.push(`Members mode allows up to ${currentProtocol.maxMembers} participants.`);
    }
    if ((currentCollabMode === 'community' || currentCollabMode === 'ngo') && taggedCommunities.length === 0) {
      errors.push(`Tag at least one ${currentProtocol.label.toLowerCase()} to proceed.`);
    }
    return errors;
  };
  const protocolErrors = validateProtocol();

  // Debounced member search.
  useEffect(() => {
    if (!enableTagging || taggingMode !== 'members') return;
    const q = userQuery.trim();
    if (q.length < 2) { setUserResults([]); return; }
    setIsSearchingUser(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(q);
        const list = res?.data || res?.users || res || [];
        setUserResults(Array.isArray(list) ? list.slice(0, 6) : []);
      } catch { setUserResults([]); }
      finally { setIsSearchingUser(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, enableTagging, taggingMode]);

  // Debounced community/NGO search.
  useEffect(() => {
    if (!enableTagging || (taggingMode !== 'community' && taggingMode !== 'ngo')) return;
    const q = communityQuery.trim();
    if (q.length < 2) { setCommunityResults([]); return; }
    setIsSearchingCommunity(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchCommunities(q);
        const list = res?.data || res?.communities || res || [];
        const filtered = (Array.isArray(list) ? list : []).filter(c => {
          const isNgo = c.isNGO || c.type === 'ngo' || c.category === 'ngo';
          return taggingMode === 'ngo' ? isNgo : !isNgo;
        });
        setCommunityResults(filtered.slice(0, 6));
      } catch { setCommunityResults([]); }
      finally { setIsSearchingCommunity(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [communityQuery, enableTagging, taggingMode]);

  const addUser = (u) => {
    if (taggedUsers.find(x => x._id === u._id)) return;
    setTaggedUsers([...taggedUsers, u]);
    setUserQuery('');
    setUserResults([]);
  };
  const removeUser = (id) => setTaggedUsers(taggedUsers.filter(u => u._id !== id));
  const addCommunity = (c) => {
    if (taggedCommunities.find(x => x._id === c._id)) return;
    setTaggedCommunities([...taggedCommunities, c]);
    setCommunityQuery('');
    setCommunityResults([]);
  };
  const removeCommunity = (id) => setTaggedCommunities(taggedCommunities.filter(c => c._id !== id));

  // Live Credit Estimator Hook
  useEffect(() => {
    const fetchEstimate = async () => {
      if (weightKg <= 0) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/credits/estimate`, {
          params: {
            weightKg,
            wasteType,
            submissionType,
            participantCount: taggedUsers.length + 1,
            lat: location?.lat,
            lng: location?.lng,
            userId: user?.id || user?._id
          }
        });
        if (res.data.success) {
          setEstimatedCredits(res.data.data.totalCredits);
          setCreditBreakdown(res.data.data.breakdown);
        }
      } catch (err) {
        console.error('Estimate error:', err);
      }
    };

    const timer = setTimeout(fetchEstimate, 500);
    return () => clearTimeout(timer);
  }, [weightKg, wasteType, submissionType, taggedUsers.length, location, user]);

  // Get location on mount
  useEffect(() => {
    if (isGeolocationAvailable()) {
      getCurrentLocation()
        .then(async (coords) => {
          setLocation(coords);
          const name = await reverseGeocode(coords.lat, coords.lng);
          setLocationName(name);

          // Fetch Area Criticality
          try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones/criticality?lat=${coords.lat}&lng=${coords.lng}`);
            if (res.data.success) {
              setAreaCriticality(res.data.data.criticality);
              setZoneName(res.data.data.name);
            }
          } catch (err) {
            console.error('Error fetching criticality:', err);
          }
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

      // TEMP: bypass AI verification API for local testing.
      if (SKIP_AI_ANALYSIS) {
        const mockWeight = Number(weightKg) || 5;
        const mockCredits = Number(estimatedCredits) || Math.round(mockWeight * 10);
        setAiData({
          category: wasteType || 'general',
          weight: mockWeight,
          description: `Mock analysis: ${mockWeight} kg of ${wasteType || 'general'} waste cleaned (AI bypassed for testing).`,
          co2Saved: parseFloat((mockWeight * 0.5).toFixed(2)),
          credits: mockCredits,
          photos: [
            { url: beforePhoto.preview, type: 'before' },
            { url: afterPhoto.preview, type: 'after' },
          ],
        });
        setEstimatedCredits(mockCredits);
        setStep(2);
        setAnalyzing(false);
        return;
      }

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
        //  DEBUG: AI Analysis Summary
        // ============================================
        console.group(' AI Analysis Results');
        console.log(` Status: ${verification.verified ? 'Verified' : 'Rejected'}`);
        console.log(`️ Category: ${verification.category}`);
        console.log(`️ Weight: ${verification.trashWeight} kg`);
        console.log(`🪙 Credits: ${verification.token}`);
        console.log(` CO2 Saved: ${typeof verification.co2Saved === 'number' ? verification.co2Saved.toFixed(2) : verification.co2Saved} kg`);
        console.log(` Description: ${verification.suggestedDescription || verification.notes}`);
        console.log(` Confidence: ${(verification.confidence * 100).toFixed(1)}%`);
        console.groupEnd();

        setAiData({
          category: verification.category || 'NA',
          weight: verification.trashWeight || 0,
          description: verification.suggestedDescription || verification.notes,
          co2Saved: parseFloat(verification.co2Saved) || 0,
          credits: verification.tokensEarned || verification.credits || 0,
          photos: response.data.photos // Save photo paths for final submission
        });

        // Sync AI data back to form state to fix display issue
        setWeightKg(verification.trashWeight || 0);
        setEstimatedCredits(verification.tokensEarned || verification.credits || 0);
        if (verification.category && verification.category !== 'invalid') {
          setWasteType(verification.category);
        }

        setStep(2);
      } else {
        // Check if error is fraud-related
        const errorMsg = response.message || 'Analysis failed';
        if (errorMsg.toLowerCase().includes('fraud') || errorMsg.toLowerCase().includes('ai generated') || errorMsg.toLowerCase().includes('fake')) {
          const fraudMessage = ' Fraud images are not accepted. Please upload genuine before and after photos of your environmental cleanup work.';
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
      // Protocol validation — same checks the UI surfaces.
      const errs = validateProtocol();
      if (errs.length > 0) {
        alert(`Submission blocked by protocol:\n\n• ${errs.join('\n• ')}`);
        return;
      }

      setSubmitting(true);
      setError('');


      // Create final submission with confirmed data
      const formData = new FormData();

      // 1. Append text data FIRST (Best practice for some parsers)
      formData.append('type', 'garbage'); // Core type is cleanup
      formData.append('wasteType', wasteType);
      formData.append('submissionType', submissionType);
      formData.append('weightKg', weightKg);
      formData.append('participantCount', taggedUsers.length + 1);
      formData.append('areaCriticality', areaCriticality);
      formData.append('location', JSON.stringify({
        name: locationName,
        coordinates: location || { lat: 0, lng: 0 }
      }));
      formData.append('description', aiData.description);

      // New tagging system data
      formData.append('taggingMode', taggingMode);
      if (taggingMode === 'members') {
        const totalMembers = taggedUsers.length + 1;
        formData.append('participantIds', JSON.stringify(taggedUsers.map(u => u._id)));
      } else if (taggingMode === 'community' || taggingMode === 'ngo') {
        formData.append('taggedCommunities', JSON.stringify(taggedCommunities.map(c => c._id)));
      }

      // Calculate hashes again for submission
      const beforeHash = await calculateImageHash(beforePhoto.file);
      const afterHash = await calculateImageHash(afterPhoto.file);
      const hashes = [beforeHash, afterHash];
      formData.append('imageHashes', JSON.stringify(hashes));

      const verData = JSON.stringify({
        verified: true,
        category: wasteType,
        trashWeight: weightKg,
        weight: weightKg,
        credits: estimatedCredits,
        tokensEarned: estimatedCredits, // Add this for consistency
        co2Saved: aiData.co2Saved,
        confidence: 0.95,
        suggestedDescription: aiData.description,
        notes: `User Claimed: ${weightKg}kg ${wasteType}. AI Suggestions: ${aiData.category} ${aiData.weight}kg`
      });
      formData.append('verificationData', verData);

      //  DEBUG: Log what we are sending
      console.log(' Sending Submission...');
      console.log('Text Fields:', {
        wasteType,
        weightKg,
        submissionType,
        areaCriticality
      });

      // 2. Append Files LAST
      formData.append('photos', beforePhoto.file);
      formData.append('photos', afterPhoto.file);

      const response = await createSubmission(formData);

      if (response.success) {
        // Add success notification
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: {
            type: 'success',
            title: 'Submission Sent for Review!',
            message: `Your ${wasteType} cleanup ticket (${response.data.ticketId}) has been registered.`
          }
        }));

        // Show success screen
        setResult({
          ticketId: response.data.ticketId,
          credits: estimatedCredits,
          co2Saved: aiData.co2Saved,
          category: wasteType
        });

        // Create post if shareToFeed is enabled
        if (shareToFeed) {
          const submissionId = response.data?._id || response.data?.id;
          const photosToShare = selectedPhotos.length > 0 ? selectedPhotos : ['before', 'after'];
          const description = feedDescription.trim() || `Cleaned up ${weightKg}kg of ${wasteType} waste. Every action counts!`;

          if (!submissionId) {
            console.error('Cannot share to feed: missing submission id', response);
          } else {
            try {
              const token = localStorage.getItem('token');
              const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
              await axios.post(
                `${baseUrl}/posts`,
                {
                  submissionId,
                  description,
                  selectedPhotos: photosToShare,
                  tags: taggedCommunities.map(c => c._id)
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              window.dispatchEvent(new CustomEvent('newNotification', {
                detail: {
                  type: 'success',
                  title: 'Shared to Public Feed',
                  message: 'Your cleanup post is now visible on the community feed.'
                }
              }));
            } catch (postError) {
              console.error('Failed to create post:', postError);
              const msg = postError?.response?.data?.message || 'Could not publish to the public feed.';
              window.dispatchEvent(new CustomEvent('newNotification', {
                detail: {
                  type: 'warning',
                  title: 'Feed Share Failed',
                  message: msg
                }
              }));
            }
          }
        }
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* SUBMISSION SUCCESS MODAL */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', boxShadow: '0 25px 80px -20px rgba(15,23,42,0.45)' }}
            >
              {/* Header band */}
              <div
                className="px-6 py-6 text-center text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)' }}
              >
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.4), transparent 70%)' }} />
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                  className="relative w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)' }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-3xl" style={{ color: 'var(--accent)' }} />
                </motion.div>
                <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">Ticket Registered</p>
                <h2 className="relative text-2xl font-black tracking-tight mt-1">Submission Successful</h2>
                <p className="relative font-mono text-sm mt-2 px-3 py-1 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  #{result.ticketId}
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* 24-hour notice */}
                <div className="flex items-start gap-3 p-3 rounded-lg mb-4" style={{ background: 'var(--primary-lighter)', border: '1px solid rgba(20,36,138,0.15)' }}>
                  <FontAwesomeIcon icon={faClock} className="mt-0.5" style={{ color: 'var(--primary)' }} />
                  <div className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>
                    <p className="font-bold mb-0.5">Verification within 24 hours</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Our admin team will review your photos and AI analysis. You'll be notified once a decision is made.</p>
                  </div>
                </div>

                {/* Email confirmation */}
                <div className="flex items-start gap-3 p-3 rounded-lg mb-4" style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}>
                  <FontAwesomeIcon icon={faCheckCircle} className="mt-0.5" style={{ color: '#059669' }} />
                  <div className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>
                    <p className="font-bold mb-0.5">Confirmation sent</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      A receipt with your ticket ID has been emailed to{' '}
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.email || 'your registered address'}</span>.
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Credits</p>
                    <p className="font-black tabular-nums text-lg" style={{ color: 'var(--primary)' }}>{result.credits}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>CO₂</p>
                    <p className="font-black tabular-nums text-lg" style={{ color: '#059669' }}>{(result.co2Saved || 0).toFixed(1)}<span className="text-[10px] ml-0.5">kg</span></p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</p>
                    <p className="font-black text-xs mt-1" style={{ color: '#ea580c' }}>PENDING</p>
                  </div>
                </div>

                {/* Action row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setResult(null); navigate('/submissions'); }}
                    className="btn btn-primary py-2.5 text-sm font-bold"
                  >
                    View Submissions
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-outline py-2.5 text-sm font-bold"
                  >
                    Upload Another
                  </button>
                </div>
                <button
                  onClick={() => { setResult(null); navigate('/dashboard'); }}
                  className="w-full text-center text-[11px] mt-3 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {cameraTarget === 'before' ? ' Before Photo' : ' After Photo'}
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
            <div className="card p-6 md:p-8 lg:p-10">
              {/* Header row — title left, location chip + drafts pill right */}
              <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--primary)' }}>
                    New Activity
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {t.upload_title}
                  </h2>
                  <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Capture <span className="font-semibold" style={{ color: '#dc2626' }}>before</span> & <span className="font-semibold" style={{ color: '#059669' }}>after</span> photos and submit your cleanup for review
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                    style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500" />
                    <span className="font-semibold truncate max-w-[180px]">{locationName}</span>
                  </div>
                  {drafts.length > 0 && (
                    <button
                      onClick={() => setShowDrafts(s => !s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
                    >
                      <FontAwesomeIcon icon={faHistory} />
                      {drafts.length} draft{drafts.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>

              {locationError && (
                <p className="text-xs text-red-500 mb-3">{locationError}</p>
              )}

              {/* Drafts drawer (collapsed by default to keep view single-viewport) */}
              <AnimatePresence initial={false}>
                {showDrafts && drafts.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-3 overflow-x-auto pb-3 mb-2">
                      {drafts.map(draft => (
                        <div
                          key={draft.id}
                          className="min-w-[160px] p-2 rounded-lg flex gap-2 items-center"
                          style={{ border: '1px solid var(--border-light)', background: 'var(--bg-body)' }}
                        >
                          <img src={draft.beforePhoto} alt="Draft" className="w-12 h-12 object-cover rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{draft.locationName}</p>
                            <div className="flex gap-1.5 mt-1">
                              <button
                                onClick={() => { handleResumeDraft(draft); setActiveDraftId(draft.id); setShowDrafts(false); }}
                                className="text-[10px] px-2 py-0.5 rounded font-bold"
                                style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
                              >
                                Resume
                              </button>
                              <button
                                onClick={() => handleDeleteDraft(draft.id)}
                                className="text-[10px] px-2 py-0.5 rounded font-bold"
                                style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MAIN GRID — photos (left, 7) + claim form + estimator (right, 5) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
                {/* Photos */}
                <div className="md:col-span-7 grid grid-cols-2 gap-3">
                  <PhotoUploadCard
                    title={t.upload_camera_before}
                    photo={beforePhoto}
                    onRemove={() => removePhoto('before')}
                    onCamera={() => openCamera('before')}
                    onFileSelect={(e) => handleFileSelect(e, 'before')}
                    color="red"
                  />
                  <PhotoUploadCard
                    title={t.upload_camera_after}
                    photo={afterPhoto}
                    onRemove={() => removePhoto('after')}
                    onCamera={() => openCamera('after')}
                    onFileSelect={(e) => handleFileSelect(e, 'after')}
                    color="green"
                  />
                </div>

                {/* Claim form + estimator stacked */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                      <FontAwesomeIcon icon={faWeightHanging} />
                      Approx Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-lg border text-lg font-bold tabular-nums focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-body)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'rgba(20,36,138,0.15)',
                      }}
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 5.5"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                      <FontAwesomeIcon icon={faTrash} />
                      Waste Type
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border text-base font-semibold focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--bg-body)',
                        borderColor: 'var(--border-light)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'rgba(20,36,138,0.15)',
                      }}
                      value={wasteType}
                      onChange={(e) => setWasteType(e.target.value)}
                    >
                      <option value="organic">Organic (Leaves, Garden)</option>
                      <option value="general">Mixed General</option>
                      <option value="construction">Construction Waste</option>
                      <option value="plastic">Plastic Waste</option>
                      <option value="drain">Drainage / Silt</option>
                      <option value="hazardous">Hazardous (Tech, Glass)</option>
                    </select>
                  </div>

                  {/* Estimator card — sleek, centered when no breakdown */}
                  <div
                    className="relative overflow-hidden rounded-2xl p-5 text-white flex-1 flex flex-col"
                    style={{
                      minHeight: 'clamp(180px, 28vh, 280px)',
                      background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)',
                      boxShadow: '0 10px 30px -12px rgba(20,36,138,0.5)',
                    }}
                  >
                    <div
                      className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.45), transparent 70%)' }}
                    />
                    <div className="relative flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
                        Est. Earnings
                      </span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <FontAwesomeIcon icon={faCoins} style={{ color: 'var(--accent)' }} />
                      </div>
                    </div>
                    <div className="relative flex-1 flex flex-col justify-center">
                      <div className="flex items-baseline gap-2">
                        <span className="font-black tabular-nums leading-none" style={{ color: 'var(--accent)', fontSize: 'clamp(2.75rem, 6vw, 3.75rem)' }}>
                          {estimatedCredits}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Credits</span>
                      </div>
                      <p className="text-[11px] mt-1 text-white/55">
                        {weightKg > 0 ? `For ${weightKg} kg of ${wasteType}` : 'Enter weight to calculate'}
                      </p>
                    </div>
                    {creditBreakdown && (
                      <div className="relative pt-3 mt-2 border-t border-white/10 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                        <span className="text-white/55">Base <span className="text-white font-semibold tabular-nums">+{creditBreakdown.base}</span></span>
                        <span className="text-white/55">Type <span className="text-white font-semibold tabular-nums">×{(creditBreakdown.wasteMultiplier * creditBreakdown.submissionMultiplier).toFixed(1)}</span></span>
                        <span className="text-white/55">Crit <span className="font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>×{creditBreakdown.criticalityMultiplier.toFixed(1)}</span></span>
                        {zoneName && (
                          <span className="text-white/55 w-full">Zone <span className="font-semibold" style={{ color: 'var(--accent)' }}>{zoneName}</span></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit row */}
              <div className="mt-5 flex items-center gap-3">
                {beforePhoto && !afterPhoto && (
                  <button
                    onClick={handleSaveDraft}
                    className="btn btn-outline px-4 py-3"
                    title="Save draft"
                  >
                    <FontAwesomeIcon icon={faClock} />
                    <span className="hidden sm:inline">Save draft</span>
                  </button>
                )}
                <button
                  onClick={handleAnalyze}
                  disabled={!beforePhoto || !afterPhoto || analyzing}
                  className="btn btn-primary flex-1 py-3 text-base font-bold tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Analyzing photos…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Submit for review
                    </>
                  )}
                </button>
              </div>

              {/* Footer hint — collaborators handled in step 2 */}
              <p className="mt-3 text-[11px] text-center" style={{ color: 'var(--text-tertiary)' }}>
                You'll review the AI verdict and tag collaborators on the next step.
              </p>
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
            <div className="card p-6 md:p-8 lg:p-10">
              {/* Header — title + verified pill */}
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--primary)' }}>
                    Step 2 / Review
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                    Verification Summary
                  </h2>
                  <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Review the AI analysis, tag collaborators, and confirm your submission.
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.25)' }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                  AI Verified
                </div>
              </div>

              {/* Two-column hero: photos | stat grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                {/* Photos */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#dc2626' }}>Before</p>
                    <img src={beforePhoto.preview} alt="Before" className="w-full object-cover rounded-xl" style={{ height: 'clamp(140px, 22vh, 220px)' }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#059669' }}>After</p>
                    <img src={afterPhoto.preview} alt="After" className="w-full object-cover rounded-xl" style={{ height: 'clamp(140px, 22vh, 220px)' }} />
                  </div>
                </div>

                {/* Stat grid */}
                <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatTile
                    label="Category"
                    value={wasteType}
                    icon={faTrash}
                    accent="var(--primary)"
                    capitalize
                  />
                  <StatTile
                    label="Weight"
                    value={`${Number(weightKg).toFixed(1)}`}
                    suffix="kg"
                    icon={faWeightHanging}
                    accent="var(--primary)"
                  />
                  <StatTile
                    label="Credits"
                    value={estimatedCredits}
                    suffix="cr"
                    icon={faCoins}
                    accent="var(--accent)"
                    highlight
                  />
                  <StatTile
                    label="CO₂ Saved"
                    value={(aiData.co2Saved || 0).toFixed(1)}
                    suffix="kg"
                    icon={faLeaf}
                    accent="#059669"
                  />
                </div>
              </div>

              {/* Credit breakdown strip + Description panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                {creditBreakdown && (
                  <div className="lg:col-span-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                      Credit Breakdown
                    </p>
                    <div
                      className="rounded-xl p-4 grid grid-cols-2 gap-3"
                      style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}
                    >
                      <BreakdownRow label="Base" value={`+${creditBreakdown.base}`} />
                      <BreakdownRow label="Waste" value={`×${creditBreakdown.wasteMultiplier}`} />
                      <BreakdownRow label="Type" value={`×${creditBreakdown.submissionMultiplier}`} />
                      <BreakdownRow label="Criticality" value={`×${creditBreakdown.criticalityMultiplier}`} highlight />
                    </div>
                  </div>
                )}
                <div className={creditBreakdown ? 'lg:col-span-7' : 'lg:col-span-12'}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    AI Description
                  </p>
                  <div
                    className="rounded-xl p-4 text-sm leading-relaxed"
                    style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
                  >
                    {aiData.description}
                  </div>
                </div>
              </div>

              {/* Large Cleanup Warning (>80kg requires NGO) */}
              {aiData.weight > 80 && taggedCommunities.length === 0 && (
                <div className="mb-5 px-4 py-3 rounded-lg flex items-start gap-3" style={{ background: 'rgba(220,38,38,0.08)', borderLeft: '3px solid #dc2626' }}>
                  <FontAwesomeIcon icon={faUsers} className="mt-0.5" style={{ color: '#dc2626' }} />
                  <div className="flex-1 text-sm">
                    <p className="font-bold" style={{ color: '#dc2626' }}>NGO required for large cleanups</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Cleanups over 80 kg must be coordinated through a registered NGO. Tag an NGO below to proceed.</p>
                  </div>
                </div>
              )}

              {/* COLLABORATION & VISIBILITY — segmented controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                {/* Tag Collaborators — segmented control + live tag interface */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUsers} style={{ color: 'var(--primary)' }} />
                      <h3 className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-primary)' }}>
                        Collaborators
                      </h3>
                    </div>
                    {aiData.weight > COLLAB_PROTOCOLS.community.maxWeightKg && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
                        NGO REQUIRED
                      </span>
                    )}
                    {aiData.weight > COLLAB_PROTOCOLS.members.maxWeightKg && aiData.weight <= COLLAB_PROTOCOLS.community.maxWeightKg && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(234,88,12,0.1)', color: '#ea580c' }}>
                        COMMUNITY+
                      </span>
                    )}
                  </div>

                  {/* Segmented control */}
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                    <SegmentButton active={!enableTagging} onClick={() => setEnableTagging(false)} label="Solo" />
                    <SegmentButton active={enableTagging && taggingMode === 'members'} onClick={() => { setEnableTagging(true); setTaggingMode('members'); }} label="Members" />
                    <SegmentButton active={enableTagging && taggingMode === 'community'} onClick={() => { setEnableTagging(true); setTaggingMode('community'); }} label="Community" />
                    <SegmentButton active={enableTagging && taggingMode === 'ngo'} onClick={() => { setEnableTagging(true); setTaggingMode('ngo'); }} label="NGO" />
                  </div>

                  {/* Protocol stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
                    <ProtocolStat label="Max Weight" value={`${currentProtocol.maxWeightKg} kg`} />
                    <ProtocolStat label="Per-Person Cap" value={`${currentProtocol.maxCreditsPerPerson} cr`} />
                    <ProtocolStat label="You'll Earn" value={`${projectedCreditsPerPerson} cr`} highlight />
                  </div>

                  <p className="text-[11px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    {currentProtocol.blurb}
                  </p>

                  {/* Tag interface — members */}
                  {enableTagging && taggingMode === 'members' && (
                    <TagPicker
                      placeholder="Search teammates by name or email…"
                      query={userQuery}
                      setQuery={setUserQuery}
                      results={userResults}
                      isSearching={isSearchingUser}
                      onPick={addUser}
                      tagged={taggedUsers}
                      onRemove={removeUser}
                      renderResult={(u) => (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                            {(u.name || u.email || '?').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.name || u.email}</p>
                            {u.email && u.name && <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>{u.email}</p>}
                          </div>
                        </div>
                      )}
                      renderChip={(u) => u.name || u.email || 'Member'}
                    />
                  )}

                  {/* Tag interface — community / ngo */}
                  {enableTagging && (taggingMode === 'community' || taggingMode === 'ngo') && (
                    <TagPicker
                      placeholder={taggingMode === 'ngo' ? 'Search registered NGOs…' : 'Search communities…'}
                      query={communityQuery}
                      setQuery={setCommunityQuery}
                      results={communityResults}
                      isSearching={isSearchingCommunity}
                      onPick={addCommunity}
                      tagged={taggedCommunities}
                      onRemove={removeCommunity}
                      renderResult={(c) => (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                            {(c.name || '?').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                            {c.location && <p className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>{c.location}</p>}
                          </div>
                        </div>
                      )}
                      renderChip={(c) => c.name || (taggingMode === 'ngo' ? 'NGO' : 'Community')}
                    />
                  )}

                  {/* Validation errors */}
                  {protocolErrors.length > 0 && (
                    <div className="mt-3 px-3 py-2 rounded-lg text-[11px]" style={{ background: 'rgba(220,38,38,0.08)', borderLeft: '3px solid #dc2626', color: '#dc2626' }}>
                      {protocolErrors.map((e, i) => (
                        <p key={i} className="font-semibold">• {e}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Share to Feed */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faLeaf} style={{ color: 'var(--secondary)' }} />
                      <h3 className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-primary)' }}>
                        Visibility
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}>
                      OPTIONAL
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Public posts inspire others and earn extra reach.
                  </p>

                  {/* Segmented control */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
                    <SegmentButton
                      active={!shareToFeed}
                      onClick={() => setShareToFeed(false)}
                      label="Private"
                    />
                    <SegmentButton
                      active={shareToFeed}
                      onClick={() => setShareToFeed(true)}
                      label="Share Publicly"
                    />
                  </div>

                  {shareToFeed ? (
                    <>
                      <textarea
                        className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                        placeholder="Share your story — what motivated this cleanup?"
                        rows="3"
                        value={feedDescription}
                        onChange={(e) => setFeedDescription(e.target.value)}
                        maxLength={1000}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-light)',
                          '--tw-ring-color': 'rgba(20,36,138,0.15)',
                        }}
                      />
                      <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        <span>Visible on the public feed</span>
                        <span className="tabular-nums">{feedDescription.length}/1000</span>
                      </div>
                    </>
                  ) : (
                    <div
                      className="rounded-lg p-3 text-xs"
                      style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-medium)', color: 'var(--text-tertiary)' }}
                    >
                      Submission stays in your private dashboard only.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer — back + submit */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-outline px-6 py-3"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="btn btn-primary flex-1 py-3 text-base font-bold tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting || protocolErrors.length > 0}
                  title={protocolErrors[0] || ''}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      {protocolErrors.length > 0 ? 'Resolve Protocol Issues' : 'Confirm & Submit'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Photo Upload Card — sleek card with separated dropzone + footer actions.
const PhotoUploadCard = ({ title, photo, onRemove, onCamera, onFileSelect, color }) => {
  const accent = color === 'green' ? '#059669' : '#dc2626';
  const tint = color === 'green' ? 'rgba(5,150,105,0.06)' : 'rgba(220,38,38,0.06)';
  const cameraAvailable = isCameraAvailable();
  const dropzoneHeight = 'clamp(240px, 38vh, 380px)';

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md"
      style={{
        border: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      {/* Header strip */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
            {title}
          </h3>
        </div>
        {photo && (
          <button
            onClick={onRemove}
            className="text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-tertiary)' }}
            title="Remove photo"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {/* Dropzone / preview */}
      <div className="relative" style={{ height: dropzoneHeight }}>
        {!photo ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: tint }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-surface)', color: accent, boxShadow: `0 4px 14px -6px ${accent}55` }}
            >
              <FontAwesomeIcon icon={faImage} className="text-2xl" />
            </div>
            <p className="text-xs font-semibold" style={{ color: accent }}>
              {color === 'green' ? 'After cleanup photo' : 'Before cleanup photo'}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              JPG, PNG · max 10 MB
            </p>
          </div>
        ) : (
          <>
            <img src={photo.preview} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.95)', color: accent, backdropFilter: 'blur(4px)' }}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
              Captured
            </div>
          </>
        )}
      </div>

      {/* Action footer — sleek divided buttons, never overlap dropzone */}
      <div
        className={`grid ${cameraAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}
        style={{ borderTop: '1px solid var(--border-light)' }}
      >
        {cameraAvailable && (
          <button
            onClick={onCamera}
            className="py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: accent, background: 'var(--bg-surface)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = tint)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
          >
            <FontAwesomeIcon icon={faCamera} />
            {photo ? 'Retake' : 'Camera'}
          </button>
        )}
        <label
          className="py-3 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer transition-colors"
          style={{
            color: accent,
            background: 'var(--bg-surface)',
            borderLeft: cameraAvailable ? '1px solid var(--border-light)' : 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = tint)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
        >
          <FontAwesomeIcon icon={faImage} />
          {photo ? 'Replace' : 'Upload'}
          <input type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
        </label>
      </div>
    </div>
  );
};

// Stat tile — used in Step 2 hero grid for compact, professional KPIs.
const StatTile = ({ label, value, suffix, icon, accent, highlight, capitalize }) => (
  <div
    className="rounded-xl p-3 flex flex-col gap-1.5 transition-all"
    style={{
      background: highlight ? 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)' : 'var(--bg-body)',
      border: highlight ? 'none' : '1px solid var(--border-light)',
      color: highlight ? '#fff' : 'var(--text-primary)',
      boxShadow: highlight ? '0 8px 22px -10px rgba(20,36,138,0.45)' : 'none',
      minHeight: '92px',
    }}
  >
    <div className="flex items-center justify-between">
      <span
        className="text-[9px] font-bold uppercase tracking-[0.18em]"
        style={{ color: highlight ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      <FontAwesomeIcon icon={icon} className="text-xs" style={{ color: highlight ? accent : accent, opacity: highlight ? 1 : 0.7 }} />
    </div>
    <div className="flex items-baseline gap-1 mt-auto">
      <span
        className={`font-black tabular-nums leading-none ${capitalize ? 'capitalize' : ''}`}
        style={{ fontSize: capitalize ? '1.25rem' : '1.75rem', color: highlight ? accent : 'inherit' }}
      >
        {value}
      </span>
      {suffix && (
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: highlight ? 'rgba(255,255,255,0.65)' : 'var(--text-tertiary)' }}
        >
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// Single breakdown row used in the credit breakdown panel.
const BreakdownRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between text-xs">
    <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
    <span
      className="font-bold tabular-nums"
      style={{ color: highlight ? 'var(--primary)' : 'var(--text-primary)' }}
    >
      {value}
    </span>
  </div>
);

// Compact stat displayed under collaboration mode (cap, per-person, etc.).
const ProtocolStat = ({ label, value, highlight }) => (
  <div
    className="rounded-lg px-2 py-1.5"
    style={{
      background: highlight ? 'var(--primary-lighter)' : 'var(--bg-surface)',
      border: '1px solid var(--border-light)',
    }}
  >
    <p className="font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>
      {label}
    </p>
    <p className="font-bold tabular-nums mt-0.5" style={{ color: highlight ? 'var(--primary)' : 'var(--text-primary)', fontSize: '12px' }}>
      {value}
    </p>
  </div>
);

// Tag picker — search input, dropdown of results, chips of tagged entries.
const TagPicker = ({ placeholder, query, setQuery, results, isSearching, onPick, tagged, onRemove, renderResult, renderChip }) => (
  <div className="relative">
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-8 rounded-lg border text-xs focus:outline-none focus:ring-2 transition-all"
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-light)',
          '--tw-ring-color': 'rgba(20,36,138,0.15)',
        }}
      />
      {isSearching && (
        <FontAwesomeIcon icon={faSpinner} spin className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }} />
      )}
    </div>
    {results.length > 0 && (
      <div
        className="absolute z-10 left-0 right-0 mt-1 rounded-lg overflow-hidden max-h-56 overflow-y-auto"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: '0 8px 24px -8px rgba(15,23,42,0.18)' }}
      >
        {results.map((r) => (
          <button
            key={r._id}
            onClick={() => onPick(r)}
            className="w-full px-3 py-2 text-left transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-body)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {renderResult(r)}
          </button>
        ))}
      </div>
    )}
    {tagged.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {tagged.map((t) => (
          <span
            key={t._id}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: 'var(--primary-lighter)', color: 'var(--primary)' }}
          >
            {renderChip(t)}
            <button onClick={() => onRemove(t._id)} className="opacity-70 hover:opacity-100" title="Remove">
              <FontAwesomeIcon icon={faTimes} className="text-[9px]" />
            </button>
          </span>
        ))}
      </div>
    )}
  </div>
);

// Segmented control button — used by collaborator + visibility selectors.
const SegmentButton = ({ active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1.5 rounded-md text-xs font-bold transition-all"
    style={{
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary)',
      boxShadow: active ? '0 2px 8px -2px rgba(20,36,138,0.35)' : 'none',
    }}
  >
    {label}
  </button>
);

export default Upload;
