# Terminal Alter Ego: Chat Room Mode

The Terminal component now has an "alter ego" - it can transform from an AI assistant into a multi-user chat room while keeping the exact same UI and controls.

## 🎭 Two Personalities, One Component

### 🤖 AI Mode (Default)
- Chat with Didi AI assistant
- Get help with DegenDuel features  
- Ask questions about tokens, contests, etc.
- Generate dynamic UI components
- Easter eggs and special commands

### 💬 Chat Room Mode (Alter Ego)
- Real-time multi-user chat via WebSocket
- Connect to different chat rooms (general, contest-specific, private, etc.)
- See online participant count
- System messages for user activity
- Full WebSocket integration with existing infrastructure

## 🔄 How It Works

The Terminal uses a `mode` prop to switch between personalities:

```tsx
<Terminal
  config={terminalConfig}
  mode="ai"           // or "chat-room"
  chatConfig={{
    roomId: 'general-chat',
    roomName: 'General Chat', 
    roomType: 'general'
  }}
  onModeChange={(newMode) => console.log('Mode changed to:', newMode)}
/>
```

## 🎛️ Mode Toggle

Users can switch modes in two ways:

1. **Toggle Button**: Blue/green button in terminal header (🤖/💬)
2. **Programmatic**: Via props or external controls

## 🔧 Configuration

### Terminal Props

```tsx
interface TerminalProps {
  // Existing props...
  mode?: TerminalMode;                    // 'ai' | 'chat-room'
  chatConfig?: ChatRoomConfig;            // Chat room configuration
  onModeChange?: (mode: TerminalMode) => void;
}
```

### Chat Room Config

```tsx
interface ChatRoomConfig {
  roomId: string;                         // Unique room identifier
  roomName?: string;                      // Display name
  roomType?: 'contest' | 'general' | 'private' | 'trading';
  maxParticipants?: number;               // Optional limit
}
```

## 🎨 Visual Differences

### Header Changes
- **Mode Indicator**: Blue "AI" or Green "CHAT" badge
- **Chat Info**: Shows room name and participant count in chat mode
- **Toggle Button**: 🤖 (AI) or 💬 (Chat) icon

### Minimized Avatar
- **Mode Badge**: Small indicator on Didi avatar (🤖/💬)
- **Participant Count**: Shows number of online users in chat rooms
- **Click Behavior**: Opens terminal in current mode

### Message Display
- **AI Mode**: Standard Didi conversation format
- **Chat Mode**: Multi-user format with usernames: `[Username]: message`

## 🚀 Example Usage

```tsx
import { Terminal, TerminalMode, ChatRoomConfig } from '@/components/terminal';

const MyComponent = () => {
  const [mode, setMode] = useState<TerminalMode>('ai');
  const [chatRoom, setChatRoom] = useState<ChatRoomConfig>({
    roomId: 'general-chat',
    roomName: 'General Chat',
    roomType: 'general'
  });

  return (
    <Terminal
      config={terminalConfig}
      mode={mode}
      chatConfig={chatRoom}
      onModeChange={setMode}
      onCommandExecuted={(cmd, response) => {
        console.log(`${mode} mode:`, cmd, '->', response);
      }}
    />
  );
};
```

## 🔌 WebSocket Integration

The alter ego leverages your existing WebSocket infrastructure:

- Uses `useGeneralChatRoom` hook for any room type
- Connects to `chat-{roomType}-{roomId}` topics
- Supports real-time messaging, participant tracking, and room management
- Automatically joins/leaves rooms when switching modes

## 🎯 Chat Room Types

### General Chat
```tsx
{ roomId: 'general-chat', roomType: 'general' }
```

### Contest Chat  
```tsx
{ roomId: 'contest-768', roomType: 'contest' }
```

### Trading Discussion
```tsx
{ roomId: 'trading-chat', roomType: 'trading' }
```

### Private Rooms
```tsx
{ roomId: 'vip-lounge', roomType: 'private' }
```

## 🎪 Demo

See `src/pages/examples/TerminalAlterEgoExample.tsx` for a complete working demo with:
- Mode switching controls
- Multiple chat room options
- Real-time participant counts
- Visual mode indicators

## 🔮 The Magic

The beauty of this implementation is that it's the **exact same component** with different data sources:

- **Same UI**: Terminal header, input, console, minimize/maximize
- **Same Didi Avatar**: Just with different mode indicators
- **Same Controls**: Size toggle, minimize, drag functionality  
- **Same Styling**: Colors, animations, layout
- **Different Behavior**: AI conversation vs. multi-user chat

Perfect for creating rich, context-aware chat experiences that users already know how to use! 