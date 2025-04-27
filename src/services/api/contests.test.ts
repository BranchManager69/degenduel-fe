import { contests, ContestSchedule, ContestScheduleDetail } from "./contests";

// Mock the fetch function
global.fetch = jest.fn();

// Mock the store
jest.mock("../../store/useStore", () => ({
  useStore: {
    getState: jest.fn().mockReturnValue({
      user: { wallet_address: "wallet-456" },
    }),
  },
}));

describe("Contest Schedules API", () => {
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

  describe("getSchedules", () => {
    it("should fetch all contest schedules", async () => {
      const mockSchedules: ContestSchedule[] = [
        {
          id: 1,
          name: "Daily Contest",
          days: [1, 2, 3, 4, 5],
          hour: 14,
          minute: 0,
          duration_hours: 1.5,
          entry_fee: "1.00",
          upcoming_contests: [
            {
              id: 101,
              name: "Daily Contest #101",
              start_time: "2025-04-27T14:00:00.000Z",
              end_time: "2025-04-27T15:30:00.000Z",
              entry_fee: "1.00",
              prize_pool: "100.00",
              status: "pending"
            }
          ],
          allow_multiple_hours: false,
          multiple_hours: []
        }
      ];

      const mockApiResponse = {
        success: true,
        data: mockSchedules
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockApiResponse),
      );

      // Call the function
      const result = await contests.getSchedules();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/contests/schedules"),
        expect.objectContaining({
          credentials: "include",
        }),
      );

      // Verify result contains the mock schedules
      expect(result).toEqual(mockApiResponse);
      expect(result.data).toEqual(mockSchedules);
    });

    it("should handle errors when fetching schedules", async () => {
      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(500, { error: "Server error" }),
      );

      // Expect function to throw an error
      await expect(contests.getSchedules()).rejects.toThrow();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/contests/schedules"),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });
  });

  describe("getScheduleById", () => {
    it("should fetch a schedule by ID", async () => {
      const scheduleId = 1;
      const mockSchedule: ContestScheduleDetail = {
        id: 1,
        name: "Daily Contest",
        days: [1, 2, 3, 4, 5],
        hour: 14,
        minute: 0,
        duration_hours: 1.5,
        entry_fee: "1.00",
        upcoming_contests: [
          {
            id: 101,
            name: "Daily Contest #101",
            start_time: "2025-04-27T14:00:00.000Z",
            end_time: "2025-04-27T15:30:00.000Z",
            entry_fee: "1.00",
            prize_pool: "100.00",
            status: "pending"
          }
        ],
        allow_multiple_hours: false,
        multiple_hours: [],
        template: {
          id: 1,
          name: "Standard Contest",
          description: "Standard daily trading contest",
          entry_fee: "1.00",
          min_participants: 2,
          max_participants: 50
        }
      };

      const mockApiResponse = {
        success: true,
        data: mockSchedule
      };

      // Setup the mock to return success response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(200, mockApiResponse),
      );

      // Call the function
      const result = await contests.getScheduleById(scheduleId);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/contests/schedules/${scheduleId}`),
        expect.objectContaining({
          credentials: "include",
        }),
      );

      // Verify result matches the mock response
      expect(result).toEqual(mockApiResponse);
      expect(result.data).toEqual(mockSchedule);
    });

    it("should handle errors when fetching a schedule by ID", async () => {
      const scheduleId = 999;

      // Setup the mock to return error response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockResponse(404, { error: "Schedule not found" }),
      );

      // Expect function to throw an error
      await expect(contests.getScheduleById(scheduleId)).rejects.toThrow();

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/contests/schedules/${scheduleId}`),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });
  });
});