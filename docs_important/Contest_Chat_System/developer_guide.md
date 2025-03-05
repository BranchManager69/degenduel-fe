# Contest Chat System Developer Guide

This guide provides instructions for developers who want to use, modify, or extend the Contest Chat System.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Integration Guide](#integration-guide)
3. [Customization](#customization)
4. [Adding New Features](#adding-new-features)
5. [Testing](#testing)
6. [Common Issues](#common-issues)
7. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- React 16.8+ (for Hooks support)
- TypeScript 4.0+
- Tailwind CSS 2.0+
- WebSocket server for real-time communication

### File Structure

```
src/
└── components/
    └── contest-chat/
        ├── ContestChatManager.tsx    # Top-level component
        ├── FloatingContestChat.tsx   # Individual chat window
        └── ContestChat.tsx           # Chat interface
```

### Dependencies

The chat system relies on the following hooks and services:

- `useUserContests`: Fetches the list of contests the user is participating in
- `useContestChatWebSocket`: Manages WebSocket connection for a specific contest
- `contestService`: Provides contest data and operations

## Integration Guide

### Basic Integration

To add the chat system to your application, import the `ContestChatManager` component and add it to your app:

```tsx
import React from "react";
import { ContestChatManager } from "./components/contest-chat/ContestChatManager";

function App() {
  return (
    <div className="app">
      {/* Your app content */}
      <ContestChatManager />
    </div>
  );
}

export default App;
```

The `ContestChatManager` is designed to be used at the application level, as it manages all chat windows and provides a global chat button.

### WebSocket Integration

The chat system expects a WebSocket server that follows a specific protocol. The WebSocket connection is managed by the `useContestChatWebSocket` hook, which should be implemented to match your backend.

Example implementation:

```tsx
export const useContestChatWebSocket = (contestId: string) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // WebSocket connection logic
  useEffect(() => {
    if (!contestId) {
      setError("Missing contestId");
      return;
    }

    const ws = new WebSocket(
      `wss://your-websocket-server.com/chat/${contestId}`
    );

    ws.onopen = () => {
      // Dispatch connection event
      window.dispatchEvent(
        new CustomEvent("ws-debug", {
          detail: { type: "connection" },
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "participants") {
        setParticipants(data.participants);
      } else if (data.type === "user_info") {
        setCurrentUserId(data.userId);
      } else if (data.type === "error") {
        setError(data.message);
        if (data.rateLimited) {
          setIsRateLimited(true);
          setTimeout(() => setIsRateLimited(false), 5000);
        }
      }
    };

    ws.onerror = () => {
      setError("Connection error");
      window.dispatchEvent(
        new CustomEvent("ws-debug", {
          detail: { type: "error", message: "Connection error" },
        })
      );
    };

    ws.onclose = () => {
      setError("Connection closed");
    };

    return () => {
      ws.close();
    };
  }, [contestId]);

  const sendMessage = (text: string) => {
    if (isRateLimited) return;

    // Send message logic
    // ...
  };

  return {
    participants,
    messages,
    isRateLimited,
    error,
    sendMessage,
    currentUserId,
  };
};
```

## Customization

### Styling

The chat system uses Tailwind CSS for styling. You can customize the appearance by modifying the CSS classes in the component files.

#### Color Scheme

To change the color scheme, modify the following functions in each component:

- `getHeaderGradient`
- `getStatusColor`
- `getAdminBadgeStyle`
- `getAdminMessageStyle`
- `getAdminTextColor`
- `getSendButtonGradient`
- `getFocusRingColor`

#### Layout

To adjust the layout, modify the following properties:

- In `FloatingContestChat.tsx`:

  - `rightPosition` calculation
  - `bottomPosition` value
  - Width and height values

- In `ContestChatManager.tsx`:
  - Button position (fixed bottom-1/3 right-4)
  - Contest selector position and dimensions

### Animations

Custom animations are defined in the `tailwind.config.js` file. You can modify these animations or add new ones:

```js
// In tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in-right": "slideInRight 0.3s ease-in-out",
        "slide-in-bottom": "slideInBottom 0.3s ease-in-out",
        "slide-out-bottom": "slideOutBottom 0.3s ease-in-out",
        "bounce-in": "bounceIn 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Other keyframes...
      },
    },
  },
};
```

## Adding New Features

### Message Reactions

To add message reactions:

1. Update the `Message` interface to include reactions:

```typescript
interface MessageReaction {
  emoji: string;
  userId: string;
  username: string;
}

interface Message {
  // Existing properties...
  reactions?: MessageReaction[];
}
```

2. Add UI for displaying and adding reactions in `ContestChat.tsx`:

```tsx
// Inside the message rendering
<div className="message-reactions mt-1 flex flex-wrap gap-1">
  {msg.reactions?.map((reaction, index) => (
    <button
      key={`${reaction.emoji}-${index}`}
      className="reaction-badge bg-gray-800 hover:bg-gray-700 rounded-full px-2 py-0.5 text-xs flex items-center"
      title={`${reaction.username}`}
      onClick={() => handleToggleReaction(msg.messageId, reaction.emoji)}
    >
      <span className="mr-1">{reaction.emoji}</span>
      <span>
        {msg.reactions?.filter((r) => r.emoji === reaction.emoji).length}
      </span>
    </button>
  ))}
  <button
    className="add-reaction text-gray-500 hover:text-gray-300 rounded-full p-1"
    onClick={() => handleShowReactionPicker(msg.messageId)}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  </button>
</div>
```

3. Implement the reaction handling functions:

```typescript
const handleToggleReaction = (messageId: string, emoji: string) => {
  // Send reaction toggle to WebSocket
};

const handleShowReactionPicker = (messageId: string) => {
  // Show reaction picker UI
};
```

### Typing Indicators

To add typing indicators:

1. Update the WebSocket hook to track typing status:

```typescript
const [typingUsers, setTypingUsers] = useState<string[]>([]);

// In WebSocket onmessage handler
if (data.type === "typing") {
  if (data.isTyping) {
    setTypingUsers((prev) => [
      ...prev.filter((id) => id !== data.userId),
      data.userId,
    ]);
    // Clear typing status after a delay
    setTimeout(() => {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    }, 3000);
  } else {
    setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
  }
}

// Add function to send typing status
const sendTypingStatus = (isTyping: boolean) => {
  // Send typing status to WebSocket
};
```

2. Add UI for typing indicators in `ContestChat.tsx`:

```tsx
// Before the message input
{
  typingUsers.length > 0 && (
    <div className="typing-indicator text-gray-500 text-sm italic p-2 flex items-center">
      <div className="flex space-x-1 mr-2">
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
      <span>
        {typingUsers.length === 1
          ? `${
              participants.find((p) => p.userId === typingUsers[0])?.nickname ||
              "Someone"
            } is typing...`
          : `${typingUsers.length} people are typing...`}
      </span>
    </div>
  );
}
```

3. Update the message input to send typing status:

```typescript
const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessageText(e.target.value);

  // Send typing status
  if (e.target.value.length > 0) {
    sendTypingStatus(true);
  } else {
    sendTypingStatus(false);
  }
};
```

## Testing

### Unit Testing

Use Jest and React Testing Library to test individual components:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ContestChatManager } from "./ContestChatManager";

// Mock the hooks
jest.mock("../../hooks/useUserContests", () => ({
  useUserContests: () => ({
    contests: [
      { contestId: "contest-1", name: "Test Contest", status: "active" },
    ],
    loading: false,
  }),
}));

describe("ContestChatManager", () => {
  test("renders chat button", () => {
    render(<ContestChatManager />);
    const chatButton = screen.getByRole("button", { name: /toggle chat/i });
    expect(chatButton).toBeInTheDocument();
  });

  test("opens contest selector when button is clicked", () => {
    render(<ContestChatManager />);
    const chatButton = screen.getByRole("button", { name: /toggle chat/i });
    fireEvent.click(chatButton);

    const contestSelector = screen.getByText("Contest Chats");
    expect(contestSelector).toBeInTheDocument();
  });

  // More tests...
});
```

### Integration Testing

Test the interaction between components:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContestChatManager } from "./ContestChatManager";

// Mock the WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
};

global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);

// Mock the hooks
// ...

describe("ContestChatManager Integration", () => {
  test("opens chat when contest is selected", async () => {
    render(<ContestChatManager />);

    // Open contest selector
    const chatButton = screen.getByRole("button", { name: /toggle chat/i });
    fireEvent.click(chatButton);

    // Select a contest
    const contestButton = screen.getByText("Test Contest");
    fireEvent.click(contestButton);

    // Check if chat window is opened
    await waitFor(() => {
      const chatWindow = screen.getByText("Contest Chat");
      expect(chatWindow).toBeInTheDocument();
    });
  });

  // More tests...
});
```

## Common Issues

### WebSocket Connection Issues

If you're experiencing WebSocket connection issues:

1. Check that the WebSocket server URL is correct
2. Ensure the server is running and accessible
3. Check for CORS issues if the WebSocket server is on a different domain
4. Verify that the WebSocket protocol matches between client and server

### Performance Issues

If the chat system is causing performance issues:

1. Limit the number of messages displayed at once (implement pagination)
2. Optimize re-renders by using `React.memo` and `useCallback`
3. Use virtualized lists for long message histories
4. Reduce the frequency of animations and transitions

### Mobile Responsiveness

If there are issues with mobile responsiveness:

1. Test on various device sizes using browser dev tools
2. Ensure media queries are working correctly
3. Check that touch events are properly handled
4. Verify that the mobile detection logic is accurate

## Best Practices

### State Management

- Keep state as local as possible
- Use context for deeply nested components that need access to the same state
- Consider using a state management library for complex state

### Performance Optimization

- Memoize expensive calculations with `useMemo`
- Prevent unnecessary re-renders with `React.memo` and `useCallback`
- Use virtualized lists for long message histories
- Implement pagination for message loading

### Accessibility

- Ensure all interactive elements have appropriate ARIA attributes
- Provide keyboard navigation for all features
- Maintain sufficient color contrast for text
- Include screen reader announcements for dynamic content

### Error Handling

- Provide clear error messages to users
- Implement automatic reconnection for WebSocket failures
- Log errors for debugging purposes
- Gracefully degrade functionality when features are unavailable

### Code Organization

- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use consistent naming conventions
- Document complex logic with comments

## Conclusion

This developer guide provides a comprehensive overview of how to use, customize, and extend the Contest Chat System. By following these guidelines, you can ensure that your implementation is robust, performant, and maintainable.
