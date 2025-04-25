// src/components/admin/LogViewer.tsx

import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";

import { ddApi } from "../../services/dd-api";
import { ErrorMessage } from "../common/ErrorMessage";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface LogFile {
  name: string;
  size: number;
  created: string;
  modified: string;
}

interface ParsedLogEntry {
  timestamp: string;
  level: "error" | "warning" | "info" | "debug";
  message: string;
  details?: any;
}

interface DateOption {
  date: string; // YYYY-MM-DD
  hasError: boolean;
  hasApi: boolean;
  errorSize?: number;
  apiSize?: number;
}

interface CompactLogInfo {
  type: string;
  summary: string | JSX.Element;
  icon?: string;
  showInGroup?: boolean;
}

const ENTRIES_PER_PAGE = 100;
const FILE_TYPES = {
  ERROR: "error",
  API: "api",
} as const;

type FileType = (typeof FILE_TYPES)[keyof typeof FILE_TYPES];

const LOG_PATTERNS = {
  USER_QUERY: "User query result:",
  DECODED_TOKEN: "Decoded token:",
  SESSION_TOKEN: "Session token:",
  CORS_REQUEST: "🔍 CORS request details:",
  CHECKING_ORIGIN: "🔎 Checking origin:",
  ALLOWED_ORIGINS: "📋 Allowed origins:",
  IS_ORIGIN_ALLOWED: "✓ Is origin allowed?",
  SETTING_CORS: "📝 Setting CORS headers for allowed origin",
} as const;

export const LogViewer: React.FC = () => {
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FileType>(FILE_TYPES.ERROR);
  const [logContent, setLogContent] = useState<ParsedLogEntry[]>([]);
  const [displayedEntries, setDisplayedEntries] = useState<ParsedLogEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const parseLogEntry = (line: string): ParsedLogEntry => {
    try {
      const parsed = JSON.parse(line);
      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level?.toLowerCase() || "info",
        message: parsed.message || line,
        details: parsed,
      };
    } catch {
      // If not JSON, try to parse plain text log
      const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      const levelMatch = line.match(/\[(ERROR|INFO|WARN|DEBUG)\]/i);

      return {
        timestamp: timestampMatch
          ? timestampMatch[0]
          : new Date().toISOString(),
        level: (levelMatch
          ? levelMatch[1].toLowerCase()
          : "info") as ParsedLogEntry["level"],
        message: line,
      };
    }
  };

  // Process log files into date options
  const processLogFiles = (files: LogFile[]): DateOption[] => {
    const dateMap = new Map<string, DateOption>();

    files.forEach((file) => {
      const match = file.name.match(/^(api|error)-(\d{4}-\d{2}-\d{2})\.log$/);
      if (match) {
        const [, type, date] = match;
        const existing = dateMap.get(date) || {
          date,
          hasError: false,
          hasApi: false,
        };

        if (type === "error") {
          existing.hasError = true;
          existing.errorSize = file.size;
        } else if (type === "api") {
          existing.hasApi = true;
          existing.apiSize = file.size;
        }

        dateMap.set(date, existing);
      }
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  };

  // Load available log files
  useEffect(() => {
    const fetchLogFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ddApi.admin.getLogs();
        const dates = processLogFiles(response);
        setAvailableDates(dates);

        // Select most recent date with error log by default
        const mostRecentWithError = dates.find((d) => d.hasError);
        if (mostRecentWithError) {
          setSelectedDate(mostRecentWithError.date);
          handleLogSelect(mostRecentWithError.date, FILE_TYPES.ERROR);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load log files",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLogFiles();
  }, []);

  // Update displayed entries when filter/level/page changes
  useEffect(() => {
    const filtered = logContent.filter((entry) => {
      const matchesFilter =
        filter === "" ||
        entry.message.toLowerCase().includes(filter.toLowerCase()) ||
        JSON.stringify(entry.details)
          .toLowerCase()
          .includes(filter.toLowerCase());
      const matchesLevel =
        selectedLevel === "all" || entry.level === selectedLevel;
      return matchesFilter && matchesLevel;
    });

    setDisplayedEntries(filtered.slice(0, page * ENTRIES_PER_PAGE));
  }, [logContent, filter, selectedLevel, page]);

  // Load specific log file content
  const handleLogSelect = async (date: string, type: FileType) => {
    const filename = `${type}-${date}.log`;
    try {
      setLoading(true);
      setError(null);
      setSelectedDate(date);
      setSelectedType(type);
      setPage(1);
      const response = await ddApi.admin.getLogContent(filename);

      // Parse and sort log entries
      const entries = response.content
        .split("\n")
        .filter((line: string) => line.trim())
        .map(parseLogEntry)
        .sort(
          (a: ParsedLogEntry, b: ParsedLogEntry) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

      setLogContent(entries);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load log content",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setPage((prev) => prev + 1);
    setLoadingMore(false);
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "debug":
        return "text-gray-400";
      default:
        return "text-blue-500";
    }
  };

  const renderJsonValue = (value: any, depth: number = 0): JSX.Element => {
    if (typeof value === "string") {
      return <span className="text-green-400">"{value}"</span>;
    } else if (typeof value === "number") {
      return <span className="text-yellow-400">{value}</span>;
    } else if (typeof value === "boolean") {
      return <span className="text-purple-400">{value.toString()}</span>;
    } else if (value === null) {
      return <span className="text-gray-400">null</span>;
    } else if (Array.isArray(value)) {
      if (value.length === 0) return <span>[]</span>;
      return (
        <div className="space-y-1">
          <span className="text-gray-500">[</span>
          <div className="border-l-2 border-gray-700 ml-2 pl-3 space-y-1">
            {value.map((item, i) => (
              <div key={i} className="flex">
                {renderJsonValue(item, depth + 1)}
                {i < value.length - 1 && (
                  <span className="text-gray-500">,</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-gray-500">]</span>
        </div>
      );
    } else if (typeof value === "object") {
      const entries = Object.entries(value).filter(
        ([key]) =>
          // Filter out redundant fields that are already shown in the log entry
          !["timestamp", "level", "message"].includes(key),
      );
      if (entries.length === 0) return <span>{"{}"}</span>;
      return (
        <div className="space-y-1">
          <span className="text-gray-500">{"{"}</span>
          <div className="border-l-2 border-gray-700 ml-2 pl-3 space-y-1">
            {entries.map(([key, val], i) => (
              <div key={key} className="flex items-start">
                <span className="text-blue-400 min-w-[8rem] mr-2">"{key}"</span>
                <span className="text-gray-500 mr-2">:</span>
                <div className="flex-1">
                  {renderJsonValue(val, depth + 1)}
                  {i < entries.length - 1 && (
                    <span className="text-gray-500">,</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <span className="text-gray-500">{"}"}</span>
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  const processSpecialLogEntry = (
    entry: ParsedLogEntry,
  ): CompactLogInfo | null => {
    const details = entry.details || {};

    if (entry.message.startsWith(LOG_PATTERNS.USER_QUERY)) {
      const user = details.user || {};
      return {
        type: "User Query",
        summary: (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-semibold">{user.nickname}</span>
            <span className="text-gray-400">|</span>
            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
              {user.role}
            </span>
            <span className="text-gray-400">|</span>
            <span className="font-mono text-xs">{user.wallet_address}</span>
          </div>
        ),
      };
    }

    if (entry.message.startsWith(LOG_PATTERNS.DECODED_TOKEN)) {
      const decoded = details.decoded || {};
      return {
        type: "Token",
        summary: (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
              {decoded.role}
            </span>
            <span className="font-mono text-xs">{decoded.wallet_address}</span>
          </div>
        ),
      };
    }

    if (entry.message.startsWith(LOG_PATTERNS.SESSION_TOKEN)) {
      return {
        type: "Session",
        summary: `Token ${details.token ? "✓ valid" : "❌ invalid"}`,
      };
    }

    if (entry.message.startsWith(LOG_PATTERNS.CORS_REQUEST)) {
      const headers = details.headers || {};
      return {
        type: "CORS Request",
        summary: (
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-gray-400">From:</span>{" "}
              {headers["x-real-ip"]}
            </div>
            <div>
              <span className="text-gray-400">Platform:</span>{" "}
              {headers["sec-ch-ua-platform"]?.replace(/"/g, "")}
            </div>
            <div className="font-mono text-xs truncate">
              <span className="text-gray-400">UA:</span> {headers["user-agent"]}
            </div>
          </div>
        ),
      };
    }

    // Group these CORS-related logs together
    if (
      entry.message.startsWith(LOG_PATTERNS.CHECKING_ORIGIN) ||
      entry.message.startsWith(LOG_PATTERNS.ALLOWED_ORIGINS) ||
      entry.message.startsWith(LOG_PATTERNS.IS_ORIGIN_ALLOWED) ||
      entry.message.startsWith(LOG_PATTERNS.SETTING_CORS)
    ) {
      const origin = entry.message.includes("Checking origin:")
        ? entry.message.split(": ")[1]
        : null;

      return {
        type: "CORS Check",
        summary: origin ? `Checking: ${origin}` : entry.message,
        showInGroup: true,
        icon: "🔒",
      };
    }

    return null;
  };

  if (loading && !selectedDate) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !selectedDate) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Date Selection List */}
        <div className="w-full md:w-1/3 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Dated Logs
          </h2>
          <div className="space-y-2">
            {availableDates.map((dateOption) => (
              <div
                key={dateOption.date}
                className={`w-full p-4 rounded-lg ${
                  selectedDate === dateOption.date
                    ? "bg-brand-600"
                    : "bg-gray-800"
                }`}
              >
                <div className="font-medium text-gray-100 mb-2">
                  {new Date(dateOption.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleLogSelect(dateOption.date, FILE_TYPES.ERROR)
                    }
                    disabled={!dateOption.hasError}
                    className={`flex-1 px-3 py-2 rounded ${
                      selectedDate === dateOption.date &&
                      selectedType === FILE_TYPES.ERROR
                        ? "bg-red-900/80 text-white"
                        : dateOption.hasError
                          ? "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                          : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Errors
                    {dateOption.errorSize && (
                      <span className="text-xs block opacity-75">
                        {formatFileSize(dateOption.errorSize)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleLogSelect(dateOption.date, FILE_TYPES.API)
                    }
                    disabled={!dateOption.hasApi}
                    className={`flex-1 px-3 py-2 rounded ${
                      selectedDate === dateOption.date &&
                      selectedType === FILE_TYPES.API
                        ? "bg-gray-900 text-white"
                        : dateOption.hasApi
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    System
                    {dateOption.apiSize && (
                      <span className="text-xs block opacity-75">
                        {formatFileSize(dateOption.apiSize)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log Content */}
        <div className="w-full md:w-2/3">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-100">
                {selectedDate
                  ? `${
                      selectedType === FILE_TYPES.ERROR ? "Error" : "System"
                    } Log (${new Date(selectedDate).toLocaleDateString()})`
                  : "Select a log file"}
              </h2>
              {selectedDate &&
                displayedEntries.some(
                  (entry) =>
                    entry.details && Object.keys(entry.details).length > 0,
                ) && (
                  <button
                    onClick={() => setShowAllDetails((prev) => !prev)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 text-sm flex items-center gap-1 whitespace-nowrap"
                  >
                    {showAllDetails ? (
                      <>
                        <span>▼</span> Collapse All Details
                      </>
                    ) : (
                      <>
                        <span>▶</span> Expand All Details
                      </>
                    )}
                  </button>
                )}
            </div>
            {selectedDate && (
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 min-w-[150px] flex-1"
                />
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 min-w-[100px]"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            )}
          </div>

          {loading && selectedDate ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : error && selectedDate ? (
            <ErrorMessage message={error} />
          ) : selectedDate ? (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg overflow-x-auto">
                <div className="min-w-full divide-y divide-gray-700">
                  {displayedEntries.map((entry, index) => {
                    const specialLog =
                      entry.level === "info"
                        ? processSpecialLogEntry(entry)
                        : null;
                    const isCompact = specialLog !== null;

                    return (
                      <div
                        key={index}
                        className={`p-3 hover:bg-gray-700/50 transition-colors ${
                          specialLog?.showInGroup
                            ? "opacity-50 hover:opacity-100"
                            : ""
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 whitespace-nowrap">
                              {formatDistanceToNow(new Date(entry.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                            <span
                              className={`${getLevelColor(
                                entry.level,
                              )} uppercase text-xs font-bold px-2 py-1 rounded bg-gray-800/50 whitespace-nowrap`}
                            >
                              {entry.level}
                            </span>
                            {isCompact && (
                              <span className="text-gray-400 text-sm">
                                {specialLog.icon} {specialLog.type}:
                              </span>
                            )}
                          </div>
                          <div className="text-gray-200">
                            {isCompact ? specialLog.summary : entry.message}
                          </div>
                        </div>
                        {!isCompact &&
                          entry.details &&
                          Object.keys(entry.details).length > 0 &&
                          (showAllDetails ? (
                            <div className="mt-3 text-sm font-mono bg-gray-900/50 p-4 rounded overflow-x-auto">
                              {renderJsonValue(entry.details)}
                            </div>
                          ) : (
                            <div className="mt-2">
                              <button
                                onClick={() => setShowAllDetails(true)}
                                className="text-gray-400 hover:text-gray-300 text-sm"
                              >
                                ▶ Show Details
                              </button>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              {displayedEntries.length < logContent.length && (
                <div className="flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    {loadingMore ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      `Load More (${displayedEntries.length} of ${logContent.length})`
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              Select a log file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
