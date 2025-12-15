const axios = require('axios');

/**
 * Upload an external image URL or base64 to Cloudinary
 * Supports: regular URLs, base64 data URIs
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

    // Check if it's a valid URL or base64
    const isBase64 = imageUrl.startsWith('data:');
    const isValidUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
    
    if (!isBase64 && !isValidUrl) {
      return res.status(400).json({ 
        error: 'Invalid image format',
        hint: 'Use a full URL (https://...) or base64 (data:image/...)'
      });
    }

    // Build upload params
    const uploadParams = {
      file: imageUrl,
      upload_preset: uploadPreset,
    };
    
    // Only add public_id for URLs (not base64)
    if (isValidUrl) {
      uploadParams.public_id = `product_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      uploadParams.folder = 'products';
    }
    
    // Upload to Cloudinary
    const cloudinaryResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      uploadParams
    );

    // Return the Cloudinary URL
    res.status(200).json({
      success: true,
      cloudinaryUrl: cloudinaryResponse.data.secure_url,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.response?.data || error.message);
    
    // Better error messages
    let errorMessage = 'Failed to upload image to Cloudinary';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    
    res.status(500).json({
      error: errorMessage,
      hint: 'Make sure to copy the full image URL (right-click → Copy image address)',
    });
  }
};

module.exports = {
  uploadExternalImageToCloudinary,
};

