/**
 * Profile Image Utilities
 * 
 * Helper functions for handling profile image URLs from the backend
 */

import { API_URL } from '../config/config';

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

  // For relative paths, just use /api prefix and let the proxy handle it
  // The frontend already has /api/* proxied to the backend
  // This avoids CORS issues and works just like all other API calls
  return `/api${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

/**
 * Get fallback image URL
 * @returns URL to a default avatar image
 */
export function getDefaultAvatarUrl(): string {
  // You can return a local fallback or use the backend's default
  return '/images/default-avatar.png';
}