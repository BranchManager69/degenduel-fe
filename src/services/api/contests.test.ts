import { contests } from './contests';

// Mock the fetch function
global.fetch = jest.fn();

describe('Contests API Service', () => {
  const mockResponse = (status: number, data: any) => 
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(data)
    }) as Response;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Contest retrieval', () => {
    it('should fetch all contests', async () => {
      const mockContests = [
        { id: 'contest-1', name: 'Contest 1', status: 'active' },
        { id: 'contest-2', name: 'Contest 2', status: 'completed' }
      ];

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockContests)
      );

      // Call the function
      const result = await contests.getAll();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/contests',
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockContests);
    });

    it('should fetch a single contest by ID', async () => {
      const contestId = 'contest-123';
      const mockContest = {
        id: contestId,
        name: 'Test Contest',
        description: 'Test description',
        start_time: '2023-01-01T00:00:00Z',
        end_time: '2023-01-02T00:00:00Z',
        status: 'active',
        entry_fee: 10,
        prize_pool: 1000
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockContest)
      );

      // Call the function
      const result = await contests.getOne(contestId);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contests/${contestId}`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockContest);
    });

    it('should handle errors when fetching a contest', async () => {
      const contestId = 'non-existent';

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(404, { error: 'Contest not found' })
      );

      // Expect function to throw an error
      await expect(contests.getOne(contestId)).rejects.toThrow();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contests/${contestId}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });

  describe('Contest participation', () => {
    it('should join a contest successfully', async () => {
      const contestId = 'contest-123';
      const walletAddress = 'wallet-456';
      
      const mockResponse = {
        success: true,
        message: 'Successfully joined the contest'
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockResponse)
      );

      // Call the function
      const result = await contests.join(contestId, walletAddress);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contests/${contestId}/join`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ wallet_address: walletAddress })
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    it('should submit a portfolio for a contest', async () => {
      const contestId = 'contest-123';
      const walletAddress = 'wallet-456';
      const portfolioData = {
        tokens: [
          { token_id: 'token-1', allocation: 0.5 },
          { token_id: 'token-2', allocation: 0.5 }
        ]
      };
      
      const mockResponse = {
        success: true,
        portfolio_id: 'portfolio-789'
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockResponse)
      );

      // Call the function
      const result = await contests.submitPortfolio(contestId, walletAddress, portfolioData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contests/${contestId}/portfolio`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            wallet_address: walletAddress,
            ...portfolioData
          })
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    it('should validate a portfolio meets contest requirements', async () => {
      const contestId = 'contest-123';
      const portfolioData = {
        tokens: [
          { token_id: 'token-1', allocation: 0.5 },
          { token_id: 'token-2', allocation: 0.5 }
        ]
      };
      
      const mockResponse = {
        valid: true,
        message: 'Portfolio meets all requirements'
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockResponse)
      );

      // Call the function
      const result = await contests.validatePortfolio(contestId, portfolioData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contests/${contestId}/validate-portfolio`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(portfolioData)
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Contest leaderboard', () => {
    it('should fetch contest leaderboard', async () => {
      const contestId = 'contest-123';
      const mockLeaderboard = [
        { 
          wallet_address: 'wallet-1', 
          nickname: 'Player1',
          rank: 1, 
          portfolio_return: 0.25 
        },
        { 
          wallet_address: 'wallet-2', 
          nickname: 'Player2',
          rank: 2, 
          portfolio_return: 0.15 
        }
      ];

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockLeaderboard)
      );

      // Call the function
      const result = await contests.getLeaderboard(contestId);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contests/${contestId}/leaderboard`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockLeaderboard);
    });

    it('should fetch user portfolio performance in a contest', async () => {
      const contestId = 'contest-123';
      const walletAddress = 'wallet-456';
      const mockPerformance = {
        wallet_address: walletAddress,
        rank: 5,
        portfolio_return: 0.12,
        tokens: [
          { token_id: 'token-1', allocation: 0.5, return: 0.2 },
          { token_id: 'token-2', allocation: 0.5, return: 0.04 }
        ]
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockPerformance)
      );

      // Call the function
      const result = await contests.getUserPerformance(contestId, walletAddress);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contests/${contestId}/performance/${walletAddress}`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockPerformance);
    });
  });

  describe('Contest creation and management', () => {
    it('should create a new contest', async () => {
      const contestData = {
        name: 'New Test Contest',
        description: 'A test contest created via API',
        start_time: '2023-03-01T00:00:00Z',
        end_time: '2023-03-02T00:00:00Z',
        entry_fee: 5,
        prize_pool: 500,
        min_participants: 10
      };
      
      const mockResponse = {
        id: 'new-contest-789',
        ...contestData,
        status: 'pending'
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(201, mockResponse)
      );

      // Call the function
      const result = await contests.create(contestData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/contests',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(contestData)
        })
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors when creating a contest', async () => {
      const invalidContestData = {
        name: 'New Test Contest',
        // Missing required fields
      };
      
      const errorResponse = {
        error: 'Validation failed',
        details: ['start_time is required', 'end_time is required']
      };

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(400, errorResponse)
      );

      // Expect function to throw an error
      await expect(contests.create(invalidContestData as any)).rejects.toThrow();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/contests',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(invalidContestData)
        })
      );
    });
  });
});