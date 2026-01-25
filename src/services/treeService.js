import api from './api';

// Get all trees (optionally filter by category)
export const getTrees = async (category) => {
  return await api.get(`/trees${category ? `?category=${category}` : ''}`);
};

// Get single tree by ID
export const getTree = async (id) => {
  return await api.get(`/trees/${id}`);
};

// Redeem tree (purchase with credits)
export const redeemTree = async (id) => {
  return await api.post(`/trees/${id}/redeem`);
};
