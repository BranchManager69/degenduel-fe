/**
 * Release Date Service
 * 
 * This service handles fetching the release date from the backend
 * with a fallback to the date defined in environment variables.
 */

// Fallback release date from environment variables or default to December 31st, 11:59 PM Eastern
export const FALLBACK_RELEASE_DATE = new Date(
  import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME || '2025-12-31T23:59:59-05:00'
);

// Cache for the fetched release date
let cachedReleaseDate: Date | null = null;

/**
 * Fetch the release date from the backend
 * @returns Promise that resolves to the release date
 */
export const fetchReleaseDate = async (): Promise<Date> => {
  // If we already have the date cached, return it
  if (cachedReleaseDate) {
    return cachedReleaseDate;
  }
  
  // Use relative URL to leverage Vite's proxy configuration
  const endpoint = `/api/v1/release-date`;
  
  try {
    console.log(`Fetching release date from endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Error fetching release date: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.releaseDate) {
      // Convert string date to Date object
      const releaseDate = new Date(data.releaseDate);
      
      // Cache the result
      cachedReleaseDate = releaseDate;
      
      console.log(`Release date fetched: ${releaseDate.toISOString()}`);
      return releaseDate;
    } else {
      console.warn('Release date not available from API, using fallback');
      return FALLBACK_RELEASE_DATE;
    }
  } catch (error) {
    console.error('Error fetching release date:', error);
    console.log(`Using fallback release date: ${FALLBACK_RELEASE_DATE.toISOString()}`);
    return FALLBACK_RELEASE_DATE;
  }
};

/**
 * Get a human-readable representation of the release date
 * @param date The release date
 * @returns Formatted date string
 */
export const formatReleaseDate = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'America/New_York',
    timeZoneName: 'short'
  });
};