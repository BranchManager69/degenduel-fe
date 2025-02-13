import "@testing-library/jest-dom";
import { fetch } from "cross-fetch";

// Add fetch to global scope
(globalThis as any).fetch = fetch;

// Mock window.location
const mockLocation = new URL("http://localhost");
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock ddApi
jest.mock("../src/services/dd-api", () => ({
  ddApi: {
    fetch: jest.fn().mockImplementation((path: string) => {
      // Default mock responses
      switch (path) {
        case "/referrals/leaderboard/stats":
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                total_global_referrals: 0,
                current_period: {
                  start_date: "2024-03-01T00:00:00Z",
                  end_date: "2024-03-07T23:59:59Z",
                  days_remaining: 3,
                },
              }),
          });
        case "/referrals/leaderboard/rankings":
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        default:
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          });
      }
    }),
  },
}));

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
