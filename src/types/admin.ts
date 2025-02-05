// src/types/admin.ts

import {
  BaseActivity,
  PlatformStats as BasePlatformStats,
  Contest,
  PaginatedResponse,
} from ".";

export type PlatformStats = BasePlatformStats;
export type Activity = BaseActivity;

export interface ContestsResponse extends PaginatedResponse<Contest> {
  contests: Contest[];
}

export interface ActivitiesResponse extends PaginatedResponse<Activity> {
  activities: Activity[];
}

export interface AdminActivity {
  id: number;
  action: string;
  admin_address?: string;
  details?: Record<string, any>;
  created_at: string;
  ip_address?: string;
}

export interface AdminActivitiesResponse {
  activities: AdminActivity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface AdminActivityFilters {
  limit?: number;
  offset?: number;
  action?: string;
}
