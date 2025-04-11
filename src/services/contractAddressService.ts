/**
 * Contract Address Service - DEPRECATED
 * 
 * @deprecated This service has been deprecated in favor of using terminalDataService
 * for fetching contract address information. Please use terminalDataService.fetchTerminalData()
 * instead, which centralizes all terminal data in a single API.
 * 
 * This file is kept for backward compatibility but will be removed in a future release.
 */

import { fetchTerminalData } from './terminalDataService';

// Export logging message when this module is imported
console.warn(
  '[contractAddressService] This service is deprecated. Please use terminalDataService instead.' +
  ' The contract address is now available via fetchTerminalData() in terminalDataService.ts'
);

// Poll interval in milliseconds (5 seconds) - kept for backward compatibility
export const CONTRACT_POLL_INTERVAL = 5000;

// Placeholder address for testing while waiting for real address
const PLACEHOLDER = 'Fetching contract address...';

/**
 * Check if the release date has passed
 * @param releaseDate The configured release date
 * @returns True if the release date has passed
 * @deprecated Use terminalDataService.fetchTerminalData().contractAddressRevealed instead
 */
export const isReleaseTimePassed = (releaseDate: Date): boolean => {
  const now = new Date();
  return now >= releaseDate;
};

/**
 * Calculate time remaining until release
 * @param releaseDate The configured release date
 * @returns Time remaining in milliseconds, or 0 if release date has passed
 */
export const getTimeRemainingUntilRelease = (releaseDate: Date): number => {
  const now = new Date();
  const diff = releaseDate.getTime() - now.getTime();
  return Math.max(0, diff);
};

/**
 * Fetch the contract address from the backend
 * @returns Promise that resolves to the contract address
 * @deprecated Use terminalDataService.fetchTerminalData().contractAddress instead
 */
export const fetchContractAddress = async (): Promise<string> => {
  try {
    console.warn('[contractAddressService] fetchContractAddress is deprecated. Using terminalDataService instead.');
    
    // Use the new terminalDataService to get the contract address
    const terminalData = await fetchTerminalData();
    
    if (terminalData.token?.address) {
      return terminalData.token.address;
    } else {
      return PLACEHOLDER;
    }
  } catch (error) {
    console.error('[contractAddressService] Error fetching contract address:', error);
    return PLACEHOLDER;
  }
};

/**
 * Mark the contract address as public (for testing)
 * @deprecated This function no longer has any effect. Contract status is controlled by the backend.
 */
export const setContractAddressPublic = (_isPublic: boolean): void => {
  // Using param name with underscore to indicate unused parameter
  console.warn(
    '[contractAddressService] setContractAddressPublic is deprecated and has no effect. ' +
    'Contract address reveal status is now controlled by the backend API.'
  );
};

/**
 * Check if the contract address is available
 * @deprecated Use terminalDataService.fetchTerminalData().contractAddressRevealed instead
 */
export const isContractAddressAvailable = async (): Promise<boolean> => {
  try {
    console.warn('[contractAddressService] isContractAddressAvailable is deprecated. Using terminalDataService instead.');
    
    // Use the new terminalDataService to check if contract is revealed
    const terminalData = await fetchTerminalData();
    return !!terminalData.token?.address;
  } catch (error) {
    console.error('[contractAddressService] Error checking if contract address is available:', error);
    return false;
  }
};