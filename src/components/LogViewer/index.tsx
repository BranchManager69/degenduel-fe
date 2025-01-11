// src/components/LogViewer/index.tsx
import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fs: {
      readFile(
        path: string,
        options?: { encoding?: string }
      ): Promise<string | Uint8Array>;
    };
  }
}

type LogLevel = "error" | "warning" | "info" | "debug";

interface LogEntry {
  id: string;
  timestamp: string;
  content: string;
  level: LogLevel;
}

interface WinstonLogEntry {
  timestamp: string;
  message: string;
  level: string;
  [key: string]: any;
}

const LOG_LEVELS: LogLevel[] = ["error", "warning", "info", "debug"];

const LOG_FILES = [
  "/home/branchmanager/websites/degenduel/logs/api-error-0.log",
  "/home/branchmanager/websites/degenduel/logs/api-out-0.log",
  "/home/branchmanager/websites/degenduel/error.log",
  "/home/branchmanager/websites/degenduel/combined.log",
] as const;

const LogViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>(LOG_FILES[0]);
  const [logContent, setLogContent] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [enabledLevels, setEnabledLevels] = useState<Set<LogLevel>>(
    new Set(LOG_LEVELS)
  );
  const [groupByTime, setGroupByTime] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const detectLogLevel = (line: string): LogLevel => {
    const lowercase = line.toLowerCase();
    if (lowercase.includes("error")) return "error";
    if (lowercase.includes("warn")) return "warning";
    if (lowercase.includes("info")) return "info";
    return "debug";
  };

  const parseLogEntry = (line: string): LogEntry => {
    let timestamp: string;
    let content: string;

    try {
      const parsedLine = JSON.parse(line) as WinstonLogEntry;
      timestamp = new Date(parsedLine.timestamp).toISOString();
      content = parsedLine.message || line;
    } catch (e) {
      const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      timestamp = timestampMatch ? timestampMatch[0] : new Date().toISOString();
      content = line;
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      timestamp,
      content,
      level: detectLogLevel(content),
    };
  };

  const fetchLogs = async (filename: string) => {
    try {
      const response = await window.fs.readFile(filename, { encoding: "utf8" });
      // If response is Uint8Array, convert to string
      const textContent =
        typeof response === "string"
          ? response
          : new TextDecoder().decode(response);

      const lines = textContent
        .split("\n")
        .filter((line) => line.trim())
        .slice(-1000);

      const parsedLines = lines.map(parseLogEntry);
      setLogContent(parsedLines);
    } catch (error) {
      console.error("Error loading logs:", error);
      setLogContent([]);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      fetchLogs(selectedFile);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logContent, autoScroll]);

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const toggleLevel = (level: LogLevel) => {
    setEnabledLevels((prev) => {
      const newLevels = new Set(prev);
      if (newLevels.has(level)) {
        newLevels.delete(level);
      } else {
        newLevels.add(level);
      }
      return newLevels;
    });
  };

  const filteredLogs = logContent.filter(
    (log) =>
      log.content.toLowerCase().includes(filter.toLowerCase()) &&
      enabledLevels.has(log.level)
  );

  const groupedLogs = groupByTime
    ? Object.entries(
        filteredLogs.reduce<Record<string, LogEntry[]>>((groups, log) => {
          const hour = new Date(log.timestamp).toISOString().slice(0, 13);
          if (!groups[hour]) groups[hour] = [];
          groups[hour].push(log);
          return groups;
        }, {})
      )
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Filter logs..."
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-400"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {/* Log Level Filters */}
          <div className="flex items-center space-x-2">
            {LOG_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-3 py-2 rounded-md transition-colors ${
                  enabledLevels.has(level)
                    ? `bg-${
                        level === "error"
                          ? "red"
                          : level === "warning"
                          ? "yellow"
                          : level === "info"
                          ? "blue"
                          : "gray"
                      }-900 text-${
                        level === "error"
                          ? "red"
                          : level === "warning"
                          ? "yellow"
                          : level === "info"
                          ? "blue"
                          : "gray"
                      }-100`
                    : "bg-gray-800 text-gray-400"
                } border border-gray-700`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Group Toggle */}
          <button
            onClick={() => setGroupByTime(!groupByTime)}
            className={`px-3 py-2 rounded-md ${
              groupByTime
                ? "bg-indigo-900 text-indigo-100"
                : "bg-gray-800 text-gray-400"
            } border border-gray-700`}
          >
            Group by Hour
          </button>

          {/* Auto-scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-2 rounded-md ${
              autoScroll
                ? "bg-indigo-900 text-indigo-100"
                : "bg-gray-800 text-gray-400"
            } border border-gray-700`}
          >
            Auto-scroll
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-4">
        <div className="flex">
          {LOG_FILES.map((file) => (
            <button
              key={file}
              onClick={() => setSelectedFile(file)}
              className={`px-4 py-2 ${
                selectedFile === file
                  ? "border-b-2 border-indigo-500 text-indigo-300"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {file.split("/").pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Log Content */}
      <div
        ref={scrollRef}
        className="h-96 overflow-auto bg-gray-800 rounded-md border border-gray-700"
      >
        <div className="p-4 space-y-1">
          {groupByTime && groupedLogs
            ? groupedLogs.map(([hour, logs]) => (
                <div key={hour} className="mb-4">
                  <div className="sticky top-0 bg-gray-900 p-2 rounded-md mb-2 text-gray-300">
                    {new Date(hour).toLocaleString()}
                  </div>
                  {logs.map((log) => (
                    <div key={log.id} className="font-mono text-sm ml-4">
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>{" "}
                      <span className={getLevelColor(log.level)}>
                        [{log.level.toUpperCase()}]
                      </span>{" "}
                      <span className="text-gray-100">{log.content}</span>
                    </div>
                  ))}
                </div>
              ))
            : filteredLogs.map((log) => (
                <div key={log.id} className="font-mono text-sm">
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>{" "}
                  <span className={getLevelColor(log.level)}>
                    [{log.level.toUpperCase()}]
                  </span>{" "}
                  <span className="text-gray-100">{log.content}</span>
                </div>
              ))}
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="mt-4 p-4 bg-gray-800 text-gray-300 rounded-md border border-gray-700">
          No logs found matching your filter criteria
        </div>
      )}
    </div>
  );
};

export default LogViewer;
