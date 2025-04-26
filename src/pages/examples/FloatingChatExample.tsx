import React from "react";

import { ContestChatManager } from "../../components/contest-chat/ContestChatManager";

const FloatingChatExample: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Floating Contest Chat Example</h1>

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">About This Feature</h2>
        <p className="mb-4">
          The floating contest chat system provides a way for users to chat in
          any contest they're participating in, without being tied to a specific
          page. It works like this:
        </p>

        <ul className="list-disc list-inside space-y-2 mb-6">
          <li>
            Automatically detects all contests the user is participating in
          </li>
          <li>Creates a floating chat window for each contest</li>
          <li>Allows minimizing/expanding chats</li>
          <li>Shows unread message indicators</li>
          <li>Persists across page navigation</li>
        </ul>

        <p>
          The chat windows appear at the bottom-right of the screen and can be
          toggled open/closed. This allows users to stay connected to their
          contest communities while browsing the site.
        </p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Implementation</h2>
        <p className="mb-4">
          The floating chat system is implemented using these components:
        </p>

        <ul className="list-disc list-inside space-y-2 mb-6">
          <li>
            <code>ContestChatManager</code> - Manages all chat windows
          </li>
          <li>
            <code>FloatingContestChat</code> - Individual floating chat window
          </li>
          <li>
            <code>ContestChat</code> - The actual chat interface
          </li>
          <li>
            <code>useContestChatWebSocket</code> - WebSocket hook for chat
            functionality
          </li>
          <li>
            <code>useUserContests</code> - Hook to fetch user's contests
          </li>
        </ul>

        <p className="mb-4">
          The system is integrated at the App level, so it's available
          throughout the application for authenticated users.
        </p>

        <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
          {`// In App.tsx
{user && <ContestChatManager />}`}
        </pre>
      </div>

      {/* The ContestChatManager is already included in the App component,
          but we're adding it here too for demonstration purposes */}
      <ContestChatManager />
    </div>
  );
};

export default FloatingChatExample;
