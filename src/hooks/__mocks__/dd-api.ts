export const ddApi = {
  fetch: jest.fn().mockImplementation((path: string, options?: RequestInit) => {
    // Default successful responses for different endpoints
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
};
