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
    console.log(`📤 Starting Cloudinary upload for: ${localFilePath}`);
    console.log(`📁 Target folder: ${folder}`);

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary credentials missing in environment variables');
      throw new Error('Cloudinary not configured');
    }

    console.log(`✅ Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME}`);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log(`✅ Cloudinary upload successful!`);
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Public ID: ${result.public_id}`);

    // Delete the local file after successful upload
    await fs.unlink(localFilePath);
    console.log(`🗑️  Deleted local file: ${localFilePath}`);

    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:');
    console.error('   Error message:', error.message);
    console.error('   Error details:', error);
    console.error('   File path:', localFilePath);
    throw new Error(`Failed to upload image to cloud storage: ${error.message}`);
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
