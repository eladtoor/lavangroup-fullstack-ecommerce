const axios = require('axios');

/**
 * Upload an external image URL to Cloudinary
 * This prevents hotlinking and ensures images are stored reliably
 */
const uploadExternalImageToCloudinary = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return res.status(500).json({ error: 'Cloudinary configuration missing' });
    }

    // Upload to Cloudinary using the external URL
    const cloudinaryResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        file: imageUrl,
        upload_preset: uploadPreset,
      }
    );

    // Return the Cloudinary URL
    res.status(200).json({
      success: true,
      cloudinaryUrl: cloudinaryResponse.data.secure_url,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to upload image to Cloudinary',
      details: error.response?.data || error.message,
    });
  }
};

module.exports = {
  uploadExternalImageToCloudinary,
};

