import { contests } from "./contests";
import { API_URL } from "../../config/config";
import { Contest, PortfolioResponse } from "../../types/index";
import { SortOptions } from "../../types/sort";

// Mock the fetch function
global.fetch = jest.fn();

// Mock the useStore
jest.mock("../../store/useStore", () => ({
  useStore: {
    getState: jest.fn().mockReturnValue({
      user: { wallet_address: "wallet-456" },
    }),
  },
}));

// Mock the utility functions
jest.mock("./utils", () => ({
  checkContestParticipation: jest.fn().mockResolvedValue(false),
  logError: jest.fn(),
}));

describe("Contests API Service", () => {
  const mockResponse = (status: number, data: any) =>
    Promise.resolve({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    }) as unknown as Response;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("Contest retrieval", () => {
    it("should fetch all contests", async () => {
      const mockContests: Partial<Contest>[] = [
        { id: 1, name: "Contest 1", status: "active", participant_count: 10 },
        { id: 2, name: "Contest 2", status: "completed", participant_count: 20 },
      ];

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockContests),
      );

      // Call the function
      const result = await contests.getAll();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/contests`,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          credentials: "include",
        }),
      );

      // Verify result contains the mock contests with is_participating flag
      expect(result).toEqual(
        expect.arrayContaining(
          mockContests.map(contest => expect.objectContaining({
            ...contest,
            is_participating: expect.any(Boolean),
          }))
        )
      );
    });

    it("should fetch all contests with sort options", async () => {
      const mockContests: Partial<Contest>[] = [
        { id: 1, name: "Contest 1", status: "active", participant_count: 10 },
        { id: 2, name: "Contest 2", status: "completed", participant_count: 20 },
      ];

      const sortOptions: SortOptions = {
        field: "participant_count",
        direction: "asc",
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockContests),
      );

      // Call the function
      const result = await contests.getAll(sortOptions);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/contests`,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          credentials: "include",
        }),
      );

      // Verify result is sorted according to options
      expect(result[0].participant_count).toBeLessThanOrEqual(result[1].participant_count);
    });

    it("should fetch a single contest by ID", async () => {
      const contestId = "123";
      const mockContest: Partial<Contest> = {
        id: 123 as number,
        name: "Test Contest",
        description: "Test description",
        start_time: "2023-01-01T00:00:00Z",
        end_time: "2023-01-02T00:00:00Z",
        status: "active",
        entry_fee: "10",
        prize_pool: "1000",
        participant_count: 50,
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockContest),
      );

      // Call the function
      const result = await contests.getById(contestId);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/contests/${contestId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          credentials: "include",
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual({
        ...mockContest,
        is_participating: expect.any(Boolean),
      });
    });

    it("should handle errors when fetching a contest", async () => {
      const contestId = "non-existent";

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(404, { error: "Contest not found" }),
      );

      // Expect function to throw an error
      await expect(contests.getById(contestId)).rejects.toThrow();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/contests/${contestId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          credentials: "include",
        }),
      );
    });
  });

  describe("Contest participation", () => {
    it("should join a contest successfully", async () => {
      const contestId = "123";
      const portfolioData: PortfolioResponse = {
        tokens: [
          { 
            contractAddress: "0xtoken1",
            symbol: "TKN1", 
            weight: 0.5
          },
          { 
            contractAddress: "0xtoken2",
            symbol: "TKN2", 
            weight: 0.5
          },
        ]
      };

      const mockResponseData = {
        success: true,
        message: "Successfully joined the contest",
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockResponseData),
      );

      // Call the function
      const result = await contests.enterContest(contestId, portfolioData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/contests/${contestId}/join`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          credentials: "include",
          body: expect.any(String),
        }),
      );

      // Get the body that was actually passed to fetch
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      
      // Verify it contains wallet_address and token data
      expect(body).toEqual({
        wallet_address: "wallet-456",
        tokens: expect.arrayContaining([
          expect.objectContaining({
            contractAddress: expect.any(String),
            symbol: expect.any(String),
            weight: expect.any(Number),
          }),
        ]),
      });

      // Verify result matches the mock response
      expect(result).toEqual(mockResponseData);
    });
  });

  describe("Contest creation and management", () => {
    it("should create a new contest", async () => {
      const contestData: Partial<Contest> = {
        name: "New Test Contest",
        description: "A test contest created via API",
        start_time: "2023-03-01T00:00:00Z",
        end_time: "2023-03-02T00:00:00Z",
        entry_fee: "5",
        prize_pool: "500",
        min_participants: 10,
      };

      const mockResponseData = {
        id: 789,
        ...contestData,
        status: "pending" as const,
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(201, mockResponseData),
      );

      // Call the function
      const result = await contests.create(contestData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/contests`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          credentials: "include",
          body: JSON.stringify(contestData),
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockResponseData);
    });

    it("should handle validation errors when creating a contest", async () => {
      const invalidContestData = {
        name: "New Test Contest",
        // Missing required fields
      };

      const errorResponse = {
        error: "Validation failed",
        details: ["start_time is required", "end_time is required"],
      };

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(400, errorResponse),
      );

      // Expect function to throw an error
      await expect(
        contests.create(invalidContestData as any),
      ).rejects.toThrow();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/contests`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(invalidContestData),
        }),
      );
    });
  });
});
