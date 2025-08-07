/**
 * Profile Image Utilities
 * 
 * Helper functions for handling profile image URLs from the backend
 */


/**
 * Get the full URL for a profile image
 * 
 * @param imageUrl - The image URL from the backend (can be relative or absolute)
 * @returns The full URL to use in an img src
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string {
  // If no image URL provided, return empty string (let the component handle fallback)
  if (!imageUrl) return '';

  // If it's already a full URL (Twitter/Discord), use as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For production, we need to prepend /api to the path since nginx doesn't proxy /uploads
  // Check if we're in production (not localhost)
  const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.startsWith('127.0.0.1');
  
  if (isProduction) {
    // In production, images are served through /api/uploads instead of /uploads
    return `/api${imageUrl}`;
  }
  
  // In development with Vite proxy, use relative URLs
  return imageUrl;
}

/**
 * Get fallback image URL
 * @returns URL to a default avatar image
 */
export function getDefaultAvatarUrl(): string {
  // You can return a local fallback or use the backend's default
  return '/images/default-avatar.png';
}