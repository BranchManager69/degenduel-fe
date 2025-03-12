// src/tests/authFlow.test.tsx
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AdminRoute } from "../components/routes/AdminRoute";
import { AuthenticatedRoute } from "../components/routes/AuthenticatedRoute";
import { SuperAdminRoute } from "../components/routes/SuperAdminRoute";
import { AuthProvider } from "../contexts/AuthContext";
import { User } from "../types";

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
}));

// Mock the useStore hook
jest.mock("../store/useStore", () => ({
  useStore: jest.fn(() => ({
    user: null,
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    isConnecting: false,
    setUser: jest.fn(),
  })),
}));

// Mock the useAuth hook
jest.mock("../hooks/useAuth", () => {
  // Create a mockable implementation
  const mockImplementation = {
    user: null,
    loading: false,
    error: null,
    isWalletConnected: false,
    walletAddress: undefined,
    isAdmin: jest.fn(() => false),
    isSuperAdmin: jest.fn(() => false),
    isFullyConnected: jest.fn(() => false),
    checkAuth: jest.fn(),
    getAccessToken: jest.fn(() => Promise.resolve(null)),
  };

  return {
    useAuth: jest.fn(() => mockImplementation),
    __mockImplementation: mockImplementation,
  };
});

// Import the mock implementaion
const { __mockImplementation: mockAuth, useAuth } =
  jest.requireMock("../hooks/useAuth");

// Test components for different route types
const RegularUserContent = () => <div>Regular User Content</div>;
const AdminContent = () => <div>Admin Content</div>;
const SuperAdminContent = () => <div>SuperAdmin Content</div>;
const PublicContent = () => <div>Public Content</div>;

describe("Authentication Flow Integration", () => {
  // Helper function to setup the router and render the test app
  const renderAuthFlowTest = () => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/" element={<PublicContent />} />
            <Route
              path="/dashboard"
              element={
                <AuthenticatedRoute>
                  <RegularUserContent />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminContent />
                </AdminRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <SuperAdminRoute>
                  <SuperAdminContent />
                </SuperAdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated user to home page", async () => {
    // Setup mock to be unauthenticated
    mockAuth.user = null;
    mockAuth.isWalletConnected = false;
    mockAuth.isFullyConnected.mockReturnValue(false);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);

    renderAuthFlowTest();

    // Should redirect to home page
    await waitFor(() => {
      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });
  });

  it("allows authenticated regular user to access protected routes", async () => {
    // Setup mock to be authenticated as regular user
    const mockUser: User = {
      wallet_address: "test-wallet",
      nickname: "RegularUser",
      role: "user",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      total_contests: 5,
      total_wins: 2,
      total_earnings: "500",
      rank_score: 1200,
      settings: {},
      balance: "1000",
      is_banned: false,
      ban_reason: null,
      risk_level: "low",
      jwt: "test-jwt-token",
    };

    mockAuth.user = mockUser;
    mockAuth.isWalletConnected = true;
    mockAuth.walletAddress = "test-wallet";
    mockAuth.isFullyConnected.mockReturnValue(true);
    mockAuth.isAdmin.mockReturnValue(false);
    mockAuth.isSuperAdmin.mockReturnValue(false);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);

    renderAuthFlowTest();

    // Should show the protected regular user content
    await waitFor(() => {
      expect(screen.getByText("Regular User Content")).toBeInTheDocument();
    });
  });

  it("redirects regular user from admin routes", async () => {
    // Setup mock to be authenticated as regular user
    const mockUser: User = {
      wallet_address: "test-wallet",
      nickname: "RegularUser",
      role: "user",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      total_contests: 5,
      total_wins: 2,
      total_earnings: "500",
      rank_score: 1200,
      settings: {},
      balance: "1000",
      is_banned: false,
      ban_reason: null,
      risk_level: "low",
      jwt: "test-jwt-token",
    };

    mockAuth.user = mockUser;
    mockAuth.isWalletConnected = true;
    mockAuth.walletAddress = "test-wallet";
    mockAuth.isFullyConnected.mockReturnValue(true);
    mockAuth.isAdmin.mockReturnValue(false);
    mockAuth.isSuperAdmin.mockReturnValue(false);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);

    // Change route to admin path
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route path="/" element={<PublicContent />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminContent />
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    // Should redirect to home page
    await waitFor(() => {
      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("allows admin user to access admin routes", async () => {
    // Setup mock to be authenticated as admin
    const mockAdminUser: User = {
      wallet_address: "admin-wallet",
      nickname: "AdminUser",
      role: "admin",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      total_contests: 15,
      total_wins: 10,
      total_earnings: "5000",
      rank_score: 5000,
      settings: {},
      balance: "10000",
      is_banned: false,
      ban_reason: null,
      risk_level: "low",
      jwt: "admin-jwt-token",
    };

    mockAuth.user = mockAdminUser;
    mockAuth.isWalletConnected = true;
    mockAuth.walletAddress = "admin-wallet";
    mockAuth.isFullyConnected.mockReturnValue(true);
    mockAuth.isAdmin.mockReturnValue(true);
    mockAuth.isSuperAdmin.mockReturnValue(false);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);

    // Render with admin route
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route path="/" element={<PublicContent />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminContent />
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    // Should show admin content
    await waitFor(() => {
      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });
  });

  it("redirects admin from superadmin routes", async () => {
    // Setup mock to be authenticated as admin (but not superadmin)
    const mockAdminUser: User = {
      wallet_address: "admin-wallet",
      nickname: "AdminUser",
      role: "admin",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      total_contests: 15,
      total_wins: 10,
      total_earnings: "5000",
      rank_score: 5000,
      settings: {},
      balance: "10000",
      is_banned: false,
      ban_reason: null,
      risk_level: "low",
      jwt: "admin-jwt-token",
    };

    mockAuth.user = mockAdminUser;
    mockAuth.isWalletConnected = true;
    mockAuth.walletAddress = "admin-wallet";
    mockAuth.isFullyConnected.mockReturnValue(true);
    mockAuth.isAdmin.mockReturnValue(true);
    mockAuth.isSuperAdmin.mockReturnValue(false);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);

    // Render with superadmin route
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/superadmin"]}>
          <Routes>
            <Route path="/" element={<PublicContent />} />
            <Route
              path="/superadmin"
              element={
                <SuperAdminRoute>
                  <SuperAdminContent />
                </SuperAdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    // Should redirect to home
    await waitFor(() => {
      expect(screen.getByText("Public Content")).toBeInTheDocument();
    });
    expect(screen.queryByText("SuperAdmin Content")).not.toBeInTheDocument();
  });

  it("allows superadmin to access all protected routes", async () => {
    // Setup mock to be authenticated as superadmin
    const mockSuperAdminUser: User = {
      wallet_address: "superadmin-wallet",
      nickname: "SuperAdminUser",
      role: "superadmin",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      total_contests: 20,
      total_wins: 15,
      total_earnings: "10000",
      rank_score: 9000,
      settings: {},
      balance: "50000",
      is_banned: false,
      ban_reason: null,
      risk_level: "low",
      jwt: "superadmin-jwt-token",
    };

    mockAuth.user = mockSuperAdminUser;
    mockAuth.isWalletConnected = true;
    mockAuth.walletAddress = "superadmin-wallet";
    mockAuth.isFullyConnected.mockReturnValue(true);
    mockAuth.isAdmin.mockReturnValue(true); // Superadmin is also an admin
    mockAuth.isSuperAdmin.mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);

    // Test each route individually
    const routes = [
      { path: "/dashboard", content: "Regular User Content" },
      { path: "/admin", content: "Admin Content" },
      { path: "/superadmin", content: "SuperAdmin Content" },
    ];

    for (const route of routes) {
      // Unmount previous render
      act(() => {
        jest.clearAllMocks();
      });

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={[route.path]}>
            <Routes>
              <Route path="/" element={<PublicContent />} />
              <Route
                path="/dashboard"
                element={
                  <AuthenticatedRoute>
                    <RegularUserContent />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminContent />
                  </AdminRoute>
                }
              />
              <Route
                path="/superadmin"
                element={
                  <SuperAdminRoute>
                    <SuperAdminContent />
                  </SuperAdminRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>,
      );

      // Should show the expected content for the route
      await waitFor(() => {
        expect(screen.getByText(route.content)).toBeInTheDocument();
      });
    }
  });

  it("shows loading spinner during authentication check", async () => {
    // Setup mock to be in loading state
    mockAuth.user = null;
    mockAuth.loading = true;
    mockAuth.isWalletConnected = false;
    (useAuth as jest.Mock).mockReturnValue({ ...mockAuth });

    renderAuthFlowTest();

    // Should show loading state
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();

    // Create a new mock implementation to ensure it's properly updated
    const updatedMock = {
      ...mockAuth,
      loading: false,
      user: {
        wallet_address: "test-wallet",
        nickname: "TestUser",
        role: "user",
      },
    };
    updatedMock.isFullyConnected.mockReturnValue(true);

    // Update the mock with the new implementation
    (useAuth as jest.Mock).mockReturnValue(updatedMock);

    // Re-render with the updated user state
    // This approach is more reliable than trying to update state inside an act() call
    const { unmount } = renderAuthFlowTest();
    unmount();
    renderAuthFlowTest();

    // Should now show the protected content
    await waitFor(
      () => {
        expect(screen.getByText("Regular User Content")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
