import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faTrash, faWater, faWind, faSeedling, faMapMarkerAlt, faWeightHanging, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

const Upload = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    file: null,
    type: '',
    weight: '',
    location: '',
    description: ''
  });
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Transition variants
  const slideVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = () => {
    setVerifying(true);
    // Mock AI Verification
    setTimeout(() => {
      setVerifying(false);
      setSuccess(true);
    }, 2000);
  };

  const types = [
    { id: 'garbage', label: 'Garbage Cleanup', icon: faTrash, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'water', label: 'Water Conservation', icon: faWater, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { id: 'methane', label: 'Methane Reduction', icon: faWind, color: 'text-gray-500', bg: 'bg-gray-50' },
    { id: 'restoration', label: 'Restoration', icon: faSeedling, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  if (success) {
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
        <p className="text-gray-500 mb-8">You've earned <span className="font-bold text-emerald-600">50 Credits</span> pending final approval.</p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="btn btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
          <span>Upload</span>
          <span>Category</span>
          <span>Details</span>
          <span>Review</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <motion.div 
            key="step1"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="card p-8 text-center border-2 border-dashed border-gray-300 hover:border-emerald-500 transition-colors cursor-pointer group"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faCloudUploadAlt} className="text-3xl text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Evidence</h2>
            <p className="text-gray-500 mb-8">Drag & drop your before/after photos here</p>
            <button 
              onClick={handleNext} // Bypass actual upload for demo
              className="btn btn-primary"
            >
              Select Photos
            </button>
          </motion.div>
        )}

        {/* STEP 2: TYPE */}
        {step === 2 && (
          <motion.div 
            key="step2"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className="text-2xl font-bold mb-6">Select Activity Type</h2>
            <div className="grid grid-cols-2 gap-4">
              {types.map((type) => (
                <div 
                  key={type.id}
                  onClick={() => {
                    setFormData({...formData, type: type.id});
                    handleNext();
                  }}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    formData.type === type.id ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white shadow-sm hover:border-emerald-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${type.bg} ${type.color}`}>
                    <FontAwesomeIcon icon={type.icon} className="text-xl" />
                  </div>
                  <h3 className="font-bold">{type.label}</h3>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={handlePrev} className="text-gray-500 font-medium">Back</button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 3 && (
          <motion.div 
            key="step3"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="card p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Add Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estimated Weight (kg)</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faWeightHanging} className="absolute left-4 top-3.5 text-gray-400" />
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 5"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-4 top-3.5 text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Central Park"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                  <button className="absolute right-2 top-2 p-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
                    Detect
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                  placeholder="Describe your activity..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>
            <div className="mt-8 flex justify-between items-center">
              <button onClick={handlePrev} className="text-gray-500 font-medium">Back</button>
              <button onClick={handleNext} className="btn btn-primary">Continue</button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <motion.div 
            key="step4"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="card p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Review & Submit</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-bold">{formData.type || 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Weight</span>
                <span className="font-bold">{formData.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-bold">{formData.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl mb-6 text-sm">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              AI Verification will be performed on submission.
            </div>

            <div className="flex justify-between items-center">
              <button 
                onClick={handlePrev} 
                className="text-gray-500 font-medium" 
                disabled={verifying}
              >
                Back
              </button>
              <button 
                onClick={handleSubmit} 
                className="btn btn-primary w-full ml-4"
                disabled={verifying}
              >
                {verifying ? (
                    <>
                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        Verifying...
                    </>
                ) : 'Submit for Verification'}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Upload;
