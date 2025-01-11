import React, { useEffect, useRef, useState } from "react";
import { isAdminWallet } from "../../lib/auth";
import { useStore } from "../../store/useStore";

export const DebugPanel: React.FC = () => {
  const { user, debugConfig, setDebugConfig } = useStore();
  const [sectionsOpen, setSectionsOpen] = useState({
    wallet: false,
    network: false,
    ui: false,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest("button, input")) {
      return; // Don't start drag if clicking on buttons or inputs
    }
    isDragging.current = true;
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;

    // Ensure panel stays within viewport bounds
    const panel = panelRef.current;
    if (panel) {
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Add layout bounds debug effect
  useEffect(() => {
    if (debugConfig.showLayoutBounds) {
      document.body.classList.add("debug-layout");
    } else {
      document.body.classList.remove("debug-layout");
    }
  }, [debugConfig.showLayoutBounds]);

  // Add slow animations effect
  useEffect(() => {
    if (debugConfig.slowAnimations) {
      document.body.style.setProperty("--debug-animation-speed", "3");
    } else {
      document.body.style.removeProperty("--debug-animation-speed");
    }
  }, [debugConfig.slowAnimations]);

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isAdminWallet(user?.wallet_address)) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bg-dark-200 rounded-lg border border-dark-300 z-50 max-w-sm shadow-lg cursor-move"
      style={{
        bottom: position.y === 0 ? "1rem" : undefined,
        right: position.x === 0 ? "1rem" : undefined,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-dark-300">
        <h3 className="text-sm font-semibold text-gray-100">Debug Panel</h3>
        <button
          className="text-gray-400 hover:text-gray-200"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? "□" : "−"}
        </button>
      </div>

      {/* Panel Content */}
      {!isMinimized && (
        <div className="p-4">
          {/* Wallet Connection Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-medium text-gray-100 mb-2"
              onClick={() => toggleSection("wallet")}
            >
              <span>Wallet Connection</span>
              <span>{sectionsOpen.wallet ? "−" : "+"}</span>
            </button>
            {sectionsOpen.wallet && (
              <div className="space-y-2 ml-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.forceWalletNotFound}
                    onChange={(e) =>
                      setDebugConfig({ forceWalletNotFound: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Force Wallet Not Found
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.forceUserRejection}
                    onChange={(e) =>
                      setDebugConfig({ forceUserRejection: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Force User Rejection
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.forceUnauthorized}
                    onChange={(e) =>
                      setDebugConfig({ forceUnauthorized: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Force Unauthorized
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Network Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-medium text-gray-100 mb-2"
              onClick={() => toggleSection("network")}
            >
              <span>Network</span>
              <span>{sectionsOpen.network ? "−" : "+"}</span>
            </button>
            {sectionsOpen.network && (
              <div className="space-y-2 ml-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.forceAPIError}
                    onChange={(e) =>
                      setDebugConfig({ forceAPIError: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">Force API Error</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.forceOffline}
                    onChange={(e) =>
                      setDebugConfig({ forceOffline: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Force Offline Mode
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.simulateHighLatency}
                    onChange={(e) =>
                      setDebugConfig({ simulateHighLatency: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Simulate High Latency
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* UI Debug Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-medium text-gray-100 mb-2"
              onClick={() => toggleSection("ui")}
            >
              <span>UI Debug</span>
              <span>{sectionsOpen.ui ? "−" : "+"}</span>
            </button>
            {sectionsOpen.ui && (
              <div className="space-y-2 ml-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.showLayoutBounds}
                    onChange={(e) =>
                      setDebugConfig({ showLayoutBounds: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Show Layout Bounds
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.slowAnimations}
                    onChange={(e) =>
                      setDebugConfig({ slowAnimations: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">Slow Animations</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={debugConfig.forceLoadingStates}
                    onChange={(e) =>
                      setDebugConfig({ forceLoadingStates: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-400">
                    Force Loading States
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
