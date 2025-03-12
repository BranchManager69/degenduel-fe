// Import mock config instead of real config
jest.mock('../../config/config', () => require('../../config/config.mock'));

// Mock the useStore.getState function
jest.mock('../../store/useStore', () => ({
  useStore: {
    getState: jest.fn().mockReturnValue({
      user: null,
      setUser: jest.fn()
    })
  }
}));

// Mock ddApi for checkContestParticipation
jest.mock('../../services/dd-api', () => ({
  ddApi: {
    contests: {
      getParticipationDetails: jest.fn().mockResolvedValue({ isParticipating: true })
    }
  }
}));

// Silence the console warnings during tests
jest.spyOn(console, 'warn').mockImplementation(() => {});

import { createApiClient, checkContestParticipation, formatBonusPoints } from './utils';

// Mock fetch
global.fetch = jest.fn();

describe('API Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an API client with fetch wrapper', async () => {
    // Setup mock response
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
      headers: new Headers()
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Create client and make a request
    const client = createApiClient();
    const result = await client.fetch('/test-endpoint');

    // Verify fetch was called with expected arguments
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/test-endpoint',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );

    // Verify response was returned correctly
    expect(result).toBe(mockResponse);
  });

  it('should format bonus points correctly', () => {
    expect(formatBonusPoints(1234)).toBe('1,234 pts');
    expect(formatBonusPoints('5678')).toBe('5,678 pts');
    expect(formatBonusPoints(0)).toBe('0 pts');
    expect(formatBonusPoints(1000000)).toBe('1,000,000 pts');
  });

  it('should throw error for failed requests', async () => {
    // Setup mock response object
    const errorResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: jest.fn().mockResolvedValue({ 
        error: 'Authentication failed',
        message: 'Invalid token'
      }),
      headers: {
        entries: () => []
      }
    };
    (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true
    });

    // Create client and make a request
    const client = createApiClient();
    
    // Expect the request to throw an error
    await expect(client.fetch('/secure-endpoint')).rejects.toThrow();
  });

  it('should check contest participation', async () => {
    // Import the mocked ddApi
    const { ddApi } = require('../../services/dd-api');
    
    // Call checkContestParticipation
    const result = await checkContestParticipation('contest-123', 'wallet-456');
    
    // Verify it called through to ddApi
    expect(ddApi.contests.getParticipationDetails).toHaveBeenCalledWith('contest-123', 'wallet-456');
    
    // Verify result
    expect(result).toBe(true);
  });
});