import {
  CharacterRoom,
} from "@virtual-protocol/react-virtual-ai";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { API_URL } from "../../../config/config";
import { useStore } from "../../../store/useStore";
import { Card } from "../../../components/ui/Card";

export const VirtualAgentPage: React.FC = () => {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  // Get user's nickname or wallet for the agent to address them
  const userName = user?.nickname || 'Trader';
  
  // Custom token fetching function for CharacterRoom
  const initAccessToken = useCallback(async (virtualId: number) => {
    try {
      // Make request to our secure backend endpoint
      const response = await fetch(`${API_URL}/virtual-agent/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          virtualId,
          userUid: user?.wallet_address || 'guest-user',
          userName: userName
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Token generation failed: ${response.status}`;
        setTokenError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Failed to get virtual agent token:', error);
      setTokenError(error instanceof Error ? error.message : 'Failed to initialize virtual agent');
      return '';
    }
  }, [user?.wallet_address, userName]);
  
  // Wait for component to mount before rendering CharacterRoom
  // This helps prevent hydration issues
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Verify the virtual agent API health on mount
      fetch(`${API_URL}/virtual-agent/health`, {
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data.ok) {
          throw new Error(data.message || 'Virtual agent service unavailable');
        }
        // Health check passed - backend connection to Virtual API is good
      })
      .catch(error => {
        console.error('Virtual agent health check failed:', error);
        toast.error('Virtual agent service is currently unavailable', {
          duration: 5000,
          position: 'bottom-center',
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
              <h1 className="text-4xl font-bold text-white">Virtual Game Agent</h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Interact with our virtual agent to enhance your gaming experience.
                Ask questions, get tips, and explore new strategies.
              </p>
            </div>

            {/* Virtual Agent */}
            <Card className="p-6 bg-dark-200/70 backdrop-blur-sm">
              {tokenError ? (
                <div className="p-6 text-center">
                  <div className="text-red-400 mb-4">
                    {tokenError}
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400"></div>
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