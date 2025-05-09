// src/services/releaseDateService.ts

/**
 * Release Date Service
 * 
 * @description This service handles fetching the release date from the backend
 * with a fallback to the date defined in environment variables.
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-04-14
 * @updated 2025-05-08
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
  if (cachedReleaseDate) {
    console.log('[releaseDateService] Returning cached release date:', cachedReleaseDate.toISOString());
    return cachedReleaseDate;
  }
  
  // Countdown endpoint
  const endpointPath = '/api/status/countdown' // DEPRECATED: '/api/v1/release-date';

  // Construct the full URL to be absolutely sure what's being called
  const fullUrl = `${window.location.origin}${endpointPath}`;
  
  console.log(`[releaseDateService] Fetching release date. Full URL: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl); // Use fullUrl here
    
    console.log(`[releaseDateService] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorPayload = 'No error payload or not JSON.';
      try {
        // Attempt to read the error payload as text first, then try JSON
        const textPayload = await response.text();
        errorPayload = textPayload; // Keep as text if JSON parsing fails
        try {
          const jsonPayload = JSON.parse(textPayload);
          errorPayload = JSON.stringify(jsonPayload, null, 2); // Pretty print if JSON
        } catch (jsonError) {
          // console.log('[releaseDateService] Error response was not valid JSON.');
        }
      } catch (textError) {
        console.error('[releaseDateService] Could not read error response text:', textError);
      }
      console.error(`[releaseDateService] Error response payload from ${fullUrl}:`, errorPayload);
      throw new Error(`Error fetching release date: ${response.status} ${response.statusText}`);
    }
    
    // Parse the Countdown response as JSON
    const data = await response.json();
    console.log('[releaseDateService] Response data:', data);
    
    if (data.success && data.releaseDate) {
      const releaseDate = new Date(data.releaseDate);
      cachedReleaseDate = releaseDate;
      console.log(`[releaseDateService] Release date fetched successfully: ${releaseDate.toISOString()}`);
      return releaseDate;
    } else {
      console.warn('[releaseDateService] Release date not available from API or data format incorrect, using fallback. API Response:', data);
      return FALLBACK_RELEASE_DATE;
    }
  } catch (error) {
    // Log the error object itself for more details if it's not the one we threw above
    if (error instanceof Error && !error.message.startsWith('Error fetching release date:')) {
        console.error('[releaseDateService] Network or other error during fetch:', error);
    } else if (!(error instanceof Error)) {
        console.error('[releaseDateService] Unknown error during fetch:', error);
    }
    // The specific throw with status is already logged, this console.error is for the catch block itself.
    // console.error('[releaseDateService] Final error before returning fallback:', error);
    console.log(`[releaseDateService] Using fallback release date due to error: ${FALLBACK_RELEASE_DATE.toISOString()}`);
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
