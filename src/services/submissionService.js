import api from './api';

// Analyze photos without saving submission (preview AI results)
export const analyzePhotos = async (formData) => {
  return await api.post('/submissions/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Create new submission with photos (final submission)
export const createSubmission = async (formData) => {
  // formData should contain: photos (files), type, weight, location, description
  return await api.post('/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Get user's submissions
export const getSubmissions = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return await api.get(`/submissions${queryString ? '?' + queryString : ''}`);
};

// Get single submission
export const getSubmission = async (id) => {
  return await api.get(`/submissions/${id}`);
};

// Delete submission
export const deleteSubmission = async (id) => {
  return await api.delete(`/submissions/${id}`);
};
