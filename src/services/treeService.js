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

// Get user inventory
export const getInventory = async () => {
  return await api.get('/trees/inventory');
};

// Use an inventory item
export const useItem = async (itemId) => {
  return await api.post(`/trees/inventory/${itemId}/use`);
};
