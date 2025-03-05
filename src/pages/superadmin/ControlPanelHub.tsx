import { motion } from "framer-motion";
import React from "react";
import {
  FaBolt,
  FaBrain,
  FaNetworkWired,
  FaServer,
  FaToggleOn,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export const ControlPanelHub: React.FC = () => {
  const panels = [
    {
      title: "Service Switchboard",
      description: "Modern service control interface with real-time monitoring",
      icon: <FaServer className="w-12 h-12" />,
      to: "/superadmin/switchboard",
      color:
        "from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "WebSocket Monitor",
      description: "Unified monitoring interface for all WebSocket services",
      icon: <FaNetworkWired className="w-12 h-12" />,
      to: "/superadmin/websocket-monitor",
      color:
        "from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30",
      borderColor: "border-cyan-500/30",
    },
    {
      title: "AI Testing Panel",
      description: "Test and debug AI responses with different models",
      icon: <FaBrain className="w-12 h-12" />,
      to: "/superadmin/ai-testing",
      color:
        "from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30",
      borderColor: "border-indigo-500/30",
    },
    {
      title: "Circuit Breaker Panel",
      description: "Advanced system reliability and performance monitoring",
      icon: <FaBolt className="w-12 h-12" />,
      to: "/superadmin/circuit-breaker",
      color:
        "from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30",
      borderColor: "border-purple-500/30",
    },
    {
      title: "Legacy Service Control",
      description: "[DEPRECATED] Basic service management interface",
      icon: <FaToggleOn className="w-12 h-12" />,
      to: "/superadmin/services",
      color:
        "from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30",
      borderColor: "border-red-500/30",
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Control Panel Hub</h1>
        <p className="text-gray-400 mt-2">
          Centralized access to all system control panels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {panels.map((panel) => (
          <Link key={panel.title} to={panel.to}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`h-full bg-gradient-to-br ${panel.color} backdrop-blur-sm rounded-lg p-6 border ${panel.borderColor} transition-all duration-300`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-brand-400">{panel.icon}</div>
                <h2 className="text-xl font-bold text-gray-100">
                  {panel.title}
                </h2>
                <p className="text-gray-400 text-sm">{panel.description}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Quick Stats Overview */}
      <div className="mt-8 bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-brand-400/20">
        <h2 className="text-xl font-bold text-gray-100 mb-4">
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Active Services</div>
            <div className="text-2xl font-bold text-gray-100">Loading...</div>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">System Health</div>
            <div className="text-2xl font-bold text-gray-100">Loading...</div>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Recent Incidents</div>
            <div className="text-2xl font-bold text-gray-100">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  );
};
