import React from "react";
import { SuperAdminChatManager } from "../../components/admin/SuperAdminChatManager";

const SuperAdminChatExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-brand-400 mb-2">
            Super Admin Chat Dashboard
          </h1>
          <p className="text-gray-400">
            Monitor and manage all contest chats from a single interface
          </p>
        </header>

        <div className="bg-gray-900/50 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-cyber-400">
            Instructions
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>Use the search and filters to find specific contests</li>
            <li>Click on a contest card to open its chat window</li>
            <li>Monitor multiple chats simultaneously</li>
            <li>Send broadcast messages to selected contests</li>
            <li>
              Your presence in the chat is invisible to regular participants
            </li>
          </ul>
        </div>

        <SuperAdminChatManager />
      </div>
    </div>
  );
};

export default SuperAdminChatExample;
