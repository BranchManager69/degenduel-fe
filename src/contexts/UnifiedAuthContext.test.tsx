import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthEventType, authService } from "../services";
import { UnifiedAuthProvider, useAuth } from "./UnifiedAuthContext";

// Mock services module
jest.mock("../services", () => {
  const mockAuthServiceInstance = {
    on: jest.fn().mockImplementation(() => {
      // Return unsubscribe function
      return jest.fn();
    }),
    checkAuth: jest.fn().mockResolvedValue(true),
    loginWithWallet: jest.fn().mockResolvedValue({
      id: "test-user-id",
      username: "testuser",
      is_admin: false,
      wallet_address: "test-wallet-address"
    }),
    loginWithPrivy: jest.fn().mockResolvedValue({
      id: "test-privy-user-id",
      username: "privyuser", 
      is_admin: false
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue("mock-token"),
    getUser: jest.fn().mockReturnValue(null),
    isAuthenticated: jest.fn().mockReturnValue(false),
    hasRole: jest.fn()
  };

  return {
    authService: mockAuthServiceInstance,
    AuthEventType: {
      LOGIN: 'login',
      LOGOUT: 'logout',
      AUTH_STATE_CHANGED: 'auth_state_changed',
      TOKEN_REFRESHED: 'token_refreshed',
      AUTH_ERROR: 'auth_error'
    },
    TokenType: {
      JWT: 'jwt',
      WS_TOKEN: 'ws_token',
      SESSION: 'session'
    }
  };
});

// Mock user data
const mockUser = {
  id: "test-user-id",
  username: "testuser",
  is_admin: false,
  wallet_address: "test-wallet-address",
};

// Component that uses the auth hook for testing
const TestComponent = () => {
  const { user, isAuthenticated, loading, loginWithWallet, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {loading
          ? "Loading..."
          : isAuthenticated === true  /* Explicitly compare to true to avoid function call detection */
          ? "Authenticated"
          : "Not Authenticated"}
      </div>
      {user && <div data-testid="user-name">{user.username}</div>}
      <button onClick={() => loginWithWallet("test-wallet", async () => new Uint8Array())} data-testid="login-button">
        Login
      </button>
      <button onClick={() => logout()} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe("UnifiedAuthContext", () => {
  // Access the mock event callback
  const getMockEventCallback = () => {
    // Find the first call to authService.on and extract the callback
    const calls = (authService.on as jest.Mock).mock.calls;
    return calls.length > 0 ? calls[0][1] : null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize with loading state", () => {
    render(
      <UnifiedAuthProvider>
        <TestComponent />
      </UnifiedAuthProvider>
    );

    expect(screen.getByTestId("auth-status")).toHaveTextContent("Loading...");
  });

  test("should subscribe to auth events", () => {
    render(
      <UnifiedAuthProvider>
        <TestComponent />
      </UnifiedAuthProvider>
    );

    expect(authService.on).toHaveBeenCalledWith(
      AuthEventType.AUTH_STATE_CHANGED,
      expect.any(Function)
    );
  });

  test("should update state when auth event is triggered", async () => {
    render(
      <UnifiedAuthProvider>
        <TestComponent />
      </UnifiedAuthProvider>
    );

    // Simulate auth event
    const callback = getMockEventCallback();
    act(() => {
      if (callback) {
        callback({
          type: AuthEventType.AUTH_STATE_CHANGED,
          user: mockUser,
        });
      }
    });

    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("Authenticated");
      expect(screen.getByTestId("user-name")).toHaveTextContent("testuser");
    });
  });

  test("should call loginWithWallet when login button is clicked", async () => {
    const { getByTestId } = render(
      <UnifiedAuthProvider>
        <TestComponent />
      </UnifiedAuthProvider>
    );
    
    // Click login button
    await act(async () => {
      getByTestId("login-button").click();
    });

    // Verify login was called
    expect(authService.loginWithWallet).toHaveBeenCalledWith(
      "test-wallet",
      expect.any(Function)
    );
  });

  test("should call logout when logout button is clicked", async () => {
    const { getByTestId } = render(
      <UnifiedAuthProvider>
        <TestComponent />
      </UnifiedAuthProvider>
    );
    
    // Click logout button
    await act(async () => {
      getByTestId("logout-button").click();
    });

    // Verify logout was called
    expect(authService.logout).toHaveBeenCalled();
  });

  test("should clean up subscription on unmount", () => {
    const unsubscribeMock = jest.fn();
    (authService.on as jest.Mock).mockReturnValueOnce(unsubscribeMock);

    const { unmount } = render(
      <UnifiedAuthProvider>
        <TestComponent />
      </UnifiedAuthProvider>
    );

    // Unmount component
    unmount();

    // Verify unsubscribe was called
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});