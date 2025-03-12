// src/components/routes/AuthenticatedRoute.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthenticatedRoute } from "./AuthenticatedRoute";
import { User } from "../../types";

// Mock the useAuth hook to test different authentication scenarios
jest.mock("../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

// Import the mocked useAuth
const { useAuth } = jest.requireMock("../../hooks/useAuth");

describe("AuthenticatedRoute component", () => {
  const TestComponent = () => <div>Protected Authenticated Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to set up the useAuth mock with different states
  const setupAuth = ({
    user = null,
    loading = false,
  }: {
    user?: User | null;
    loading?: boolean;
  }) => {
    useAuth.mockReturnValue({
      user,
      loading,
    });
  };

  // Helper function to render the component with a router
  const renderAuthenticatedRoute = () => {
    return render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <AuthenticatedRoute>
                <TestComponent />
              </AuthenticatedRoute>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders loading spinner when authentication is in progress", () => {
    setupAuth({ loading: true });
    renderAuthenticatedRoute();

    // Should show loading indicator
    expect(screen.getByRole("status")).toBeInTheDocument();
    // The protected content should not be visible
    expect(screen.queryByText("Protected Authenticated Content")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    const mockUser: User = {
      wallet_address: "test-wallet",
      nickname: "Test User",
      role: "user",
      created_at: "2023-01-01T00:00:00.000Z",
      last_login: "2023-01-01T00:00:00.000Z",
      total_contests: 0,
      total_wins: 0,
      total_earnings: 0,
      rank_score: 0,
      settings: {},
      balance: 1000,
      is_banned: false,
      ban_reason: null,
      risk_level: "low",
      jwt: "test-jwt",
    };

    setupAuth({ user: mockUser });
    renderAuthenticatedRoute();

    // Protected content should be visible
    expect(screen.getByText("Protected Authenticated Content")).toBeInTheDocument();
  });

  it("redirects to home when user is not authenticated", () => {
    setupAuth({ user: null });
    renderAuthenticatedRoute();

    // Should redirect to home page
    expect(screen.getByText("Home Page")).toBeInTheDocument();
    // The protected content should not be visible
    expect(screen.queryByText("Protected Authenticated Content")).not.toBeInTheDocument();
  });
});