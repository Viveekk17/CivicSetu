import api from './api';

// Get current user profile from backend
export const getProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Update user profile data
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/users/profile', profileData);
    
    // Update local storage if sync is successful
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Upload profile picture
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const response = await api.get('/users/stats');
    return response;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};
