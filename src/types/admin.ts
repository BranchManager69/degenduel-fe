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
