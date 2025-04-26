import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useStore } from "../../store/useStore";

type SubscriptionType = "portfolio" | "trade" | "contest" | "user";

interface Portfolio {
  contestId: string;
  userWallet: string;
  tokens: {
    symbol: string;
    weight: number;
    value: number;
  }[];
}

interface OrganizedPortfolios {
  [contestId: string]: {
    [userWallet: string]: Portfolio;
  };
}

export const SpyPanel: React.FC = () => {
  const { user } = useStore();
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [subscriptionType, setSubscriptionType] =
    useState<SubscriptionType>("portfolio");
  const [contestId, setContestId] = useState<string>("");
  const [userWallet, setUserWallet] = useState<string>("");
  const [organizedPortfolios, setOrganizedPortfolios] =
    useState<OrganizedPortfolios>({});

  useEffect(() => {
    const connectWebSocket = () => {
      if (!user?.wallet_address) {
        toast.error("Please connect your wallet first");
        return;
      }

      setStatus("connecting");

      // Get JWT token from cookies
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("dd-session="),
      );
      const token = tokenCookie ? tokenCookie.split("=")[1].trim() : null;

      if (!token) {
        toast.error("No authentication token found. Please log in again.");
        return;
      }

      const wsUrl = `wss://degenduel.me/portfolio?token=${token}`;
      const newWs = new WebSocket(wsUrl);

      newWs.onopen = () => {
        setStatus("connected");
        toast.success("WebSocket connected");
      };

      newWs.onclose = () => {
        setStatus("disconnected");
        toast.error("WebSocket disconnected");
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      newWs.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("WebSocket error occurred");
      };

      newWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "portfolio") {
            setOrganizedPortfolios((prev) => {
              const newPortfolios = { ...prev };
              if (!newPortfolios[data.contestId]) {
                newPortfolios[data.contestId] = {};
              }
              newPortfolios[data.contestId][data.userWallet] = data;
              return newPortfolios;
            });
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      setWs(newWs);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user?.wallet_address]);

  const subscribe = () => {
    if (!ws || status !== "connected") {
      toast.error("WebSocket not connected");
      return;
    }

    const subscription = {
      type: subscriptionType,
      ...(contestId && { contestId }),
      ...(userWallet && { userWallet }),
    };

    ws.send(JSON.stringify(subscription));
    toast.success(`Subscribed to ${subscriptionType} updates`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status === "connected"
                ? "bg-green-500"
                : status === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-300 capitalize">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subscription Type
          </label>
          <select
            value={subscriptionType}
            onChange={(e) =>
              setSubscriptionType(e.target.value as SubscriptionType)
            }
            className="w-full bg-dark-300 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="portfolio">Portfolio</option>
            <option value="trade">Trade</option>
            <option value="contest">Contest</option>
            <option value="user">User</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contest ID (optional)
          </label>
          <input
            type="text"
            value={contestId}
            onChange={(e) => setContestId(e.target.value)}
            placeholder="Enter contest ID"
            className="w-full bg-dark-300 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User Wallet (optional)
          </label>
          <input
            type="text"
            value={userWallet}
            onChange={(e) => setUserWallet(e.target.value)}
            placeholder="Enter user wallet"
            className="w-full bg-dark-300 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={subscribe}
            disabled={status !== "connected"}
            className="w-full bg-brand-500 text-white rounded-md px-4 py-2 font-medium hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Subscribe
          </button>
        </div>
      </div>

      {/* Display organized portfolios */}
      <div className="space-y-6">
        {Object.entries(organizedPortfolios).map(([contestId, users]) => (
          <div key={contestId} className="bg-dark-300/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-100 mb-4">
              Contest: {contestId}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(users).map(([userWallet, portfolio]) => (
                <div key={userWallet} className="bg-dark-300/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    User: {userWallet}
                  </h4>
                  <div className="space-y-2">
                    {portfolio.tokens.map((token, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm text-gray-400"
                      >
                        <span>{token.symbol}</span>
                        <span>
                          {token.weight.toFixed(2)}% (${token.value.toFixed(2)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
