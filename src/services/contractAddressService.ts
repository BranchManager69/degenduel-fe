/**
 * Contract Address Service
 * 
 * This service handles fetching the contract address from the backend
 * when the countdown timer expires.
 */

// Mock delay to simulate API request
const MOCK_DELAY = 1000;

// Poll interval in milliseconds (5 seconds)
export const CONTRACT_POLL_INTERVAL = 5000;

// Placeholder address for testing while waiting for real address
const PLACEHOLDER = 'Fetching contract address...';

// Flag to track if the contract address is available
let isContractAddressPublic = false;

// Store the fetched contract address
let cachedContractAddress: string | null = null;

/**
 * Check if the release date has passed
 * @param releaseDate The configured release date
 * @returns True if the release date has passed
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
 */
export const fetchContractAddress = async (): Promise<string> => {
  // If we already have the address cached, return it
  if (cachedContractAddress) {
    return cachedContractAddress;
  }
  
  // Mock an API endpoint URL - in production, use a real endpoint
  const apiEndpoint = '/api/v1/contract-address';
  console.log(`Fetching contract address from endpoint: ${apiEndpoint}`);
  
  try {
    // In a real implementation, you would uncomment this:
    /*
    const response = await fetch(apiEndpoint);
    if (!response.ok) {
      throw new Error(`Error fetching contract address: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.success && data.address) {
      cachedContractAddress = data.address;
      console.log(`Contract address fetched: ${data.address}`);
      return data.address;
    } else {
      console.log('Contract address not available yet');
      return PLACEHOLDER;
    }
    */
    
    // For demonstration purposes, we'll use a mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real implementation, the backend would determine if the contract is public
        const shouldBePublic = isContractAddressPublic;
        
        if (shouldBePublic) {
          // This is a dummy contract address - in production, your server would return the real address
          // that is not stored anywhere in the frontend code
          const address = '6nBDWZmMB328dH3YBq8T2x8J6eVLXCvXVAQULL8BGYXx';
          
          console.log(`Contract address now available: ${address}`);
          cachedContractAddress = address;
          resolve(address);
        } else {
          console.log('Contract address not yet available from server');
          resolve(PLACEHOLDER);
        }
      }, MOCK_DELAY);
    });
  } catch (error) {
    console.error('Error fetching contract address:', error);
    return PLACEHOLDER;
  }
};

/**
 * Mark the contract address as public (for testing)
 * In a real implementation, the backend would determine this
 */
export const setContractAddressPublic = (isPublic: boolean): void => {
  isContractAddressPublic = isPublic;
  
  // Clear cache if we're setting to non-public
  if (!isPublic) {
    cachedContractAddress = null;
  }
};

/**
 * Check if the contract address is available
 * This can be used to decide whether to poll or not
 */
export const isContractAddressAvailable = (): boolean => {
  return !!cachedContractAddress;
};