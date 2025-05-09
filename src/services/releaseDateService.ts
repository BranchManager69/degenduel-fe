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

// Interface for the structured response from /api/status/countdown
export interface CountdownResponse {
  enabled: boolean;
  end_time?: string;  // ISO Date string for the countdown target
  title?: string;
  message?: string;
  redirect_url?: string | null;
  token_address?: string; // Added new field from backend
  // Potentially other fields the backend might send
}

// Cache for the fetched countdown data - consider reducing or removing for critical launches
let cachedCountdownData: CountdownResponse | null = null;
let cacheTime: number = 0;
const CACHE_DURATION_MS = 30 * 1000; // Cache for 30 seconds to reduce rapid hits but allow reasonably fast updates

/**
 * Fetch countdown data from the API
 * @returns Promise resolving to CountdownResponse
 */
export const fetchCountdownData = async (): Promise<CountdownResponse> => {
  const now = Date.now();
  if (cachedCountdownData && (now - cacheTime < CACHE_DURATION_MS)) {
    console.log('[releaseDateService] Returning cached countdown data.');
    return cachedCountdownData;
  }

  const endpointPath = '/api/status/countdown';
  const fullUrl = `${window.location.origin}${endpointPath}`;
  console.log(`[releaseDateService] Fetching countdown data from: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl);
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
      throw new Error(`Error fetching countdown data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as CountdownResponse; // Assert the type
    console.log('[releaseDateService] Countdown data fetched:', data);
    
    cachedCountdownData = data;
    cacheTime = now;
    return data;
  } catch (error) {
    console.error('[releaseDateService] Error fetching countdown data, returning disabled default:', error);
    return {
      enabled: false, // Default to disabled on error
      title: "Countdown Unavailable",
      message: "Could not load countdown information. Please try again later."
    };
  }
};

/**
 * Get the configured release date IF the countdown is enabled.
 * @returns Promise resolving to the release Date object or null if not enabled/no date.
 */
export const getActiveReleaseDate = async (): Promise<Date | null> => {
  try {
    const data = await fetchCountdownData();
    if (data.enabled && data.end_time) {
      const releaseDate = new Date(data.end_time);
      if (!isNaN(releaseDate.getTime())) {
        return releaseDate;
      }
      console.warn('[releaseDateService] Invalid end_time received from API:', data.end_time);
    }
    if (!data.enabled) {
      console.log('[releaseDateService] Countdown is not enabled via API.');
    }
    return null; // Return null if not enabled or date is invalid/missing
  } catch (error) {
    console.error('[releaseDateService] Error getting active release date:', error);
    return null;
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

// formatDate and getTimeRemaining (from example) can be used or your existing dateUtils
