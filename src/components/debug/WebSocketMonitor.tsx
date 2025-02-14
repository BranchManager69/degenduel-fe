import React, { useEffect, useState } from "react";

interface DebugEvent {
  type: string;
  socketType: string;
  timestamp: string;
  data?: any;
}

export const WebSocketMonitor: React.FC = () => {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const handleDebugEvent = (event: CustomEvent<DebugEvent>) => {
      setEvents((prev) => [...prev.slice(-99), event.detail]);
    };

    window.addEventListener("ws-debug", handleDebugEvent as EventListener);
    return () =>
      window.removeEventListener("ws-debug", handleDebugEvent as EventListener);
  }, []);

  return (
    <div className="websocket-monitor">
      <div className="monitor-header">
        <h2>WebSocket Debug Monitor</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="monitor-filter"
        >
          <option value="all">All Events</option>
          <option value="connection">Connections</option>
          <option value="message">Messages</option>
          <option value="error">Errors</option>
          <option value="reconnect">Reconnections</option>
          <option value="heartbeat">Heartbeats</option>
        </select>
      </div>
      <div className="events-container">
        {events
          .filter((event) => filter === "all" || event.type === filter)
          .map((event, index) => (
            <div key={index} className={`event-item event-${event.type}`}>
              <div className="event-header">
                <span className="timestamp">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="socket-type">{event.socketType}</span>
                <span className="event-type">{event.type}</span>
              </div>
              {event.data && (
                <pre className="event-data">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
