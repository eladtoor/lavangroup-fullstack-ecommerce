/**
 * Upload an external image URL to Cloudinary via backend proxy
 * This ensures all product images are stored reliably on Cloudinary
 * instead of hotlinking to external sites
 * 
 * @param {string} externalImageUrl - The external image URL to upload
 * @returns {Promise<string>} - The Cloudinary URL of the uploaded image
 */
export const uploadExternalImageToCloudinary = async (externalImageUrl: string): Promise<string> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/images/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: externalImageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.cloudinaryUrl;
  } catch (error) {
    console.error('Error uploading external image:', error);
    throw error;
  }
};

/**
 * Check if a URL is already a Cloudinary URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's already a Cloudinary URL
 */
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com');
};

/**
 * Process an image URL - upload to Cloudinary if it's external
 * @param {string} imageUrl - The image URL (external or Cloudinary)
 * @returns {Promise<string>} - Cloudinary URL
 */
export const processImageUrl = async (imageUrl: string): Promise<string> => {
  if (!imageUrl || imageUrl.trim() === '') {
    throw new Error('Image URL is required');
  }

  // If already a Cloudinary URL, return it as is
  if (isCloudinaryUrl(imageUrl)) {
    return imageUrl;
  }

  // Otherwise, upload to Cloudinary
  return await uploadExternalImageToCloudinary(imageUrl);
};

