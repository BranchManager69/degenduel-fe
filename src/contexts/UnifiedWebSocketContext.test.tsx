import { render, act, waitFor } from "@testing-library/react";
import { UnifiedWebSocketProvider, useWebSocket } from "./UnifiedWebSocketContext";
import { authService, TokenType } from "../services";

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

// Mock the WebSocket global
global.WebSocket = MockWebSocket as any;

// Mock services
jest.mock("../services", () => {
  return {
    authService: {
      getToken: jest.fn().mockResolvedValue("test-auth-token"),
      on: jest.fn().mockReturnValue(jest.fn()), // Return unsubscribe function
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
    // Reset mock to track calls
    (authService.getToken as jest.Mock).mockClear();
    
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
      expect(authService.getToken).toHaveBeenCalledWith(TokenType.WS_TOKEN);
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
    const wsInstance = (global.WebSocket as unknown as jest.Mock).mock.instances[0];
    
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
    const wsInstance = (global.WebSocket as unknown as jest.Mock).mock.instances[0];
    
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
    const wsInstance = (global.WebSocket as unknown as jest.Mock).mock.instances[0];
    
    // Unsubscribe from topic
    act(() => {
      getByTestId("unsubscribe-button").click();
    });
    
    // Verify unsubscription message was sent
    await waitFor(() => {
      expect(wsInstance.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"UNSUBSCRIBE"')
      );
      expect(wsInstance.send).toHaveBeenCalledWith(
        expect.stringContaining('"topics":["test-topic"]')
      );
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
    const wsInstance = (global.WebSocket as unknown as jest.Mock).mock.instances[0];
    
    // Unmount component
    unmount();
    
    // Verify connection was closed
    expect(wsInstance.close).toHaveBeenCalled();
  });
});