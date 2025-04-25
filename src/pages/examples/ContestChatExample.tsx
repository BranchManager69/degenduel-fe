import React, { useState } from "react";

import { ContestChat } from "../../components/contest-chat/ContestChat";
import ContestChatDebugPanel from "../../components/debug/websocket/ContestChatDebugPanel";

const ContestChatExample: React.FC = () => {
  const [contestId, setContestId] = useState("123"); // Default contest ID
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contest Chat Example</h1>
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            showDebugPanel
              ? "bg-purple-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
        >
          {showDebugPanel ? "Hide Debug Panel" : "Show Debug Panel"}
        </button>
      </div>

      <div className="mb-6">
        <label
          htmlFor="contestId"
          className="block text-sm font-medium text-gray-400 mb-2"
        >
          Contest ID
        </label>
        <div className="flex">
          <input
            type="text"
            id="contestId"
            value={contestId}
            onChange={(e) => setContestId(e.target.value)}
            className="bg-gray-700 text-white rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setContestId(contestId)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
          >
            Connect
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Enter a contest ID to connect to its chat room
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main chat component */}
        <div className={`lg:col-span-${showDebugPanel ? '3' : '5'} h-[600px] border border-gray-700 rounded-lg overflow-hidden`}>
          <ContestChat contestId={contestId} />
        </div>
        
        {/* Debug panel */}
        {showDebugPanel && (
          <div className="lg:col-span-2 h-[600px] overflow-auto">
            <ContestChatDebugPanel contestId={contestId} />
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Implementation Guide</h2>
        <p className="mb-4">
          To use the ContestChat component in your application:
        </p>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
          {`import { ContestChat } from '../components/contest-chat/ContestChat';

// In your component:
<ContestChat contestId="your-contest-id" />`}
        </pre>
        <p className="mt-4">
          The component will automatically connect to the WebSocket, join the
          specified contest room, and handle all chat functionality including:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Displaying messages with timestamps</li>
          <li>Showing participants list</li>
          <li>Handling rate limiting</li>
          <li>Auto-scrolling to new messages</li>
          <li>Message character limit (200 chars)</li>
        </ul>
        
        <div className="mt-6 p-3 border border-purple-800 bg-purple-900/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-purple-300">WebSocket Implementation Notes</h3>
          <p className="text-sm text-gray-300 mb-2">
            This component uses the v69 unified WebSocket system with the following features:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Single WebSocket connection shared across the application</li>
            <li>Topic-based subscriptions to 'contest' for chat functionality</li>
            <li>Automatic room joining/leaving when component mounts/unmounts</li>
            <li>Proper error handling and rate limiting support</li>
            <li>Real-time participant tracking and message delivery</li>
            <li>JWT-based authentication for secure communication</li>
          </ul>
          <p className="text-xs text-gray-400 mt-2">
            Show the debug panel to monitor the WebSocket connection and message flow in real-time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContestChatExample;
