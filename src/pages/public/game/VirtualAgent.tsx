import { CharacterRoom } from "@virtual-protocol/react-virtual-ai";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { Card } from "../../../components/ui/Card";
import { useStore } from "../../../store/useStore";

export const VirtualAgentPage: React.FC = () => {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Get user's nickname or wallet for the agent to address them
  const userName = user?.nickname || "Trader";

  // Custom token fetching function for CharacterRoom
  const initAccessToken = useCallback(
    async (
      virtualId: string | number,
      forceRefetchToken?: boolean,
      metadata?: { [id: string]: any },
    ) => {
      try {
        // Make request to our secure backend endpoint - using absolute URL
        const response = await fetch(
          `${window.location.protocol}//${window.location.host}/api/virtual-agent/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              virtualId,
              userUid: user?.wallet_address || "guest-user",
              userName: userName,
              forceRefetch: forceRefetchToken,
              metadata,
            }),
            credentials: "include",
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData.message || `Token generation failed: ${response.status}`;
          setTokenError(errorMsg);

          // Special handling for backend not available
          if (response.status === 502 || response.status === 404) {
            throw new Error("Virtual API service unavailable");
          }

          throw new Error(errorMsg);
        }

        const data = await response.json();
        return data.token;
      } catch (error) {
        console.error("Failed to get virtual agent token:", error);
        setTokenError(
          error instanceof Error
            ? error.message
            : "Failed to initialize virtual agent",
        );
        return "";
      }
    },
    [user?.wallet_address, userName],
  );

  // Wait for component to mount before rendering CharacterRoom
  // This helps prevent hydration issues
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      // Verify the virtual agent API health on mount - using absolute URL
      fetch(
        `${window.location.protocol}//${window.location.host}/api/virtual-agent/health`,
        {
          credentials: "include",
        },
      )
        .then((response) => {
          if (!response.ok) {
            // Special handling for backend not available
            if (response.status === 502 || response.status === 404) {
              throw new Error("Virtual API service unavailable");
            }
            throw new Error(`Health check failed: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (!data.ok) {
            throw new Error(
              data.message || "Virtual agent service unavailable",
            );
          }
          // Health check passed - backend connection to Virtual API is good
        })
        .catch((error) => {
          console.error("Virtual agent health check failed:", error);
          setTokenError(
            "Virtual agent service is currently unavailable. The backend service may not be running.",
          );
          toast.error("Virtual agent service is currently unavailable", {
            duration: 5000,
            position: "bottom-center",
          });
        });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundEffects />

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">
                Virtual Game Agent
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Interact with our virtual agent to enhance your gaming
                experience. Ask questions, get tips, and explore new strategies.
              </p>
            </div>

            {/* Virtual Agent */}
            <Card className="p-6 bg-dark-200/70 backdrop-blur-sm">
              {tokenError ? (
                <div className="p-6 text-center relative overflow-hidden">
                  {/* Fun animated glitch effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-red-900/20 animate-pulse"></div>
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-500/10 rounded-full blur-xl animate-blob"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-blob animation-delay-2000"></div>

                  {/* Error content */}
                  <div className="relative z-10">
                    <div className="inline-block mb-4 transform hover:scale-105 transition-transform">
                      <span className="text-4xl">🤖</span>
                      <div className="mt-2 text-red-400 font-bold text-lg border-b-2 border-red-400 pb-1 animate-pulse">
                        Agent Malfunction
                      </div>
                    </div>

                    <div className="bg-dark-300/50 backdrop-blur-sm p-4 rounded-lg mb-4 shadow-glow text-left">
                      <div className="text-red-400 mb-2 font-mono text-xs flex items-center">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 animate-ping"></span>
                        ERROR_CODE: VIRTUAL_CONNECTION_FAILED
                      </div>
                      <p className="text-white mb-2">{tokenError}</p>
                      <details className="text-amber-400 text-sm cursor-pointer">
                        <summary className="font-semibold hover:text-amber-300 transition-colors">
                          Technical Details
                        </summary>
                        <div className="pl-4 pt-2 border-l border-amber-700/50 mt-1">
                          <p>
                            The backend server's virtual agent service appears
                            to be offline.
                          </p>
                          <p className="mt-1">Missing endpoints:</p>
                          <ul className="list-disc pl-5 mt-1 text-xs">
                            <li>POST /api/virtual-agent/token</li>
                            <li>GET /api/virtual-agent/health</li>
                          </ul>
                        </div>
                      </details>
                    </div>

                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-medium transition-all hover:shadow-glow transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center mx-auto"
                    >
                      <span className="mr-2">⚡</span>
                      Reboot Agent
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/10 to-purple-900/10 animate-pulse"></div>

                      {/* Animated loading icon */}
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-md animate-ping"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-400 border-t-transparent relative"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl transform -translate-y-1">
                            🤖
                          </span>
                        </div>
                      </div>

                      {/* Loading text */}
                      <div className="mt-6 font-mono text-brand-400 text-sm">
                        <span className="inline-block animate-bounce">B</span>
                        <span className="inline-block animate-bounce animation-delay-100">
                          o
                        </span>
                        <span className="inline-block animate-bounce animation-delay-200">
                          o
                        </span>
                        <span className="inline-block animate-bounce animation-delay-300">
                          t
                        </span>
                        <span className="inline-block animate-bounce animation-delay-400">
                          i
                        </span>
                        <span className="inline-block animate-bounce animation-delay-500">
                          n
                        </span>
                        <span className="inline-block animate-bounce animation-delay-600">
                          g
                        </span>
                        <span className="inline-block animate-bounce animation-delay-700">
                          .
                        </span>
                        <span className="inline-block animate-bounce animation-delay-800">
                          .
                        </span>
                        <span className="inline-block animate-bounce animation-delay-900">
                          .
                        </span>
                      </div>
                    </div>
                  ) : (
                    <CharacterRoom
                      initAccessToken={initAccessToken}
                      userName={userName}
                      virtualId={1}
                      virtualName="Virtual Branch"
                    />
                  )}
                </div>
              )}
              <div className="mt-6 text-xs text-gray-500">
                <p>This virtual agent can help you with:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Understanding how DegenDuel works</li>
                  <li>Learning token trading strategies</li>
                  <li>Getting tips for contest participation</li>
                  <li>Discovering platform features</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
