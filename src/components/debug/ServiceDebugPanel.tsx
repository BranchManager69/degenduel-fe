import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { FiMaximize2, FiMinimize2, FiTrash2, FiX } from "react-icons/fi";

interface DebugLog {
  id: string;
  timestamp: string;
  type: "connection" | "state" | "alert" | "error" | "metrics";
  message: string;
  details?: any;
}

const typeColors = {
  connection: "text-blue-500",
  state: "text-green-500",
  alert: "text-yellow-500",
  error: "text-red-500",
  metrics: "text-purple-500",
};

export const ServiceDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  useEffect(() => {
    const handleDebugEvent = (
      event: CustomEvent<{
        type: DebugLog["type"];
        message: string;
        data?: any;
      }>
    ) => {
      const { type, message, data } = event.detail;
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          type,
          message,
          details: data,
        },
        ...prev.slice(0, 99), // Keep last 100 logs
      ]);
    };

    window.addEventListener(
      "serviceWebSocket",
      handleDebugEvent as EventListener
    );
    return () =>
      window.removeEventListener(
        "serviceWebSocket",
        handleDebugEvent as EventListener
      );
  }, []);

  if (!isVisible) {
    return (
      <motion.button
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg hover:bg-gray-700"
        onClick={() => setIsVisible(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Show Debug Panel
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`fixed right-4 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden ${
        isExpanded ? "top-4 bottom-4 w-[600px]" : "bottom-4 w-[400px] h-[300px]"
      }`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <h3 className="font-semibold">Service Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setLogs([])}
            className="p-1 hover:bg-gray-700 rounded"
            title="Clear logs"
          >
            <FiTrash2 />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Close"
          >
            <FiX />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-40px)] p-2">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              className="mb-2 text-sm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-gray-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`font-mono ${typeColors[log.type]}`}>
                  [{log.type}]
                </span>
                <span className="text-gray-300">{log.message}</span>
              </div>
              {log.details && (
                <pre className="mt-1 ml-[120px] text-xs bg-gray-800 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
