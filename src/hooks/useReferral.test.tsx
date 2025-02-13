import { act, renderHook } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { ReferralProvider, useReferral } from "./useReferral";

// Mock dd-api
jest.mock("../services/dd-api", () => ({
  ddApi: {
    fetch: jest.fn().mockImplementation((path: string) => {
      switch (path) {
        case "/referrals/analytics":
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                clicks: {
                  by_source: { direct: 10 },
                  by_device: { desktop: 8 },
                  by_browser: { chrome: 6 },
                },
                conversions: { by_source: { direct: 5 } },
                rewards: { by_type: { signup_bonus: 100 } },
              }),
          });
        case "/referrals/analytics/click":
        case "/referrals/analytics/conversion":
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <ReferralProvider>{children}</ReferralProvider>
  </MemoryRouter>
);

describe("useReferral", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useReferral(), { wrapper });

    expect(result.current.showWelcomeModal).toBe(false);
    expect(result.current.referralCode).toBe(null);
    expect(typeof result.current.trackConversion).toBe("function");
    expect(typeof result.current.setShowWelcomeModal).toBe("function");
  });

  it("loads referral code from URL params", () => {
    const { result } = renderHook(() => useReferral(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={["/?ref=TEST123"]}>
          <ReferralProvider>{children}</ReferralProvider>
        </MemoryRouter>
      ),
    });

    expect(result.current.referralCode).toBe("TEST123");
  });

  it("shows welcome modal for new referrals", () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useReferral(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={["/?ref=TEST123"]}>
          <ReferralProvider>{children}</ReferralProvider>
        </MemoryRouter>
      ),
    });

    expect(result.current.showWelcomeModal).toBe(true);
  });

  it("tracks conversion successfully", async () => {
    // Mock localStorage to simulate an existing referral session
    mockLocalStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case "referral_code":
          return "TEST123";
        case "referral_session_id":
          return "test-session-id";
        default:
          return null;
      }
    });

    const { result } = renderHook(() => useReferral(), { wrapper });

    await act(async () => {
      await result.current.trackConversion();
    });

    const ddApi = require("../services/dd-api").ddApi;
    expect(ddApi.fetch).toHaveBeenCalledWith(
      "/referrals/analytics/conversion",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          referralCode: "TEST123",
          sessionId: "test-session-id",
        }),
      })
    );
  });

  it("updates showWelcomeModal state correctly", () => {
    const { result } = renderHook(() => useReferral(), { wrapper });

    act(() => {
      result.current.setShowWelcomeModal(true);
    });
    expect(result.current.showWelcomeModal).toBe(true);

    act(() => {
      result.current.setShowWelcomeModal(false);
    });
    expect(result.current.showWelcomeModal).toBe(false);
  });
});
