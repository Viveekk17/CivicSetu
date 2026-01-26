const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary and delete the local file
 * @param {string} localFilePath - Path to the local file
 * @param {string} folder - Cloudinary folder name (e.g., 'submissions', 'users')
 * @returns {Promise<string>} - Cloudinary URL of the uploaded image
 */
const uploadToCloudinary = async (localFilePath, folder = 'ecotrace') => {
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete the local file after successful upload
    await fs.unlink(localFilePath);
    console.log(`✅ Uploaded to Cloudinary and deleted local file: ${localFilePath}`);

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud storage');
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array<string>} localFilePaths - Array of local file paths
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array<string>>} - Array of Cloudinary URLs
 */
const uploadMultipleToCloudinary = async (localFilePaths, folder = 'ecotrace') => {
  const uploadPromises = localFilePaths.map(path => uploadToCloudinary(path, folder));
  return await Promise.all(uploadPromises);
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID (extracted from URL)
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  cloudinary
};
