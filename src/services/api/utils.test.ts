import { createApiClient, fetchWithAuth, handleApiResponse } from './utils';

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

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers)
      })
    );

    // Verify response was returned correctly
    expect(result).toBe(mockResponse);
  });

  it('should add auth header when token is provided', async () => {
    // Setup mock response
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
      headers: new Headers()
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Create client with token and make a request
    const client = createApiClient('test-token');
    await client.fetch('/secure-endpoint');

    // Verify Authorization header was included
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
  });

  it('should throw error for failed requests', async () => {
    // Setup mock error response
    const errorResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: jest.fn().mockResolvedValue({ 
        error: 'Authentication failed',
        message: 'Invalid token'
      }),
      headers: new Headers()
    };
    (global.fetch as jest.Mock).mockResolvedValue(errorResponse);

    // Create client and make a request
    const client = createApiClient();
    
    // Expect the request to throw an error
    await expect(client.fetch('/secure-endpoint')).rejects.toThrow();
  });

  it('should use correct HTTP method for requests', async () => {
    // Setup mock response
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
      headers: new Headers()
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Create client and make POST request
    const client = createApiClient();
    await client.fetch('/data-endpoint', { 
      method: 'POST',
      body: JSON.stringify({ test: 'data' })
    });

    // Verify fetch was called with correct method and body
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  // Authentication-specific tests
  describe('Authentication Handling', () => {
    it('includes credentials when using fetchWithAuth', async () => {
      // Setup mock response
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true }),
        headers: new Headers()
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Make authenticated request
      await fetchWithAuth('/auth/endpoint');

      // Verify fetch was called with credentials: include
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });

    it('properly handles auth-specific responses', async () => {
      // Setup successful auth response
      const successResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ 
          user: { id: '123', role: 'admin' },
          token: 'jwt-token'
        }),
        headers: new Headers()
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(successResponse);

      // Process the response
      const result = await handleApiResponse(successResponse);
      
      // Should return the parsed JSON
      expect(result).toEqual({ 
        user: { id: '123', role: 'admin' },
        token: 'jwt-token'
      });

      // Setup 401 unauthorized response
      const unauthorizedResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ 
          error: 'Authentication failed',
          message: 'Session expired'
        }),
        headers: new Headers()
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(unauthorizedResponse);

      // Should throw error when handling unauthorized response
      await expect(handleApiResponse(unauthorizedResponse)).rejects.toThrow('Session expired');
    });

    it('formats token in Authorization header properly', async () => {
      // Setup mock response
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
        headers: new Headers()
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Create client with different token formats
      const client1 = createApiClient('simple-token');
      await client1.fetch('/endpoint');
      
      // Should prepend "Bearer " if not present
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer simple-token'
          })
        })
      );

      // Already formatted token
      const client2 = createApiClient('Bearer formatted-token');
      await client2.fetch('/endpoint');
      
      // Should not modify already formatted token
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer formatted-token'
          })
        })
      );
    });
  });
});