# DegenDuel Contest Chat

This module implements the contest chat feature for DegenDuel, allowing users to communicate in real-time during contests.

## Components

### ContestChatManager

The main component that manages floating chat windows for all contests the user is participating in. This component is integrated at the App level and automatically shows chat windows for all contests the user is in.

```tsx
// In App.tsx
{
  user && <ContestChatManager />;
}
```

### FloatingContestChat

A floating chat window component that can be minimized/expanded and shows unread message indicators.

```tsx
<FloatingContestChat
  contest={contest}
  position={index}
  isActive={activeChat === contestId}
  onActivate={() => handleActivateChat(contestId)}
  onClose={() => handleCloseChat(contestId)}
/>
```

### ContestChat

The main component that renders the chat interface for a specific contest.

```tsx
import { ContestChat } from "../components/contest/ContestChat";

// In your component:
<ContestChat contestId="your-contest-id" onNewMessage={() => {}} />;
```

#### Props

- `contestId` (string, required): The ID of the contest to join
- `className` (string, optional): Additional CSS classes to apply to the container
- `onNewMessage` (function, optional): Callback when a new message is received

## Hooks

### useUserContests

A hook that fetches and manages the contests the user is participating in.

```tsx
const { contests, loading, error, refetch } = useUserContests();
```

### useContestChatWebSocket

A custom hook that handles WebSocket communication for the contest chat.

```tsx
const {
  participants,
  messages,
  isRateLimited,
  error,
  sendMessage,
  joinRoom,
  leaveRoom,
  currentUserId,
} = useContestChatWebSocket(contestId);
```

#### Parameters

- `contestId` (string): The ID of the contest to join

#### Returns

- `participants`: Array of participants in the chat room
- `messages`: Array of chat messages
- `isRateLimited`: Boolean indicating if the user is currently rate-limited
- `error`: Error message if any
- `sendMessage`: Function to send a new message
- `joinRoom`: Function to manually join the room (called automatically on mount)
- `leaveRoom`: Function to manually leave the room (called automatically on unmount)
- `currentUserId`: The current user's ID

## WebSocket Protocol

### Client → Server Messages

- `JOIN_ROOM`: Join a contest chat room

  ```json
  {
    "type": "JOIN_ROOM",
    "contestId": "123"
  }
  ```

- `LEAVE_ROOM`: Leave a contest chat room

  ```json
  {
    "type": "LEAVE_ROOM",
    "contestId": "123"
  }
  ```

- `SEND_CHAT_MESSAGE`: Send a chat message

  ```json
  {
    "type": "SEND_CHAT_MESSAGE",
    "contestId": "123",
    "text": "Hello everyone!"
  }
  ```

- `PARTICIPANT_ACTIVITY`: Optional activity updates
  ```json
  {
    "type": "PARTICIPANT_ACTIVITY",
    "contestId": "123",
    "activityType": "typing",
    "details": {}
  }
  ```

### Server → Client Messages

- `ROOM_STATE`: Current room participants and state

  ```json
  {
    "type": "ROOM_STATE",
    "participants": [
      {
        "userId": "user1",
        "nickname": "Trader1",
        "isAdmin": false
      },
      {
        "userId": "admin1",
        "nickname": "Admin",
        "isAdmin": true
      }
    ]
  }
  ```

- `CHAT_MESSAGE`: Incoming chat message

  ```json
  {
    "type": "CHAT_MESSAGE",
    "messageId": "msg123",
    "userId": "user1",
    "nickname": "Trader1",
    "isAdmin": false,
    "text": "Hello everyone!",
    "timestamp": "2023-06-15T14:30:00Z"
  }
  ```

- `PARTICIPANT_JOINED`: New user joined

  ```json
  {
    "type": "PARTICIPANT_JOINED",
    "participant": {
      "userId": "user2",
      "nickname": "Trader2",
      "isAdmin": false
    }
  }
  ```

- `PARTICIPANT_LEFT`: User left

  ```json
  {
    "type": "PARTICIPANT_LEFT",
    "userId": "user1"
  }
  ```

- `ERROR`: Error messages
  ```json
  {
    "type": "ERROR",
    "error": "Rate limit exceeded",
    "code": 4290
  }
  ```

## Implementation Details

1. **Message Format**: Chat messages include:

   - `messageId`: Unique identifier
   - `userId`: Sender's ID
   - `nickname`: Sender's display name
   - `isAdmin`: Boolean if sender is admin
   - `text`: Message content (max 200 chars)
   - `timestamp`: ISO timestamp

2. **Rate Limiting**:

   - Server limits to 10 messages per 10 seconds
   - Client-side cooldown when hitting limits
   - Handles ERROR with code 4290 for rate limit exceeded

3. **Participant Tracking**:

   - Displays room participants from ROOM_STATE
   - Updates when receiving PARTICIPANT_JOINED/PARTICIPANT_LEFT
   - Highlights admins with special styling

4. **UI Features**:
   - Chat message container with scrolling
   - Input field with character counter
   - Participant list showing who's online
   - Error messages for validation/rate limiting
   - Visual indicators for your own messages
   - Floating chat windows that can be minimized/expanded
   - Unread message indicators
   - Multi-chat support for all contests the user is in

## Floating Chat System

The floating chat system provides these benefits:

1. **Persistent Access**: Users can access contest chats from anywhere in the application
2. **Multi-Contest Support**: Users can participate in multiple contest chats simultaneously
3. **Non-Intrusive**: Chat windows can be minimized when not in use
4. **Notification System**: Shows unread message indicators
5. **Automatic Discovery**: Automatically finds all contests the user is participating in

The system is designed to be lightweight and non-intrusive, while still providing full chat functionality.
