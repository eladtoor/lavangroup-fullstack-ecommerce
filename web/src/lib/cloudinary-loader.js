/**
 * Custom Cloudinary loader for Next.js Image component
 * This allows us to use Cloudinary's optimization without server-side processing
 * Saves RAM on hosting (512MB limit) while still serving optimized images
 */

export default function cloudinaryLoader({ src, width, quality }) {
  // Default quality if not specified (quality comes as number from Next.js)
  const q = quality ? `q_${quality}` : 'q_auto:good';

  // If it's already a Cloudinary URL, transform it
  if (src && src.includes('cloudinary.com')) {
    // Extract the base URL and path
    // Cloudinary URL format: https://res.cloudinary.com/CLOUD_NAME/image/upload/TRANSFORMATIONS/PATH

    // Remove any existing transformations and add our optimized ones
    const cloudinaryRegex = /^(https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)([^\/]+\/)*(.+)$/;
    const match = src.match(cloudinaryRegex);

    if (match) {
      const baseUrl = match[1];
      const imagePath = match[3];

      // Build optimized transformation string
      // f_auto: auto format (WebP/AVIF based on browser support)
      // q_auto:good or specific quality
      // w_WIDTH: resize to specified width
      // c_limit: don't upscale, only downscale
      const transforms = `f_auto,${q},w_${width},c_limit`;

      return `${baseUrl}${transforms}/${imagePath}`;
    }

    // Fallback: try simpler replacement for URLs with /upload/
    if (src.includes('/upload/')) {
      const transforms = `f_auto,${q},w_${width},c_limit`;
      return src.replace(/\/upload\/([^\/]*\/)?/, `/upload/${transforms}/`);
    }
  }

  // For non-Cloudinary URLs, return as-is with width param if possible
  // This handles placeholder images and other sources
  if (src && src.startsWith('/')) {
    // Local images - return as-is
    return src;
  }

  // External non-Cloudinary images - return as-is
  return src;
}
