export interface MaintenanceState {
  isActive: boolean;
  message: string;
  estimatedDuration?: number; // minutes
  startTime: string; // ISO string
  endTime?: string; // ISO string
  allowedUsers?: string[]; // Admin users who can still access
  maintenanceType: 'scheduled' | 'emergency' | 'update';
}

export interface MaintenanceEvent {
  type: 'MAINTENANCE_STARTED' | 'MAINTENANCE_ENDED' | 'MAINTENANCE_UPDATED';
  data: MaintenanceState;
  timestamp: string;
}

export interface MaintenanceNotification {
  type: 'maintenance_warning' | 'maintenance_immediate' | 'maintenance_ended';
  message: string;
  countdown?: number; // seconds until maintenance starts
  data: MaintenanceState;
} 