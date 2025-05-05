import React from "react";

import { AdminChatManager } from "../../components/admin/AdminChatManager";
import { SuperAdminChatManager } from "../../components/admin/SuperAdminChatManager";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

const AdminChatDashboard: React.FC = () => {
  const { isSuperAdmin } = useMigratedAuth();
  const isSuperAdminUser = isSuperAdmin;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1
            className={`text-3xl font-bold ${
              isSuperAdminUser ? "text-brand-400" : "text-red-400"
            } mb-2`}
          >
            {isSuperAdminUser
              ? "Super Admin Chat Dashboard"
              : "Admin Chat Dashboard"}
          </h1>
          <p className="text-gray-400">
            {isSuperAdminUser
              ? "Monitor and manage all contest chats from a single interface"
              : "Monitor contest chats without being visible to participants"}
          </p>
        </header>

        <div
          className={`bg-gray-900/50 p-4 rounded-lg mb-8 ${
            isSuperAdminUser ? "" : "border border-red-500/20"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              isSuperAdminUser ? "text-cyber-400" : "text-red-400"
            }`}
          >
            Instructions
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>Use the search and filters to find specific contests</li>
            <li>Click on a contest card to open its chat window</li>
            <li>Monitor multiple chats simultaneously</li>
            {isSuperAdminUser && (
              <li>Send broadcast messages to selected contests</li>
            )}
            <li>
              Your presence in the chat is invisible to regular participants
            </li>
            {!isSuperAdminUser && (
              <li>
                Admin messages will appear with a red highlight in the chat
              </li>
            )}
          </ul>
        </div>

        {isSuperAdminUser ? <SuperAdminChatManager /> : <AdminChatManager />}
      </div>
    </div>
  );
};

export default AdminChatDashboard;
