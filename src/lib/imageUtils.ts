/**
 * Image utilities for handling contest and other server-hosted images
 * 
 * @author BranchManager69
 * @created 2025-01-XX
 */

import { API_URL } from '../config/config';

/**
 * Transforms relative image URLs to full server URLs
 * 
 * @param imageUrl - The image URL from the API (could be relative or absolute)
 * @returns Full URL to the image on the server
 */
export function getFullImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;

  // If it's already a full URL (http/https), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative path starting with /, convert to full server URL
  if (imageUrl.startsWith('/')) {
    // Remove '/api' from API_URL to get the base server URL
    const baseServerUrl = API_URL.replace('/api', '');
    return `${baseServerUrl}${imageUrl}`;
  }

  // If it's a relative path without leading /, assume it's from API root
  const baseServerUrl = API_URL.replace('/api', '');
  return `${baseServerUrl}/${imageUrl}`;
}

/**
 * Specifically for contest images - handles the common case of contest image paths
 * Contest images are only stored on the production server, so we always
 * load them from production regardless of current environment
 * 
 * @param imageUrl - Contest image URL from the API
 * @returns Full URL to the contest image on the production server
 */
export function getContestImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;

  // If it's already a full URL (http/https), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For contest images, ALWAYS use production domain
  // since contest images are only stored on production server
  const CONTEST_IMAGE_BASE = 'https://degenduel.me';

  // If it's a relative path starting with /, convert to full production URL
  if (imageUrl.startsWith('/')) {
    return `${CONTEST_IMAGE_BASE}${imageUrl}`;
  }

  // If it's a relative path without leading /, assume it's from root
  return `${CONTEST_IMAGE_BASE}/${imageUrl}`;
} 