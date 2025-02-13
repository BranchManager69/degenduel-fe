import { render, screen, waitFor } from "@testing-library/react";
import { ReferralDashboard } from "./ReferralDashboard";

// Mock the API
jest.mock("../../services/dd-api");

describe("ReferralDashboard Leaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and display leaderboard data", async () => {
    render(<ReferralDashboard />);

    await waitFor(() => {
      // These assertions should fail since the endpoints don't exist yet
      expect(screen.getByText("🏆 Referral Rankings")).toBeInTheDocument();
      expect(screen.getByText(/Current Period/)).toBeInTheDocument();
    });
  });

  it("should display milestone rewards", async () => {
    render(<ReferralDashboard />);

    await waitFor(() => {
      expect(screen.getByText("🎯 Referral Milestones")).toBeInTheDocument();
      expect(screen.getByText("100 Referrals")).toBeInTheDocument();
      expect(screen.getByText("Reward: 1,000 DUEL")).toBeInTheDocument();
    });
  });
});
