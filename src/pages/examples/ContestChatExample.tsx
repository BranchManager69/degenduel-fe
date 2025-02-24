import React, { useState } from "react";
import { ContestChat } from "../../components/contest/ContestChat";

const ContestChatExample: React.FC = () => {
  const [contestId, setContestId] = useState("123"); // Default contest ID

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Contest Chat Example</h1>

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

      <div className="h-[600px] border border-gray-700 rounded-lg overflow-hidden">
        <ContestChat contestId={contestId} />
      </div>

      <div className="mt-8 bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Implementation Guide</h2>
        <p className="mb-4">
          To use the ContestChat component in your application:
        </p>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
          {`import { ContestChat } from '../components/contest/ContestChat';

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
      </div>
    </div>
  );
};

export default ContestChatExample;
