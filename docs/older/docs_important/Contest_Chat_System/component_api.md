# Contest Chat System Component API

This document provides detailed information about the props, state, and methods of each component in the Contest Chat System.

## ContestChatManager

The top-level component that manages the overall chat experience.

### Props

| Prop | Type | Default | Description                                 |
| ---- | ---- | ------- | ------------------------------------------- |
| None |      |         | ContestChatManager doesn't accept any props |

### State

| State                 | Type                      | Default | Description                                         |
| --------------------- | ------------------------- | ------- | --------------------------------------------------- |
| `contests`            | `UserContest[]`           | `[]`    | List of contests fetched from useUserContests hook  |
| `openChats`           | `string[]`                | `[]`    | Array of contest IDs that have open chat windows    |
| `activeChat`          | `string \| null`          | `null`  | ID of the currently active chat                     |
| `minimizedChats`      | `Record<string, boolean>` | `{}`    | Record of minimized state for each chat             |
| `isButtonExpanded`    | `boolean`                 | `false` | Whether the chat button is expanded on hover        |
| `totalUnreadCount`    | `number`                  | `0`     | Total number of unread messages across all chats    |
| `connectionError`     | `string \| null`          | `null`  | WebSocket connection error message, if any          |
| `isMobile`            | `boolean`                 | `false` | Whether the device is mobile (screen width < 768px) |
| `showContestSelector` | `boolean`                 | `false` | Whether the contest selector is visible             |
| `searchQuery`         | `string`                  | `""`    | Search query for filtering contests                 |
| `isSearchFocused`     | `boolean`                 | `false` | Whether the search input is focused                 |

### Methods

| Method                | Parameters          | Returns                    | Description                                           |
| --------------------- | ------------------- | -------------------------- | ----------------------------------------------------- |
| `handleCloseChat`     | `contestId: string` | `void`                     | Closes the chat window for the specified contest      |
| `handleActivateChat`  | `contestId: string` | `void`                     | Activates the chat for the specified contest          |
| `getContestById`      | `contestId: string` | `UserContest \| undefined` | Finds a contest by its ID                             |
| `handleMarkAllAsRead` | None                | `void`                     | Marks all chats as read                               |
| `handleUnreadUpdate`  | `e: CustomEvent`    | `void`                     | Event handler for unread message count updates        |
| `handleWSError`       | `e: CustomEvent`    | `void`                     | Event handler for WebSocket errors                    |
| `handleKeyDown`       | `e: KeyboardEvent`  | `void`                     | Event handler for keyboard shortcuts                  |
| `handleClickOutside`  | `e: MouseEvent`     | `void`                     | Event handler for clicks outside the contest selector |

### Usage

```tsx
// The ContestChatManager is typically used at the app level
import { ContestChatManager } from "./components/contest-chat/ContestChatManager";

function App() {
  return (
    <div className="app">
      {/* Other app components */}
      <ContestChatManager />
    </div>
  );
}
```

## FloatingContestChat

Renders an individual chat window for a specific contest.

### Props

| Prop         | Type                                   | Default     | Description                                     |
| ------------ | -------------------------------------- | ----------- | ----------------------------------------------- |
| `contest`    | `UserContest`                          | Required    | The contest object for this chat                |
| `onClose`    | `() => void`                           | Required    | Callback function when the chat is closed       |
| `position`   | `number`                               | Required    | Position index for positioning multiple windows |
| `isActive`   | `boolean`                              | Required    | Whether this chat is currently active           |
| `onActivate` | `() => void`                           | Required    | Callback function when the chat is activated    |
| `adminType`  | `"admin" \| "superadmin" \| undefined` | `undefined` | Optional admin type for styling                 |
| `className`  | `string`                               | `""`        | Additional CSS classes                          |

### State

| State         | Type      | Default | Description                            |
| ------------- | --------- | ------- | -------------------------------------- |
| `isMinimized` | `boolean` | `true`  | Whether the chat window is minimized   |
| `unreadCount` | `number`  | `0`     | Number of unread messages in this chat |

### Methods

| Method                 | Parameters | Returns  | Description                                                       |
| ---------------------- | ---------- | -------- | ----------------------------------------------------------------- |
| `handleToggleMinimize` | None       | `void`   | Toggles the minimized state of the chat window                    |
| `handleMarkAllAsRead`  | None       | `void`   | Event handler for the mark-all-read event                         |
| `getStatusColor`       | None       | `string` | Returns the CSS class for the contest status color                |
| `getHeaderGradient`    | None       | `string` | Returns the CSS class for the header gradient based on admin type |
| `getIconAnimation`     | None       | `string` | Returns the CSS class for icon animation based on admin type      |
| `getBadgeColor`        | None       | `string` | Returns the CSS class for badge color based on admin type         |

### Usage

```tsx
import { FloatingContestChat } from "./components/contest-chat/FloatingContestChat";

// Inside a component that manages chats
<FloatingContestChat
  contest={contest}
  position={index}
  isActive={activeChat === contest.contestId}
  onActivate={() => handleActivateChat(contest.contestId)}
  onClose={() => handleCloseChat(contest.contestId)}
  className=""
/>;
```

## ContestChat

Responsible for the actual chat functionality within a chat window.

### Props

| Prop           | Type                                   | Default     | Description                                      |
| -------------- | -------------------------------------- | ----------- | ------------------------------------------------ |
| `contestId`    | `string`                               | Required    | ID of the contest for this chat                  |
| `className`    | `string`                               | `""`        | Additional CSS classes                           |
| `onNewMessage` | `() => void \| undefined`              | `undefined` | Callback function when a new message is received |
| `adminType`    | `"admin" \| "superadmin" \| undefined` | `undefined` | Optional admin type for styling                  |

### State

| State              | Type      | Default | Description                               |
| ------------------ | --------- | ------- | ----------------------------------------- |
| `messageText`      | `string`  | `""`    | Current message being composed            |
| `showParticipants` | `boolean` | `false` | Whether to show the participants list     |
| `isMobile`         | `boolean` | `false` | Whether the device is mobile              |
| `isSending`        | `boolean` | `false` | Whether a message is currently being sent |
| `showEmojiPicker`  | `boolean` | `false` | Whether the emoji picker is visible       |

### Hook Values

| Value           | Type                     | Description                             |
| --------------- | ------------------------ | --------------------------------------- |
| `participants`  | `Participant[]`          | List of participants in the chat        |
| `messages`      | `Message[]`              | List of messages in the chat            |
| `isRateLimited` | `boolean`                | Whether message sending is rate-limited |
| `error`         | `string \| null`         | Error message, if any                   |
| `sendMessage`   | `(text: string) => void` | Function to send a message              |
| `currentUserId` | `string`                 | ID of the current user                  |

### Methods

| Method                  | Parameters                                | Returns  | Description                               |
| ----------------------- | ----------------------------------------- | -------- | ----------------------------------------- |
| `handleSubmit`          | `e: React.FormEvent`                      | `void`   | Handles form submission to send a message |
| `handleKeyDown`         | `e: React.KeyboardEvent`                  | `void`   | Handles keyboard shortcuts                |
| `handleEmojiSelect`     | `emoji: string`                           | `void`   | Handles emoji selection                   |
| `formatTime`            | `timestamp: string`                       | `string` | Formats a timestamp for display           |
| `getProfilePicture`     | `userId: string, profilePicture?: string` | `string` | Gets a profile picture URL                |
| `getAdminBadgeStyle`    | None                                      | `string` | Gets CSS class for admin badge            |
| `getAdminMessageStyle`  | None                                      | `string` | Gets CSS class for admin messages         |
| `getAdminTextColor`     | None                                      | `string` | Gets CSS class for admin text color       |
| `getSendButtonGradient` | None                                      | `string` | Gets CSS class for send button gradient   |
| `getFocusRingColor`     | None                                      | `string` | Gets CSS class for focus ring color       |
| `getAdminBadgeText`     | None                                      | `string` | Gets text for admin badge                 |

### Usage

```tsx
import { ContestChat } from "./components/contest-chat/ContestChat";

// Inside the FloatingContestChat component
<ContestChat
  contestId={contest.contestId}
  onNewMessage={() => {
    if (!isActive || isMinimized) {
      setUnreadCount((prev) => prev + 1);
      // Dispatch event for ContestChatManager to update total unread count
      window.dispatchEvent(
        new CustomEvent("contest-chat-unread", {
          detail: {
            contestId: contest.contestId,
            action: "increment",
          },
        })
      );
    }
  }}
  adminType={adminType}
/>;
```

## Custom Events

The chat system uses custom events for communication between components.

### contest-chat-unread

Used to update unread message counts.

```typescript
// Increment unread count
window.dispatchEvent(
  new CustomEvent("contest-chat-unread", {
    detail: {
      contestId: "contest-123",
      action: "increment",
    },
  })
);

// Set unread count to a specific value
window.dispatchEvent(
  new CustomEvent("contest-chat-unread", {
    detail: {
      contestId: "contest-123",
      count: 5,
      action: "set",
    },
  })
);

// Reset unread count
window.dispatchEvent(
  new CustomEvent("contest-chat-unread", {
    detail: {
      contestId: "contest-123",
      action: "reset",
    },
  })
);
```

### contest-chat-mark-all-read

Used to clear all unread message counts.

```typescript
// Mark all chats as read
window.dispatchEvent(new CustomEvent("contest-chat-mark-all-read"));
```

### ws-debug

Used to provide connection status and error information.

```typescript
// Connection error
window.dispatchEvent(
  new CustomEvent("ws-debug", {
    detail: {
      type: "error",
      message: "Connection lost",
    },
  })
);

// Connection established
window.dispatchEvent(
  new CustomEvent("ws-debug", {
    detail: {
      type: "connection",
    },
  })
);
```

## Types

### UserContest

```typescript
interface UserContest {
  contestId: string;
  name: string;
  status?: string;
  // Other contest properties
}
```

### Message

```typescript
interface Message {
  messageId: string;
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
  profilePicture?: string;
  isAdmin?: boolean;
}
```

### Participant

```typescript
interface Participant {
  userId: string;
  nickname: string;
  profilePicture?: string;
  isAdmin?: boolean;
}
```
