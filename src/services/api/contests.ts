import { createApiClient } from "./utils";

// Interfaces for contest schedules
export interface ContestSchedule {
  id: number;
  name: string;
  days: number[];
  hour: number;
  minute: number;
  duration_hours: number;
  entry_fee: string;
  upcoming_contests: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    entry_fee: string;
    prize_pool: string;
    status: string;
  }[];
  allow_multiple_hours: boolean;
  multiple_hours: number[];
}

export interface ContestScheduleDetail extends ContestSchedule {
  template: {
    id: number;
    name: string;
    description: string;
    entry_fee: string;
    min_participants: number;
    max_participants: number;
  };
}

// Contests API service
export const contests = {
  // Get all contest schedules
  getSchedules: async (): Promise<{ success: boolean; data: ContestSchedule[] }> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/contests/schedules");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contest schedules: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to get contest schedules:", error);
      throw error;
    }
  },
  
  // Get a specific contest schedule
  getScheduleById: async (id: number): Promise<{ success: boolean; data: ContestScheduleDetail }> => {
    try {
      const api = createApiClient();
      const response = await api.fetch(`/contests/schedules/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contest schedule: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to get contest schedule with ID ${id}:`, error);
      throw error;
    }
  }
};