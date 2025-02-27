import React, { useEffect, useState } from "react";

interface DebugEvent {
  type: string;
  socketType: string;
  timestamp: string;
  data?: any;
}

const socketColorMap: Record<string, string> = {
  portfolio: "text-blue-400",
  contest: "text-emerald-400",
  skyduel: "text-purple-400",
  wallet: "text-orange-400",
  market: "text-yellow-400",
  achievements: "text-indigo-400",
  "circuit-breaker": "text-red-400",
  services: "text-pink-400",
  analytics: "text-teal-400",
  default: "text-gray-400"
};

const eventColorMap: Record<string, string> = {
  connection: "text-green-400",
  message: "text-blue-400",
  error: "text-red-400",
  reconnect: "text-yellow-400",
  heartbeat: "text-purple-400",
  close: "text-orange-400",
  default: "text-gray-400"
};

export const WebSocketMonitor: React.FC = () => {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [socketTypeFilter, setSocketTypeFilter] = useState<string>("all");
  const [socketTypes, setSocketTypes] = useState<string[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Record<number, boolean>>({});
  const [isActive, setIsActive] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  // Get unique socket types from events
  useEffect(() => {
    const types = Array.from(new Set(events.map(e => e.socketType))).filter(Boolean);
    setSocketTypes(types);
  }, [events]);

  useEffect(() => {
    const handleDebugEvent = (event: CustomEvent<DebugEvent>) => {
      if (isActive) {
        setEvents((prev) => {
          const newEvents = [...prev.slice(-199), event.detail];
          return newEvents;
        });
      }
    };

    window.addEventListener("ws-debug", handleDebugEvent as EventListener);
    return () =>
      window.removeEventListener("ws-debug", handleDebugEvent as EventListener);
  }, [isActive]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll) {
      const container = document.querySelector('.events-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [events, autoScroll]);

  const toggleEventExpand = (index: number) => {
    setExpandedEvents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const clearEvents = () => {
    setEvents([]);
    setExpandedEvents({});
  };

  const togglePause = () => {
    setIsActive(!isActive);
  };

  const getSocketTypeColor = (socketType: string) => {
    return socketColorMap[socketType] || socketColorMap.default;
  };

  const getEventTypeColor = (eventType: string) => {
    return eventColorMap[eventType] || eventColorMap.default;
  };

  const filteredEvents = events
    .filter(event => filter === "all" || event.type === filter)
    .filter(event => socketTypeFilter === "all" || event.socketType === socketTypeFilter);

  return (
    <div className="websocket-monitor bg-dark-200 rounded-lg p-4 shadow-lg border border-gray-700">
      <div className="monitor-header flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">WebSocket Debug Monitor</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={togglePause}
            className={`px-3 py-1 rounded-md text-sm ${isActive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
          >
            {isActive ? 'Pause' : 'Resume'}
          </button>
          <button 
            onClick={clearEvents}
            className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-md text-sm"
          >
            Clear
          </button>
          <label className="flex items-center text-sm">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={() => setAutoScroll(!autoScroll)}
              className="mr-1"
            />
            Auto-scroll
          </label>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Event Type</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-dark-300 border border-gray-700 rounded-md p-2 text-sm"
          >
            <option value="all">All Events</option>
            <option value="connection">Connections</option>
            <option value="message">Messages</option>
            <option value="error">Errors</option>
            <option value="reconnect">Reconnections</option>
            <option value="heartbeat">Heartbeats</option>
            <option value="close">Closed</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Socket Type</label>
          <select
            value={socketTypeFilter}
            onChange={(e) => setSocketTypeFilter(e.target.value)}
            className="w-full bg-dark-300 border border-gray-700 rounded-md p-2 text-sm"
          >
            <option value="all">All Sockets</option>
            {socketTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="events-status text-sm text-gray-400 mb-2">
        Showing {filteredEvents.length} of {events.length} events
      </div>
      
      <div className="events-container h-96 overflow-y-auto bg-dark-300 rounded-md p-2 border border-gray-700">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No WebSocket events recorded. Connect to WebSockets to see data here.
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <div 
              key={index} 
              className={`event-item mb-2 p-2 rounded-md cursor-pointer ${
                event.type === 'error' ? 'bg-red-900/30 border border-red-800/40' : 
                event.type === 'connection' ? 'bg-green-900/30 border border-green-800/40' :
                'bg-gray-800/40 border border-gray-700/30'
              }`}
              onClick={() => toggleEventExpand(index)}
            >
              <div className="event-header flex justify-between items-center">
                <span className="timestamp text-xs text-gray-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex items-center">
                  <span className={`socket-type text-xs font-mono mr-2 ${getSocketTypeColor(event.socketType)}`}>
                    {event.socketType}
                  </span>
                  <span className={`event-type text-xs font-bold ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                </div>
              </div>
              
              {(expandedEvents[index] && event.data) && (
                <pre className="event-data mt-2 text-xs p-2 bg-black/30 rounded-md overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Click on an event to view detailed payload data.
      </div>
    </div>
  );
};
