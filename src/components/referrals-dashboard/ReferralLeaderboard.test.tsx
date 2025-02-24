import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ddApi } from "../../services/dd-api";
import { ReferralDashboard } from "./ReferralDashboard";

// Mock the API
jest.mock("../../services/dd-api");
const mockDdApi = ddApi as jest.Mocked<typeof ddApi>;

// Mock the useReferral hook
jest.mock("../../hooks/useReferral", () => ({
  useReferral: () => ({
    stats: {
      total_referrals: 50,
      qualified_referrals: 30,
      pending_referrals: 20,
      total_rewards: 1000.5,
      recent_referrals: [
        {
          username: "user1",
          status: "qualified",
          joined_at: "2024-03-20",
        },
      ],
      recent_rewards: [
        {
          type: "signup_bonus",
          amount: 100,
          date: "2024-03-20",
          description: "Signup bonus",
        },
      ],
    },
    leaderboard: [
      {
        username: "user1",
        referrals: 100,
        lifetime_rewards: 5000,
        period_rewards: 1000,
        rank: 1,
        trend: "up",
      },
      {
        username: "user2",
        referrals: 80,
        lifetime_rewards: 4000,
        period_rewards: 800,
        rank: 2,
        trend: "stable",
      },
    ],
    leaderboardStats: {
      total_global_referrals: 1500,
      current_period: {
        start_date: "2024-03-01",
        end_date: "2024-03-31",
        days_remaining: 10,
      },
      next_payout_date: "2024-04-01",
    },
    isLoading: false,
    error: null,
    refreshAnalytics: jest.fn(),
  }),
}));

describe("ReferralDashboard Leaderboard", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock API responses
    mockDdApi.fetch.mockImplementation((path) => {
      const createResponse = (data: any) => {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
          blob: () => Promise.reject(new Error("Not implemented")),
          formData: () => Promise.reject(new Error("Not implemented")),
          arrayBuffer: () => Promise.reject(new Error("Not implemented")),
          bodyUsed: false,
          body: null,
          redirected: false,
          type: "basic" as ResponseType,
          url: `https://api.example.com${path}`,
          clone: function () {
            return this;
          },
        } as Response);
      };

      switch (path) {
        case "/referrals/stats":
          return createResponse({
            total_referrals: 50,
            qualified_referrals: 30,
            pending_referrals: 20,
            total_rewards: 1000.5,
            recent_referrals: [
              {
                username: "user1",
                status: "qualified",
                joined_at: "2024-03-20",
              },
            ],
            recent_rewards: [
              {
                type: "signup_bonus",
                amount: 100,
                date: "2024-03-20",
                description: "Signup bonus",
              },
            ],
          });
        case "/referrals/code":
          return createResponse({
            referral_code: "TEST123",
          });
        case "/referrals/leaderboard/stats":
          return createResponse({
            total_global_referrals: 1500,
            current_period: {
              start_date: "2024-03-01",
              end_date: "2024-03-31",
              days_remaining: 10,
            },
            next_payout_date: "2024-04-01",
          });
        case "/referrals/leaderboard/rankings":
          return createResponse([
            {
              username: "user1",
              referrals: 100,
              lifetime_rewards: 5000,
              period_rewards: 1000,
              rank: 1,
              trend: "up",
            },
            {
              username: "user2",
              referrals: 80,
              lifetime_rewards: 4000,
              period_rewards: 800,
              rank: 2,
              trend: "stable",
            },
          ]);
        default:
          return Promise.reject(new Error("Not found"));
      }
    });
  });

  const renderWithRouter = (component: React.ReactNode) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  it("should fetch and display leaderboard data", async () => {
    renderWithRouter(<ReferralDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText(/🏆.*Referral Rankings/)).toBeInTheDocument();
        expect(screen.getByText(/Current Period:/)).toBeInTheDocument();
        expect(screen.getByText(/1,500/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("should display milestone rewards", async () => {
    renderWithRouter(<ReferralDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText(/🎯.*Referral Milestones/)).toBeInTheDocument();
        expect(screen.getByText(/Milestone 1/)).toBeInTheDocument();
        expect(screen.getByText(/100 Referrals/)).toBeInTheDocument();
        expect(screen.getByText(/Reward: 1,000 DUEL/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("should display user's referral stats", async () => {
    renderWithRouter(<ReferralDashboard />);

    await waitFor(
      () => {
        // Find the total rewards value
        expect(screen.getByText(/1000.50 SOL/)).toBeInTheDocument();

        // Find total referrals
        expect(screen.getByText(/50 total/)).toBeInTheDocument();

        // Find qualified referrals
        expect(screen.getByText(/30 have dueled/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
