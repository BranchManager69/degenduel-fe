import { act, render, waitFor } from "@testing-library/react";
import { authService } from "../services";
import { UnifiedWebSocketProvider, useWebSocket } from "./UnifiedWebSocketContext";

// Mock the config file to avoid import.meta.env issues
jest.mock("../config/config", () => ({
  authDebug: jest.fn(),
  NODE_ENV: "test",
  API_URL: "http://localhost:3000/api",
  PRELAUNCH_MODE: false,
  config: {
    ENV: {
      NODE_ENV: "test",
      IS_DEV: true,
      IS_PROD: false
    }
  }
}));

// Mock the websocket types to avoid ES modules issues
jest.mock("../hooks/websocket/types", () => ({
  DDExtendedMessageType: {
    PING: 'PING',
    PONG: 'PONG',
    ACKNOWLEDGMENT: 'ACKNOWLEDGMENT',
    ERROR: 'ERROR',
    SUBSCRIBE: 'SUBSCRIBE',
    UNSUBSCRIBE: 'UNSUBSCRIBE',
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE',
    SYSTEM: 'SYSTEM',
    UPDATE: 'UPDATE',
    NOTIFICATION: 'NOTIFICATION'
  }
}));

// Mock the unified websocket hook
jest.mock("../hooks/websocket/useUnifiedWebSocket", () => ({
  setupWebSocketInstance: jest.fn()
}));

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: Function | null = null;
  onclose: Function | null = null;
  onmessage: Function | null = null;
  onerror: Function | null = null;
  readyState: number = 0; // WebSocket.CONNECTING
  
  send = jest.fn();
  close = jest.fn();

  constructor(url: string) {
    this.url = url;
    
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = 1; // WebSocket.OPEN
      if (this.onopen) this.onopen({ target: this });
    }, 50);
  }
}

// Create a Jest mock function for WebSocket constructor
const mockWebSocketConstructor = jest.fn().mockImplementation((url: string) => new MockWebSocket(url));

// Mock the WebSocket global
global.WebSocket = mockWebSocketConstructor as any;

// Mock services
jest.mock("../services", () => {
  return {
    authService: {
      getToken: jest.fn().mockResolvedValue("test-auth-token"),
      isAuthenticated: jest.fn().mockReturnValue(false), // Default to false
      on: jest.fn().mockReturnValue(jest.fn()), // Return unsubscribe function
      checkAuth: jest.fn().mockResolvedValue(true),
    },
    TokenType: {
      JWT: 'jwt',
      WS_TOKEN: 'ws_token',
      SESSION: 'session',
      REFRESH: 'refresh'
    },
    AuthEventType: {
      LOGIN: 'login',
      LOGOUT: 'logout',
      AUTH_STATE_CHANGED: 'auth_state_changed',
      TOKEN_REFRESHED: 'token_refreshed',
      AUTH_ERROR: 'auth_error'
    }
  };
});

// Test component to use the WebSocket hook
const TestComponent = () => {
  const { 
    isConnected, 
    isAuthenticated,
    subscribe,
    unsubscribe,
    sendMessage
  } = useWebSocket();

  // Helper function to send a message
  const handleSendMessage = () => {
    sendMessage({ type: "PING" });
  };

  // Helper function to subscribe to a topic
  const handleSubscribe = () => {
    subscribe(["test-topic"]);
  };

  // Helper function to unsubscribe from a topic
  const handleUnsubscribe = () => {
    unsubscribe(["test-topic"]);
  };

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div data-testid="auth-status">
        {isAuthenticated ? "Authenticated" : "Not Authenticated"}
      </div>
      <button 
        onClick={handleSendMessage} 
        data-testid="send-button"
      >
        Send
      </button>
      <button 
        onClick={handleSubscribe} 
        data-testid="subscribe-button"
      >
        Subscribe
      </button>
      <button 
        onClick={handleUnsubscribe} 
        data-testid="unsubscribe-button"
      >
        Unsubscribe
      </button>
    </div>
  );
};

describe("UnifiedWebSocketContext", () => {
  let originalConsoleError: typeof console.error;
  
  beforeAll(() => {
    // Suppress console errors during tests
    originalConsoleError = console.error;
    console.error = jest.fn();
  });
  
  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset WebSocket constructor mock
    mockWebSocketConstructor.mockClear();
    // Reset auth service to default state for each test
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authService.getToken as jest.Mock).mockResolvedValue("test-auth-token");
  });

  test("should establish connection on mount", async () => {
    const { getByTestId } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );

    // Initially disconnected
    expect(getByTestId("connection-status")).toHaveTextContent("Disconnected");
    
    // Wait for connection to establish
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
  });

  test("should authenticate when connection is established", async () => {
    // Enable authentication for this test
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    const { getByTestId } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );
    
    // Wait for connection
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
    
    // Verify token was requested for authentication
    await waitFor(() => {
      expect(authService.getToken).toHaveBeenCalledWith('ws_token');
    });
  });

  test("should send messages when connected", async () => {
    const { getByTestId } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );
    
    // Wait for connection
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
    
    // Get WebSocket instance
    const wsInstance = mockWebSocketConstructor.mock.results[0].value;
    
    // Send a message
    act(() => {
      getByTestId("send-button").click();
    });
    
    // Verify message was sent
    await waitFor(() => {
      expect(wsInstance.send).toHaveBeenCalledWith(expect.stringContaining('"type":"PING"'));
    });
  });

  test("should subscribe to topics", async () => {
    const { getByTestId } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );
    
    // Wait for connection
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
    
    // Get WebSocket instance
    const wsInstance = mockWebSocketConstructor.mock.results[0].value;
    
    // Subscribe to topic
    act(() => {
      getByTestId("subscribe-button").click();
    });
    
    // Verify subscription message was sent
    await waitFor(() => {
      expect(wsInstance.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"SUBSCRIBE"')
      );
      expect(wsInstance.send).toHaveBeenCalledWith(
        expect.stringContaining('"topics":["test-topic"]')
      );
    });
  });

  test("should unsubscribe from topics", async () => {
    const { getByTestId } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );
    
    // Wait for connection
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
    
    // Get WebSocket instance
    const wsInstance = mockWebSocketConstructor.mock.results[0].value;
    
    // Clear previous calls
    wsInstance.send.mockClear();
    
    // Unsubscribe from topic
    act(() => {
      getByTestId("unsubscribe-button").click();
    });
    
    // Verify unsubscription message was sent
    await waitFor(() => {
      const calls = wsInstance.send.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      const unsubscribeCall = calls.find((call: any) => {
        try {
          const message = JSON.parse(call[0]);
          return message.type === 'UNSUBSCRIBE';
        } catch {
          return false;
        }
      });
      
      expect(unsubscribeCall).toBeTruthy();
      if (unsubscribeCall) {
        const message = JSON.parse(unsubscribeCall[0]);
        expect(message.topics).toEqual(['test-topic']);
      }
    });
  });

  test("should clean up connection on unmount", async () => {
    const { getByTestId, unmount } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );
    
    // Wait for connection
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
    
    // Get WebSocket instance
    const wsInstance = mockWebSocketConstructor.mock.results[0].value;
    
    // Unmount component
    unmount();
    
    // Verify connection was closed
    expect(wsInstance.close).toHaveBeenCalled();
  });

  test("should handle async token retrieval without corrupting topics", async () => {
    // Mock async token retrieval that takes some time
    const mockGetToken = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('mock-ws-token'), 100))
    );
    
    (authService.getToken as jest.Mock) = mockGetToken;
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true); // Enable authentication

    const { getByTestId } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );
    
    // Wait for connection
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
    
    // Get WebSocket instance
    const wsInstance = mockWebSocketConstructor.mock.results[0].value;
    
    // Clear previous calls
    wsInstance.send.mockClear();
    
    // Subscribe to topic
    act(() => {
      getByTestId("subscribe-button").click();
    });
    
    // Wait for async token retrieval to complete
    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalledWith('ws_token');
    });
    
    // Verify subscription message was sent with proper topics
    await waitFor(() => {
      const calls = wsInstance.send.mock.calls;
      const subscribeCall = calls.find((call: any) => {
        try {
          const message = JSON.parse(call[0]);
          return message.type === 'SUBSCRIBE';
        } catch {
          return false;
        }
      });
      
      expect(subscribeCall).toBeTruthy();
      
      if (subscribeCall) {
        const message = JSON.parse(subscribeCall[0]);
        expect(message.topics).toEqual(['test-topic']);
        expect(message.topics.length).toBeGreaterThan(0);
        expect(message.authToken).toBe('mock-ws-token');
      }
    });
  });

  test("should handle token retrieval failure gracefully", async () => {
    // Mock token retrieval failure
    const mockGetToken = jest.fn().mockRejectedValue(new Error('Token retrieval failed'));
    
    (authService.getToken as jest.Mock) = mockGetToken;
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true); // Enable authentication

    const { getByTestId } = render(
      <UnifiedWebSocketProvider>
        <TestComponent />
      </UnifiedWebSocketProvider>
    );
    
    // Wait for connection
    await waitFor(() => {
      expect(getByTestId("connection-status")).toHaveTextContent("Connected");
    });
    
    // Get WebSocket instance
    const wsInstance = mockWebSocketConstructor.mock.results[0].value;
    
    // Clear previous calls
    wsInstance.send.mockClear();
    
    // Subscribe to topic
    act(() => {
      getByTestId("subscribe-button").click();
    });
    
    // Wait for token retrieval to fail and fallback message to be sent
    await waitFor(() => {
      const calls = wsInstance.send.mock.calls;
      const subscribeCall = calls.find((call: any) => {
        try {
          const message = JSON.parse(call[0]);
          return message.type === 'SUBSCRIBE';
        } catch {
          return false;
        }
      });
      
      expect(subscribeCall).toBeTruthy();
      
      if (subscribeCall) {
        const message = JSON.parse(subscribeCall[0]);
        expect(message.topics).toEqual(['test-topic']);
        expect(message.topics.length).toBeGreaterThan(0);
        expect(message.authToken).toBeUndefined(); // No token due to failure
      }
    });
  });
});