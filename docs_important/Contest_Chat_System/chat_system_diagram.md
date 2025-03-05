```mermaid
graph TD
    User[User] -->|Interacts with| ChatButton[Chat Button]
    ChatButton -->|Opens| ContestSelector[Contest Selector]
    ContestSelector -->|Selects Contest| ChatManager[ContestChatManager]

    ChatManager -->|Creates| FloatingChat[FloatingContestChat]
    FloatingChat -->|Renders| ChatInterface[ContestChat]

    ChatInterface -->|Connects to| WebSocket[WebSocket Server]
    WebSocket -->|Receives Messages| ChatInterface
    ChatInterface -->|Sends Messages| WebSocket

    ChatInterface -->|Updates| UnreadCount[Unread Count]
    UnreadCount -->|Displayed on| ChatButton

    ChatManager -->|Manages| MultipleChats[Multiple Chat Windows]
    ChatManager -->|Handles| KeyboardShortcuts[Keyboard Shortcuts]
    ChatManager -->|Detects| MobileDevice[Mobile Device]
    MobileDevice -->|Adjusts| ResponsiveUI[Responsive UI]

    subgraph Components
        ChatManager
        FloatingChat
        ChatInterface
    end

    subgraph Features
        MultipleChats
        KeyboardShortcuts
        UnreadCount
        ResponsiveUI
    end

    subgraph Backend
        WebSocket
        Database[(Message Database)]
        WebSocket -->|Stores Messages| Database
        Database -->|Retrieves History| WebSocket
    end

    style ChatManager fill:#f9d,stroke:#333,stroke-width:2px
    style FloatingChat fill:#ad9,stroke:#333,stroke-width:2px
    style ChatInterface fill:#dad,stroke:#333,stroke-width:2px
    style WebSocket fill:#9df,stroke:#333,stroke-width:2px
```

This diagram illustrates the architecture and data flow of the Contest Chat System. It shows how the user interacts with the chat button, which opens the contest selector. The ContestChatManager creates FloatingContestChat components, which render the ContestChat interface. The ContestChat connects to the WebSocket server to send and receive messages in real-time.

The diagram also shows how unread counts are tracked and displayed on the chat button, and how the system handles multiple chat windows, keyboard shortcuts, and responsive UI for mobile devices.

The backend section shows the WebSocket server and the message database, illustrating how messages are stored and retrieved.

To view this diagram, you'll need a Markdown viewer that supports Mermaid diagrams, or you can use the Mermaid Live Editor at https://mermaid.live/.
