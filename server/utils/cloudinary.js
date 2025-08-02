const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
const uploadToCloudinary = async (file, folder = 'job-portal') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    throw new Error(`Error uploading to Cloudinary: ${error.message}`);
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    throw new Error(`Error deleting from Cloudinary: ${error.message}`);
  }
};

// Upload resume with specific settings
const uploadResume = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'resumes',
      resource_type: 'auto',
      allowed_formats: ['pdf', 'doc', 'docx'],
      transformation: [
        { quality: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    throw new Error(`Error uploading resume: ${error.message}`);
  }
};

// Upload image (logo, avatar) with specific settings
const uploadImage = async (file, folder = 'images') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
        { width: 500, height: 500, crop: 'limit' }
      ]
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    throw new Error(`Error uploading image: ${error.message}`);
  }
};

// Generate thumbnail for images
const generateThumbnail = async (public_id, width = 150, height = 150) => {
  try {
    const url = cloudinary.url(public_id, {
      transformation: [
        { width: width, height: height, crop: 'fill' },
        { quality: 'auto' }
      ]
    });
    return url;
  } catch (error) {
    throw new Error(`Error generating thumbnail: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadResume,
  uploadImage,
  generateThumbnail
};