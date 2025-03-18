/**
 * Release Date Service
 * 
 * This service handles fetching the release date from the backend
 * with a fallback to a hardcoded date.
 */

// Fallback release date: March 15th, 6:00 PM Eastern Standard Time
export const FALLBACK_RELEASE_DATE = new Date('2025-03-15T22:00:00Z'); // 6:00 PM EST in UTC

// Mock delay to simulate API request (in milliseconds)
const MOCK_DELAY = 800;

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
  
  // API endpoint for fetching the release date
  const endpoint = '/api/v1/release-date';
  
  try {
    console.log(`Fetching release date from endpoint: ${endpoint}`);
    
    // In a real implementation, you would use this:
    /*
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
    */
    
    // For demonstration purposes, use a mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock server response - in production, your server would return the actual date
        // This simulates a successful API response with a release date
        const mockServerDate = null; // Set to null to simulate no date from server
        
        if (mockServerDate) {
          const releaseDate = new Date(mockServerDate);
          cachedReleaseDate = releaseDate;
          console.log(`Release date fetched from server: ${releaseDate.toISOString()}`);
          resolve(releaseDate);
        } else {
          console.log(`No release date from server, using fallback: ${FALLBACK_RELEASE_DATE.toISOString()}`);
          resolve(FALLBACK_RELEASE_DATE);
        }
      }, MOCK_DELAY);
    });
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