import { act, renderHook } from "@testing-library/react";
import React, { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";

import { ReferralProvider, useReferral } from "../useReferral";

// Extend the NodeJS namespace to include fetch
declare global {
  namespace NodeJS {
    interface Global {
      fetch: jest.Mock;
    }
  }
}

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

// Mock fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

const Wrapper: React.FC<PropsWithChildren> = ({ children }) => (
  <BrowserRouter>
    <ReferralProvider>{children}</ReferralProvider>
  </BrowserRouter>
);

describe("useReferral", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useReferral(), { wrapper: Wrapper });

    expect(result.current.showWelcomeModal).toBe(false);
    expect(result.current.referralCode).toBe(null);
    expect(typeof result.current.trackConversion).toBe("function");
    expect(typeof result.current.setShowWelcomeModal).toBe("function");
  });

  it("loads referral code from URL params", () => {
    // Mock URL with referral code
    const oldLocation = window.location;
    Object.defineProperty(window, "location", {
      value: new URL("http://localhost?ref=TEST123"),
      configurable: true,
    });

    const { result } = renderHook(() => useReferral(), { wrapper: Wrapper });
    expect(result.current.referralCode).toBe("TEST123");

    // Restore original location
    Object.defineProperty(window, "location", {
      value: oldLocation,
      configurable: true,
    });
  });

  it("shows welcome modal for new referrals", () => {
    // Mock URL with referral code
    const oldLocation = window.location;
    Object.defineProperty(window, "location", {
      value: new URL("http://localhost?ref=TEST123"),
      configurable: true,
    });

    // Mock localStorage to indicate user hasn't seen welcome modal
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useReferral(), { wrapper: Wrapper });
    expect(result.current.showWelcomeModal).toBe(true);

    // Restore original location
    Object.defineProperty(window, "location", {
      value: oldLocation,
      configurable: true,
    });
  });

  it("tracks conversion successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useReferral(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.trackConversion();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/referrals/conversion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referralCode: result.current.referralCode,
      }),
    });
  });

  it("updates showWelcomeModal state correctly", () => {
    const { result } = renderHook(() => useReferral(), { wrapper: Wrapper });

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
