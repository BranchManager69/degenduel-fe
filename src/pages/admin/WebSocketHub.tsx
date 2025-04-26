import React, { useState } from "react";
import {
  FaNetworkWired,
  FaToolbox,
  FaDiagnoses,
  FaTachometerAlt,
  FaCode,
  FaHistory,
  FaChartLine,
} from "react-icons/fa";
import { Link } from "react-router-dom";

import { useStore } from "../../store/useStore";
import WebSocketMonitor from "../../components/debug/websocket/WebSocketMonitor";

interface ToolCard {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  access: "admin" | "superadmin";
  isDeprecated?: boolean;
  replacedBy?: string;
}

const WebSocketHub: React.FC = () => {
  const { user } = useStore();
  const [showLiveMonitor, setShowLiveMonitor] = useState(false);

  const tools: ToolCard[] = [
    {
      title: "Live WebSocket Monitor",
      description:
        "Real-time tracking of all WebSocket connections with comprehensive event logging (V69)",
      path: "#", // Used locally on this page
      icon: <FaChartLine className="w-6 h-6" />,
      access: "admin",
    },
    {
      title: "Connection Debugger",
      description:
        "Monitor WebSocket connections, run tests, and view live message traffic",
      path: "/connection-debugger",
      icon: <FaDiagnoses className="w-6 h-6" />,
      access: "admin",
    },
    {
      title: "Service Command Center",
      description:
        "Comprehensive dashboard for monitoring and controlling all WebSocket services",
      path: "/superadmin/service-command-center",
      icon: <FaTachometerAlt className="w-6 h-6" />,
      access: "superadmin",
    },
    {
      title: "WebSocket Playground",
      description: "Developer tool for direct testing of WebSocket endpoints",
      path: "/wss-playground",
      icon: <FaCode className="w-6 h-6" />,
      access: "superadmin",
    },
    {
      title: "Circuit Breaker Panel",
      description: "Monitor and manage service circuit breakers",
      path: "/superadmin/circuit-breaker",
      icon: <FaNetworkWired className="w-6 h-6" />,
      access: "superadmin",
      isDeprecated: true,
      replacedBy: "/superadmin/service-command-center",
    },
    {
      title: "Services Control Panel",
      description: "Service management interface",
      path: "/superadmin/services",
      icon: <FaToolbox className="w-6 h-6" />,
      access: "superadmin",
      isDeprecated: true,
      replacedBy: "/superadmin/service-command-center",
    },
    {
      title: "WebSocket Documentation",
      description: "Comprehensive guide to the WebSocket system architecture",
      path: "/docs/websocket",
      icon: <FaHistory className="w-6 h-6" />,
      access: "admin",
    },
  ];

  // Filter tools based on user access level
  const accessibleTools = tools.filter(
    (tool) =>
      tool.access === "admin" ||
      (tool.access === "superadmin" && user?.is_superadmin),
  );

  if (!user?.is_admin && !user?.is_superadmin) {
    return (
      <div className="p-4">
        <p className="text-red-500">
          Access Denied: Admin privileges required.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            WebSocket Tools Hub
          </h1>
          <p className="text-gray-400 mt-2">
            Central access point for all WebSocket monitoring, debugging, and
            management tools
          </p>
        </div>
        <button 
          onClick={() => setShowLiveMonitor(!showLiveMonitor)}
          className={`px-4 py-2 rounded-lg flex items-center ${showLiveMonitor ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'} transition-colors`}
        >
          <FaChartLine className="mr-2" />
          {showLiveMonitor ? 'Hide Live Monitor' : 'Show Live Monitor'}
        </button>
      </div>
      
      {/* Live WebSocket Monitor */}
      {showLiveMonitor && (
        <div className="mb-8">
          <WebSocketMonitor />
        </div>
      )}

      {/* System Overview Card */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-brand-500/20 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-100">
            WebSocket System Overview
          </h2>
          <FaNetworkWired className="w-8 h-8 text-brand-400" />
        </div>
        <p className="text-gray-400 mb-4">
          DegenDuel uses a hub-and-spoke WebSocket architecture with centralized
          connection management and specialized hooks for specific service
          needs. This hub provides access to all WebSocket tools and
          documentation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-300/30 rounded-lg p-4">
            <h3 className="font-semibold text-brand-400 mb-2">Core Services</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Base WebSocket</li>
              <li>Market WebSocket</li>
              <li>Portfolio WebSocket</li>
              <li>Contest WebSocket</li>
              <li>Wallet WebSocket</li>
            </ul>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <h3 className="font-semibold text-brand-400 mb-2">
              Admin Services
            </h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Circuit Breaker</li>
              <li>SkyDuel Admin</li>
              <li>Analytics WebSocket</li>
              <li>Monitoring</li>
            </ul>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <h3 className="font-semibold text-brand-400 mb-2">Standards</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>JWT Authentication</li>
              <li>Exponential Backoff</li>
              <li>Heartbeat Mechanism</li>
              <li>Connection Pooling</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleTools.map((tool, index) => {
          // Special case for WebSocket Monitor which is used in-page
          if (tool.path === "#") {
            return (
              <div
                key={index}
                onClick={() => setShowLiveMonitor(!showLiveMonitor)}
                className={`
                  block bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border cursor-pointer
                  ${showLiveMonitor ? 'border-green-500' : 'border-gray-700'}
                  hover:border-brand-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/10
                  hover:-translate-y-1 relative group
                `}
              >
                <div className="flex items-center mb-4">
                  <div className="mr-4 text-brand-400">{tool.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-100">
                    {tool.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-brand-500 text-white text-xs py-1 px-2 rounded">
                    {showLiveMonitor ? 'Hide Monitor' : 'Show Monitor'}
                  </div>
                </div>
                {showLiveMonitor && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Active
                  </div>
                )}
              </div>
            );
          }
          
          // Standard tool card
          return (
            <Link
              key={index}
              to={tool.path}
              className={`
                block bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700
                hover:border-brand-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/10
                hover:-translate-y-1 relative group
                ${tool.isDeprecated ? "opacity-70" : ""}
              `}
            >
              {tool.isDeprecated && (
                <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-md text-xs">
                  Deprecated
                </div>
              )}
              <div className="flex items-center mb-4">
                <div className="mr-4 text-brand-400">{tool.icon}</div>
                <h3 className="text-xl font-semibold text-gray-100">
                  {tool.title}
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
              {tool.isDeprecated && tool.replacedBy && (
                <p className="text-yellow-300 text-xs">
                  Please use{" "}
                  <Link to={tool.replacedBy} className="underline">
                    {tools.find((t) => t.path === tool.replacedBy)?.title ||
                      "recommended alternative"}
                  </Link>{" "}
                  instead.
                </p>
              )}
              {tool.access === "superadmin" && (
                <div className="text-xs text-gray-500 mt-2">
                  Requires SuperAdmin access
                </div>
              )}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-brand-500 text-white text-xs py-1 px-2 rounded">
                  Open Tool
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Standardization Notice */}
      <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          V69 WebSocket Implementation Complete
        </h3>
        <p className="text-gray-300 text-sm mb-3">
          All WebSocket hooks have been standardized to use V69 endpoints with consistent connection tracking
          and monitoring. This includes improved connection management, debug logging, and error handling.
          Each WebSocket type is now properly tracked via window.DDActiveWebSockets for monitoring orphaned connections.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-dark-300/30 rounded-lg p-4">
            <h3 className="font-semibold text-green-400 mb-2">Key Features</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✅ Standardized V69 endpoints</li>
              <li>✅ Connection tracking</li>
              <li>✅ Exponential backoff</li>
              <li>✅ Comprehensive logging</li>
              <li>✅ Proper cleanup</li>
            </ul>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <h3 className="font-semibold text-green-400 mb-2">
              Monitoring Tools
            </h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✅ WebSocket Monitor</li>
              <li>✅ ws-debug custom events</li>
              <li>✅ Connection statistics</li>
              <li>✅ Event logging</li>
            </ul>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <h3 className="font-semibold text-green-400 mb-2">Production Ready</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✅ Orphaned connection detection</li>
              <li>✅ Automatic reconnection</li>
              <li>✅ Maintenance mode awareness</li>
              <li>✅ Full error handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketHub;
