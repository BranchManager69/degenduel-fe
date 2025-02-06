import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface Portfolio {
  contestCode: string;
  userNickname: string;
  tokens: {
    symbol: string;
    name: string;
    weight: number;
    value: number;
  }[];
}

interface OrganizedPortfolios {
  [contestId: string]: {
    [userId: string]: Portfolio[];
  };
}

type SubscriptionType = "all_portfolios" | "all_trades" | "contest" | "user";

interface SpyPanelProps {
  superadminToken: string;
}

export const SpyPanel: React.FC<SpyPanelProps> = ({ superadminToken }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [subscriptionType, setSubscriptionType] =
    useState<SubscriptionType>("all_portfolios");
  const [contestId, setContestId] = useState<string>("");
  const [userWallet, setUserWallet] = useState<string>("");
  const [portfolios, setPortfolios] = useState<OrganizedPortfolios>({});
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const socket = new WebSocket(
      `wss://degenduel.me/portfolio?token=${superadminToken}`
    );

    socket.onopen = () => {
      setIsConnected(true);
      toast.success("WebSocket connected");

      // Send initial subscription based on type
      const subscription = {
        type: subscriptionType,
        ...(subscriptionType === "contest" && { contestId }),
        ...(subscriptionType === "user" && { userWallet }),
      };
      socket.send(JSON.stringify(subscription));
    };

    socket.onclose = () => {
      setIsConnected(false);
      toast.error("WebSocket disconnected");
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("WebSocket error occurred");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPortfolios((prevPortfolios) => {
          const newPortfolios = { ...prevPortfolios };

          // Organize the portfolio data
          if (!newPortfolios[data.contestCode]) {
            newPortfolios[data.contestCode] = {};
          }
          if (!newPortfolios[data.contestCode][data.userNickname]) {
            newPortfolios[data.contestCode][data.userNickname] = [];
          }

          // Update or add the portfolio
          const portfolioIndex = newPortfolios[data.contestCode][
            data.userNickname
          ].findIndex((p) => p.contestCode === data.contestCode);

          if (portfolioIndex >= 0) {
            newPortfolios[data.contestCode][data.userNickname][portfolioIndex] =
              data;
          } else {
            newPortfolios[data.contestCode][data.userNickname].push(data);
          }

          return newPortfolios;
        });
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    setWs(socket);
    return () => {
      socket.close();
    };
  }, [superadminToken, subscriptionType, contestId, userWallet]);

  useEffect(() => {
    connect();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  const handleSubscriptionChange = (type: SubscriptionType) => {
    setSubscriptionType(type);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const subscription = {
        type,
        ...(type === "contest" && { contestId }),
        ...(type === "user" && { userWallet }),
      };
      ws.send(JSON.stringify(subscription));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4 text-brand-300">
          Portfolio Spy Panel
        </h2>

        {/* Connection Status */}
        <div className="mb-4 flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-300">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Subscription Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Subscription Type
            </label>
            <select
              value={subscriptionType}
              onChange={(e) =>
                handleSubscriptionChange(e.target.value as SubscriptionType)
              }
              className="w-full bg-dark-300 border border-dark-400 rounded-md px-3 py-2 text-white focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all_portfolios">All Portfolios</option>
              <option value="all_trades">All Trades</option>
              <option value="contest">Specific Contest</option>
              <option value="user">Specific User</option>
            </select>
          </div>

          {subscriptionType === "contest" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Contest ID
              </label>
              <input
                type="text"
                value={contestId}
                onChange={(e) => setContestId(e.target.value)}
                className="w-full bg-dark-300 border border-dark-400 rounded-md px-3 py-2 text-white focus:ring-brand-500 focus:border-brand-500"
                placeholder="Enter contest ID"
              />
            </div>
          )}

          {subscriptionType === "user" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                User Wallet
              </label>
              <input
                type="text"
                value={userWallet}
                onChange={(e) => setUserWallet(e.target.value)}
                className="w-full bg-dark-300 border border-dark-400 rounded-md px-3 py-2 text-white focus:ring-brand-500 focus:border-brand-500"
                placeholder="Enter user wallet address"
              />
            </div>
          )}
        </div>

        {/* Portfolio Display */}
        <div className="space-y-6">
          {Object.entries(portfolios).map(([contestCode, users]) => (
            <div key={contestCode} className="bg-dark-300/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-brand-400 mb-4">
                Contest: {contestCode}
              </h3>
              <div className="space-y-4">
                {Object.entries(users).map(([userNickname, userPortfolios]) => (
                  <div
                    key={userNickname}
                    className="bg-dark-400/30 rounded-lg p-4"
                  >
                    <h4 className="text-md font-medium text-brand-300 mb-3">
                      User: {userNickname}
                    </h4>
                    <div className="space-y-3">
                      {userPortfolios.map((portfolio, index) => (
                        <div
                          key={index}
                          className="bg-dark-500/30 rounded-lg p-3"
                        >
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            {portfolio.tokens.map((token, tokenIndex) => (
                              <div
                                key={tokenIndex}
                                className="flex items-center space-x-2"
                              >
                                <span className="text-gray-400">
                                  {token.symbol}:
                                </span>
                                <span className="text-white">
                                  {(token.weight * 100).toFixed(2)}%
                                </span>
                                <span className="text-brand-300">
                                  ${token.value.toFixed(2)}
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
          ))}
        </div>
      </div>
    </div>
  );
};
