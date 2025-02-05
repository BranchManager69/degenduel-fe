// src/components/debug/DebugPanel.tsx

import React, { useEffect, useRef, useState } from "react";
import { FONT_PRESETS, FontPreset } from "../../constants/fonts";
import type { ColorScheme } from "../../store/useStore";
import { useStore } from "../../store/useStore";

// TODO: Move this to another file
interface SystemStats {
  fps: number;
  memory: {
    used: number;
    total: number;
  };
  apiLatency: number;
  lastApiCall: Date | null;
  activeRequests: number;
}

// TODO: Move this to another file
interface SessionInfo {
  duration: number;
  tokenExpiry: number | null;
  wsStatus: "connected" | "disconnected" | "connecting";
}

// Theme configuration with expanded radical options
const THEMES = {
  "Neon Lights": {
    font: "neonLights",
    scheme: "synthwave",
    description: "Retro-futuristic neon aesthetic with smooth fonts",
  },
  "Neural Net": {
    font: "cyberTech",
    scheme: "matrix",
    description: "Deep learning matrix with pulsing data streams",
  },
  "Cyber Samurai": {
    font: "neonLights",
    scheme: "cyberpunk",
    description: "Neo-Tokyo street tech with glowing katana aesthetics",
  },
  "Digital Void": {
    font: "cyberTech",
    scheme: "default",
    description: "Deep space terminal with cosmic radiation",
  },
  "Quantum Flux": {
    font: "neonLights",
    scheme: "teal",
    description: "Reality-bending quantum interface with probability waves",
  },
  "Chrome Demon": {
    font: "cyberTech",
    scheme: "plasma",
    description: "Demonic AI with chrome and blood aesthetic",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

export const DebugPanel: React.FC = () => {
  const { user, debugConfig, setDebugConfig } = useStore();
  const [sectionsOpen, setSectionsOpen] = useState({
    wallet: false,
    network: false,
    ui: false,
    system: false,
    session: false,
    tools: false,
    theme: false,
    fonts: false,
  });
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState({
    x: 16, // 1rem from left
    y: 64, // 4rem from top to account for ticker
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    fps: 0,
    memory: { used: 0, total: 0 },
    apiLatency: 0,
    lastApiCall: null,
    activeRequests: 0,
  });
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    duration: 0,
    tokenExpiry: null,
    wsStatus: "disconnected",
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const fpsRef = useRef<number[]>([]);
  const frameRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(performance.now());

  // FPS Counter
  useEffect(() => {
    const measureFps = (timestamp: number) => {
      const delta = timestamp - lastFrameRef.current;
      const fps = 1000 / delta;

      fpsRef.current.push(fps);
      if (fpsRef.current.length > 60) fpsRef.current.shift();

      const avgFps = Math.round(
        fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
      );

      setSystemStats((prev) => ({ ...prev, fps: avgFps }));

      lastFrameRef.current = timestamp;
      frameRef.current = requestAnimationFrame(measureFps);
    };

    frameRef.current = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  // Memory Usage
  useEffect(() => {
    const updateMemory = () => {
      if (window.performance && "memory" in performance) {
        const memory = (
          performance as unknown as {
            memory: {
              usedJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          }
        ).memory;
        setSystemStats((prev) => ({
          ...prev,
          memory: {
            used: Math.round(memory.usedJSHeapSize / 1048576), // MB
            total: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
          },
        }));
      }
    };

    const interval = setInterval(updateMemory, 1000);
    return () => clearInterval(interval);
  }, []);

  // API Latency Tracking
  useEffect(() => {
    const checkLatency = async () => {
      const start = performance.now();
      try {
        await fetch("/api/health"); // Assuming you have a health endpoint
        const end = performance.now();
        setSystemStats((prev) => ({
          ...prev,
          apiLatency: Math.round(end - start),
          lastApiCall: new Date(),
          activeRequests: prev.activeRequests,
        }));
      } catch (error) {
        setSystemStats((prev) => ({
          ...prev,
          apiLatency: -1,
          lastApiCall: new Date(),
          activeRequests: prev.activeRequests,
        }));
      }
    };

    const interval = setInterval(checkLatency, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Session Duration
  useEffect(() => {
    if (!user?.last_login) return;
    const loginTime = new Date(user.last_login);
    if (isNaN(loginTime.getTime())) return; // Guard against invalid date

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - loginTime.getTime()) / 1000);
      setSessionInfo((prev) => ({ ...prev, duration }));
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

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

  // Function to apply color scheme
  const applyColorScheme = (scheme: string) => {
    // Remove any existing scheme classes
    document.documentElement.classList.remove(
      "scheme-default",
      "scheme-matrix",
      "scheme-cyberpunk",
      "scheme-synthwave",
      "scheme-gold",
      "scheme-teal",
      "scheme-plasma"
    );

    // Add the new scheme class
    if (scheme !== "default") {
      document.documentElement.classList.add(`scheme-${scheme}`);
    }

    // Save to localStorage
    localStorage.setItem("color-scheme", scheme);

    // Update debug config
    setDebugConfig({ colorScheme: scheme as ColorScheme });
  };

  // Initialize theme (both font and color) from localStorage
  useEffect(() => {
    try {
      // Default to Digital Void theme
      const savedTheme = localStorage.getItem("theme") || "Digital Void";
      if (savedTheme in THEMES) {
        const theme = THEMES[savedTheme as ThemeKey];
        applyFontPreset(theme.font as FontPreset);
        applyColorScheme(theme.scheme);
      } else {
        console.warn(
          `Invalid saved theme: ${savedTheme}, falling back to Digital Void`
        );
        applyFontPreset("cyberTech");
        applyColorScheme("default");
      }
    } catch (error) {
      console.error("Error initializing theme:", error);
      applyFontPreset("cyberTech");
      applyColorScheme("default");
    }
  }, []);

  // Function to apply complete theme
  const applyTheme = (themeKey: ThemeKey) => {
    const theme = THEMES[themeKey];
    applyFontPreset(theme.font as FontPreset);
    applyColorScheme(theme.scheme);
    localStorage.setItem("theme", themeKey);
  };

  // Function to apply font preset
  const applyFontPreset = (presetKey: FontPreset) => {
    const preset = FONT_PRESETS[presetKey];
    if (!preset) {
      console.error(`Invalid font preset: ${presetKey}`);
      return;
    }

    document.documentElement.style.setProperty(
      "--font-heading",
      preset.heading
    );
    document.documentElement.style.setProperty("--font-body", preset.body);
    document.documentElement.style.setProperty("--font-mono", preset.mono);
    localStorage.setItem("font-preset", presetKey);
  };

  // Check if user is superadmin from the store
  if (user?.role !== "superadmin") return null;

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div
      ref={panelRef}
      className="fixed bg-dark-200/95 backdrop-blur-lg border border-dark-300/50 rounded-lg shadow-lg text-gray-300 select-none"
      style={{
        left: position.x,
        top: position.y + 10,
        width: isMinimized ? "auto" : 370,
        zIndex: 9999,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with cool cyberpunk style */}
      <div className="flex items-center justify-between p-2 border-b border-dark-300 bg-gradient-to-r from-dark-300 to-dark-200">
        <h3 className="text-sm font-mono font-semibold text-brand-400 flex items-center">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
          Debug{" "}
        </h3>
        <button
          className="text-brand-400 hover:text-brand-300 transition-colors"
          onClick={() => {
            setIsMinimized(!isMinimized);
            // When opening, expand all sections
            if (isMinimized) {
              setSectionsOpen({
                wallet: false,
                network: false,
                ui: true,
                system: false,
                session: false,
                tools: true,
                theme: true,
                fonts: true,
              });
            }
          }}
        >
          {isMinimized ? ">" : "v"}
        </button>
      </div>

      {/* Panel Content */}
      {!isMinimized && (
        <div className="p-4 space-y-4">
          {/* Theme Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-mono text-brand-400 mb-2"
              onClick={() => toggleSection("theme")}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
                Site Theme
              </span>
              <span>{sectionsOpen.theme ? "−" : "+"}</span>
            </button>
            {sectionsOpen.theme && (
              <div className="space-y-2 ml-2">
                {Object.entries(THEMES).map(([name, theme]) => (
                  <button
                    key={name}
                    onClick={() => applyTheme(name as ThemeKey)}
                    className={`w-full px-3 py-2 text-sm rounded-md transition-all duration-300 ${
                      debugConfig.colorScheme === theme.scheme
                        ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                        : "text-gray-400 hover:bg-brand-500/10 hover:text-brand-300"
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs opacity-75">
                        {theme.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* System Stats Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-mono text-brand-400 mb-2"
              onClick={() => toggleSection("system")}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
                Frontend Metrics
              </span>
              <span>{sectionsOpen.system ? "−" : "+"}</span>
            </button>
            {sectionsOpen.system && (
              <div className="space-y-2 ml-2 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">FPS</span>
                  <span className="text-brand-400">{systemStats.fps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Memory</span>
                  <span className="text-brand-400">
                    {systemStats.memory.used}MB / {systemStats.memory.total}MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">API Latency</span>
                  <span className="text-brand-400">
                    {systemStats.apiLatency}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Requests</span>
                  <span className="text-brand-400">
                    {systemStats.activeRequests}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Session Info Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-mono text-brand-400 mb-2"
              onClick={() => toggleSection("session")}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
                Socket Connection
              </span>
              <span>{sectionsOpen.session ? "−" : "+"}</span>
            </button>
            {sectionsOpen.session && (
              <div className="space-y-2 ml-2 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-brand-400">
                    {formatDuration(sessionInfo.duration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">WebSocket</span>
                  <span
                    className={`text-${
                      sessionInfo.wsStatus === "connected" ? "green" : "red"
                    }-400`}
                  >
                    {sessionInfo.wsStatus}
                  </span>
                </div>
                {sessionInfo.tokenExpiry && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Token Expires</span>
                    <span className="text-brand-400">
                      {new Date(sessionInfo.tokenExpiry).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wallet Debug Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-mono text-brand-400 mb-2"
              onClick={() => toggleSection("wallet")}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
                Phantom Wallet
              </span>
              <span>{sectionsOpen.wallet ? "−" : "+"}</span>
            </button>
            {sectionsOpen.wallet && (
              <div className="space-y-2 ml-2">
                <label className="flex items-center space-x-2 group">
                  <input
                    type="checkbox"
                    checked={debugConfig.forceWalletNotFound}
                    onChange={(e) =>
                      setDebugConfig({ forceWalletNotFound: e.target.checked })
                    }
                    className="form-checkbox text-brand-400 rounded border-dark-300 bg-dark-300"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors">
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
              </div>
            )}
          </div>

          {/* Network Section with updated styling */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-mono text-brand-400 mb-2"
              onClick={() => toggleSection("network")}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
                Networking
              </span>
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

          {/* UI Debug Section with updated styling */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-mono text-brand-400 mb-2"
              onClick={() => toggleSection("ui")}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
                User Interface
              </span>
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

          {/* Tools Section */}
          <div className="mb-3">
            <button
              className="flex items-center justify-between w-full text-sm font-mono text-brand-400 mb-2"
              onClick={() => toggleSection("tools")}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse mr-2"></span>
                Quick Tools
              </span>
              <span>{sectionsOpen.tools ? "−" : "+"}</span>
            </button>
            {sectionsOpen.tools && (
              <div className="space-y-2 ml-2">
                <button
                  onClick={() => localStorage.clear()}
                  className="w-full px-3 py-1 text-sm text-brand-400 border border-brand-400/20 rounded hover:bg-brand-400/10 transition-colors"
                >
                  Clear Local Storage
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-3 py-1 text-sm text-brand-400 border border-brand-400/20 rounded hover:bg-brand-400/10 transition-colors"
                >
                  Force Refresh
                </button>
                <button
                  onClick={() => {
                    const state = {
                      localStorage: { ...localStorage },
                      sessionStorage: { ...sessionStorage },
                      debugConfig,
                      user,
                      systemStats,
                      sessionInfo,
                    };
                    console.log("Debug State Dump:", state);
                    // Also copy to clipboard
                    navigator.clipboard.writeText(
                      JSON.stringify(state, null, 2)
                    );
                  }}
                  className="w-full px-3 py-1 text-sm text-brand-400 border border-brand-400/20 rounded hover:bg-brand-400/10 transition-colors"
                >
                  Dump Debug State
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
