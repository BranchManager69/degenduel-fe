import { admin } from './admin';
import * as utils from './utils';

// Mock the createApiClient function
jest.mock('./utils', () => ({
  createApiClient: jest.fn()
}));

describe('Admin API Service', () => {
  // Mock fetch client
  const mockFetch = jest.fn();
  const mockApiClient = { fetch: mockFetch };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock implementation of createApiClient
    (utils.createApiClient as jest.Mock).mockReturnValue(mockApiClient);
  });

  const mockJsonResponse = (data: any) => {
    return {
      json: jest.fn().mockResolvedValue(data),
      ok: true,
      status: 200,
      statusText: "OK"
    };
  };

  describe('System Settings', () => {
    it('should fetch system settings', async () => {
      // Setup mock response
      const mockSettings = { 
        maintenance_mode: false,
        registration_enabled: true 
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockSettings));

      // Call the function
      const result = await admin.getSystemSettings();

      // Verify API client was created and fetch was called with correct endpoint
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith('/admin/system-settings');
      
      // Verify result
      expect(result).toEqual(mockSettings);
    });

    it('should update system settings', async () => {
      // Setup mock response
      const mockResponse = { 
        success: true,
        key: 'maintenance_mode',
        value: true
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockResponse));

      // Call the function
      const result = await admin.updateSystemSettings('maintenance_mode', true);

      // Verify API client was created and fetch was called with correct parameters
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/system-settings',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'maintenance_mode', value: true })
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Platform Statistics', () => {
    it('should fetch platform stats', async () => {
      // Setup mock response
      const mockStats = { 
        total_users: 1000,
        active_users: 500,
        total_contests: 50,
        active_contests: 5
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockStats));

      // Call the function
      const result = await admin.getPlatformStats();

      // Verify API client was created and fetch was called with correct endpoint
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith('/admin/stats/platform');
      
      // Verify result
      expect(result).toEqual(mockStats);
    });
  });

  describe('IP Ban Management', () => {
    it('should add IP ban', async () => {
      // Setup mock request and response
      const banData = {
        ip_address: '192.168.1.1',
        reason: 'Testing',
        is_permanent: true,
        troll_level: 3
      };
      const mockResponse = { 
        success: true,
        ...banData,
        banned_at: '2023-01-01T00:00:00Z'
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockResponse));

      // Call the function
      const result = await admin.ipBan.add(banData);

      // Verify API client was created and fetch was called with correct parameters
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/ip-bans',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(banData)
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });

    it('should list IP bans', async () => {
      // Setup mock response
      const mockBansResponse = {
        data: [
          { 
            ip_address: '192.168.1.1', 
            reason: 'Testing', 
            banned_at: '2023-01-01T00:00:00Z', 
            is_permanent: true 
          },
          { 
            ip_address: '10.0.0.1', 
            reason: 'Suspicious activity', 
            banned_at: '2023-02-01T00:00:00Z', 
            expires_at: '2023-03-01T00:00:00Z' 
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockBansResponse));

      // Call the function
      const result = await admin.ipBan.list();

      // Verify API client was created and fetch was called with correct endpoint
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith('/admin/ip-bans');
      
      // Verify result
      expect(result).toEqual(mockBansResponse);
    });

    it('should remove an IP ban', async () => {
      // Setup mock response
      const ipAddress = '192.168.1.1';
      const mockResponse = { 
        success: true,
        message: 'IP ban removed successfully'
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockResponse));

      // Call the function
      const result = await admin.ipBan.remove(ipAddress);

      // Verify API client was created and fetch was called with correct parameters
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        `/admin/ip-bans/${ipAddress}`,
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      
      // Verify result
      expect(result).toEqual(mockResponse);
    });
  });

  describe('User Management', () => {
    it('should adjust user balance', async () => {
      // Setup mock request and response
      const walletAddress = 'user-wallet-123';
      const amount = 1000;
      const mockResponse = { 
        success: true,
        message: 'Balance adjusted successfully'
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockResponse));

      // Call the function
      await admin.adjustUserBalance(walletAddress, amount);

      // Verify API client was created and fetch was called with correct parameters
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        `/users/${walletAddress}/balance`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ amount })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle and propagate API errors', async () => {
      // Setup mock error
      const error = new Error('API error');
      mockFetch.mockRejectedValue(error);

      // Expect function to throw error
      await expect(admin.getPlatformStats()).rejects.toThrow('API error');
      
      // Verify API client was created and fetch was attempted
      expect(utils.createApiClient).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});