/**
 * SkyDuel Type Definitions
 * 
 * These types define the structure used by the SkyDuel components
 * to properly type-check the existing implementation.
 */

/**
 * Severity levels for alerts
 */
export type AlertSeverity = "critical" | "error" | "warning" | "info";

/**
 * Alert interface for service alerts
 */
export interface SkyDuelAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

/**
 * Node status types
 */
export type NodeStatus = "online" | "offline" | "degraded" | "warning" | "error" | "restarting";

/**
 * Node type definitions
 */
export type NodeType = 
  | "service" 
  | "api" 
  | "database" 
  | "cache" 
  | "queue" 
  | "worker" 
  | "gateway"
  | "infrastructure"
  | "websocket";

/**
 * Interface for node metrics
 */
export interface NodeMetrics {
  uptime: number;              // Uptime in seconds
  latency: number;             // Latency in milliseconds
  requests: number;            // Total requests
  successRate: number;         // Success rate percentage
  cpu: number;                 // CPU usage percentage
  memory: number;              // Memory usage percentage
  errorRate: number;           // Error rate percentage
  connections: number;         // Number of active connections
  requestsPerMinute: number;   // Requests per minute
}

/**
 * Connection type definitions
 */
export type ConnectionType = "http" | "rpc" | "database" | "stream" | "event" | "socket";

/**
 * Connection status types
 */
export type ConnectionStatus = "active" | "inactive" | "degraded" | "error";

/**
 * Connection between nodes
 */
export interface NodeConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  status: ConnectionStatus;
  metrics?: {
    latency: number;
    throughput: number;
    errorRate: number;
    lastEvent: string;
  };
}

/**
 * Service node interface
 */
export interface ServiceNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  description?: string;
  version?: string;
  metrics: NodeMetrics;
  alerts: SkyDuelAlert[];
  lastUpdated: string;
  // Additional properties used in the UI
  health: number;           // Health percentage
  uptime: number;           // Uptime in seconds
  lastRestart: string | null; // Last restart timestamp
}

/**
 * SkyDuel system state interface
 */
export interface SkyDuelState {
  nodes: ServiceNode[];
  connections: NodeConnection[];
  systemStatus: {
    overall: "operational" | "degraded" | "critical";
    services: {
      online: number;
      offline: number;
      degraded: number;
    };
  };
  lastUpdated: string;
  selectedNode?: string; // ID of selected node 
  layout?: "graph" | "grid" | "list" | "circuit";
}

/**
 * SkyDuel store slice interface
 * Used for type assertions when accessing skyDuel-specific parts of the store
 */
export interface SkyDuelStoreState {
  skyDuel: SkyDuelState;
  setSkyDuelSelectedNode: (nodeId: string | undefined) => void;
}

/**
 * Enhanced alert with node information
 */
export interface EnhancedAlert extends SkyDuelAlert {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
}