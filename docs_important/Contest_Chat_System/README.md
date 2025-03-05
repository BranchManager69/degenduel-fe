# Contest Chat System Documentation

## Overview

The Contest Chat System is a real-time communication feature that allows users to chat with other participants in contests. The system provides a floating chat interface that can be accessed from anywhere in the application, with support for multiple concurrent chat windows on desktop and a mobile-optimized experience.

![Contest Chat System](./chat_system_diagram.png)

## Table of Contents

1. [Architecture](#architecture)
2. [Components](#components)
3. [Features](#features)
4. [User Experience](#user-experience)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Mobile Experience](#mobile-experience)
7. [Admin Features](#admin-features)
8. [WebSocket Integration](#websocket-integration)
9. [Styling and Animations](#styling-and-animations)
10. [Future Enhancements](#future-enhancements)

## Architecture

The Contest Chat System is built using a component-based architecture with React. It uses WebSockets for real-time communication and is integrated with the contest management system.

### Data Flow

1. User opens the chat interface
2. WebSocket connection is established for the selected contest
3. Messages are sent and received in real-time
4. Unread message counts are tracked and displayed
5. Chat state is managed within the components

## Components

The system consists of three main components:

### 1. ContestChatManager

The `ContestChatManager` is the top-level component that manages the overall chat experience. It handles:

- Opening and closing chat windows
- Tracking unread message counts
- Managing active chats
- Providing the contest selector interface
- Handling keyboard shortcuts
- Responsive layout for mobile/desktop

**File Location:** `src/components/contest-chat/ContestChatManager.tsx`

### 2. FloatingContestChat

The `FloatingContestChat` component renders an individual chat window for a specific contest. It handles:

- Minimizing/expanding the chat window
- Positioning the window on the screen
- Tracking unread messages for this specific contest
- Styling based on contest status and admin type
- Closing the chat window

**File Location:** `src/components/contest-chat/FloatingContestChat.tsx`

### 3. ContestChat

The `ContestChat` component is responsible for the actual chat functionality within a chat window. It handles:

- Displaying messages
- Sending new messages
- Showing participant information
- Emoji selection
- Error handling
- Rate limiting feedback

**File Location:** `src/components/contest-chat/ContestChat.tsx`

## Features

### Core Features

- **Real-time Messaging**: Instant message delivery and receipt
- **Multiple Chat Windows**: Support for multiple concurrent chat windows (desktop)
- **Unread Message Tracking**: Visual indicators for unread messages
- **Contest Selector**: Searchable dropdown to select contests to chat in
- **Minimizable Windows**: Chat windows can be minimized to save space
- **Emoji Support**: Built-in emoji picker for message composition
- **Participant List**: View all participants in the chat
- **Mobile Optimization**: Responsive design for mobile devices
- **Keyboard Shortcuts**: Efficient keyboard navigation and actions
- **Admin Support**: Special styling and features for admin users
- **Error Handling**: Clear feedback for connection issues and errors

### Enhanced Features

- **Contest Grouping**: Contests are grouped by status (active, upcoming, completed)
- **Search Functionality**: Search for contests by name
- **Mark All as Read**: Clear all unread message notifications at once
- **Animated Transitions**: Smooth animations for all interactions
- **Status Indicators**: Visual indicators for contest status
- **Typing Indicators**: (Placeholder for future implementation)
- **Message Reactions**: (Placeholder for future implementation)

## User Experience

### Chat Button

The chat button is positioned in the bottom-right corner of the screen. It shows:

- The total number of contests available
- A badge with the total unread message count
- Expands on hover to show more information

### Contest Selector

Clicking the chat button opens the contest selector, which displays:

- A search bar to filter contests
- Contests grouped by status (active, upcoming, completed, other)
- Visual indicators for open chats
- Keyboard shortcut hints
- A "Mark all as read" button when there are unread messages

### Chat Windows

Each chat window includes:

- A header with contest name and status
- Minimize and close buttons
- Message history with sender information and timestamps
- A message input area with emoji picker
- Send button with keyboard shortcut hint
- Participant list toggle

## Keyboard Shortcuts

The system supports the following keyboard shortcuts:

| Shortcut           | Action                         |
| ------------------ | ------------------------------ |
| `Alt+C`            | Toggle contest selector        |
| `Alt+M`            | Mark all chats as read         |
| `Alt+1` to `Alt+9` | Switch to specific chat window |
| `Ctrl+Enter`       | Send message                   |
| `Escape`           | Close contest selector         |

## Mobile Experience

On mobile devices, the chat experience is optimized:

- Only one chat window is shown at a time
- The contest selector appears as a bottom drawer
- Chat windows take up the full width of the screen
- The UI is adjusted for touch interaction
- Swipe gestures are supported for navigation

## Admin Features

Admin users have special features and styling:

- Admin badge in the chat header
- Distinctive styling for admin messages
- Admin-specific color schemes based on admin type (admin or superadmin)
- Visual indicators to distinguish admin users in the participant list

## WebSocket Integration

The chat system integrates with WebSockets for real-time communication:

- Connection is established when a chat is opened
- Messages are sent and received in real-time
- Connection status is monitored and errors are handled
- Reconnection is attempted automatically on connection loss

### WebSocket Events

The system uses custom events for communication:

- `contest-chat-unread`: Updates unread message counts
- `contest-chat-mark-all-read`: Clears all unread message counts
- `ws-debug`: Provides connection status and error information

## Styling and Animations

### Color Schemes

The chat system uses the application's color scheme with specific variations:

- **Regular Users**: Brand colors (purple/blue)
- **Admins**: Red theme
- **Super Admins**: Gold/yellow theme

### Animations

Custom animations enhance the user experience:

- `fade-in`: Smooth appearance of new elements
- `slide-in-right`: Elements entering from the right
- `slide-in-bottom`: Elements entering from the bottom
- `slide-out-bottom`: Elements exiting to the bottom
- `bounce-in`: Attention-grabbing entrance animation
- `pulse-slow`: Subtle pulsing effect for notifications

## Code Examples

### Opening a Chat

```typescript
const handleActivateChat = (contestId: string) => {
  // If the chat isn't already open, add it to openChats
  if (!openChats.includes(contestId)) {
    setOpenChats((prev) => [...prev, contestId]);
  }
  setActiveChat(contestId);

  // On mobile, close the contest selector after selecting a chat
  if (isMobile) {
    setShowContestSelector(false);
  }
};
```

### Marking All as Read

```typescript
const handleMarkAllAsRead = useCallback(() => {
  setTotalUnreadCount(0);
  // Dispatch event to reset all unread counts
  window.dispatchEvent(new CustomEvent("contest-chat-mark-all-read"));
}, []);
```

### Handling Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Alt+C to toggle chat selector
    if (e.altKey && e.key === "c") {
      e.preventDefault();
      setShowContestSelector((prev) => !prev);
      if (!showContestSelector && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }

    // Escape to close contest selector
    if (e.key === "Escape" && showContestSelector) {
      setShowContestSelector(false);
    }

    // Alt+M to mark all as read
    if (e.altKey && e.key === "m" && totalUnreadCount > 0) {
      e.preventDefault();
      handleMarkAllAsRead();
    }

    // Alt+1-9 to switch between open chats
    if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) > 0) {
      const chatIndex = parseInt(e.key) - 1;
      if (chatIndex < openChats.length) {
        e.preventDefault();
        handleActivateChat(openChats[chatIndex]);
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [showContestSelector, openChats, totalUnreadCount]);
```

## Future Enhancements

Potential future enhancements for the chat system:

1. **Message Reactions**: Allow users to react to messages with emojis
2. **Typing Indicators**: Show when other users are typing
3. **Message Threading**: Support for threaded conversations
4. **Rich Media Support**: Allow sharing images, links, and other media
5. **Message Search**: Search functionality within chat history
6. **Read Receipts**: Show when messages have been read
7. **User Tagging**: Mention other users with @username
8. **Chat Notifications**: System notifications for new messages
9. **Message Editing**: Allow users to edit their messages
10. **Message Deletion**: Allow users to delete their messages

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failures**

   - Check network connectivity
   - Verify the WebSocket server is running
   - Check for firewall or proxy issues

2. **Missing Messages**

   - Verify WebSocket connection is active
   - Check for rate limiting issues
   - Ensure message format is correct

3. **UI Rendering Issues**
   - Clear browser cache
   - Update to the latest version
   - Check for CSS conflicts

## Implementation Notes

### Performance Considerations

- Chat windows are rendered conditionally to reduce DOM elements
- Animations are hardware-accelerated where possible
- Message history is paginated to handle large chat histories
- Unread counts are managed efficiently to minimize re-renders

### Accessibility

- Keyboard navigation is fully supported
- ARIA attributes are used for screen readers
- Color contrast meets WCAG guidelines
- Focus management is implemented for keyboard users

## Conclusion

The Contest Chat System provides a robust, user-friendly interface for real-time communication within contests. Its modular architecture allows for easy maintenance and future enhancements, while the responsive design ensures a consistent experience across devices.
