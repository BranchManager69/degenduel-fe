import { API_URL } from "../config/config";
import { useStore } from "../store/useStore";

export interface UserContest {
  contestId: string;
  name: string;
  status: "upcoming" | "active" | "completed";
  startTime: string;
  endTime: string;
  participantCount: number;
}

export interface ContestParticipation {
  contest_id: number;
  wallet_address: string;
  contest: {
    id: number;
    name: string;
    status: string;
    start_time: string;
    end_time: string;
    participant_count: number;
    [key: string]: any; // Allow for additional properties
  };
  [key: string]: any; // Allow for additional properties in the participation data
}

/**
 * Fetches all contests that the current user is participating in using the new dedicated endpoint
 */
export const getUserContests = async (): Promise<UserContest[]> => {
  try {
    // Get the current user from the store
    const { user } = useStore.getState();
    
    if (!user?.wallet_address) {
      return [];
    }
    
    const response = await fetch(
      `${API_URL}/contests/participations/${encodeURIComponent(user.wallet_address)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch user contests: HTTP ${response.status}`;
      
      try {
        // Try to parse as JSON for more detailed error info
        const errorJson = JSON.parse(errorText);
        if (errorJson.message || errorJson.error) {
          errorMessage += ` - ${errorJson.message || errorJson.error}`;
        }
      } catch (e) {
        // If not JSON, include the raw response if available
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.participations || !Array.isArray(data.participations)) {
      console.warn('Invalid response format from server:', data);
      throw new Error(`Invalid response format from server: 'participations' array not found in response`);
    }
    
    // Transform the data to match the expected UserContest format
    const userContests: UserContest[] = data.participations.map((participation: ContestParticipation) => ({
      contestId: participation.contest_id.toString(),
      name: participation.contest.name,
      status: participation.contest.status === 'pending' ? 'upcoming' : participation.contest.status,
      startTime: participation.contest.start_time,
      endTime: participation.contest.end_time,
      participantCount: Number(participation.contest.participant_count) || 0,
    }));
    
    return userContests;
  } catch (error) {
    console.error("Error fetching user contests:", error);
    throw error;
  }
};

/**
 * Gets detailed participation information for a specific user in a specific contest
 */
export const getContestParticipation = async (contestId: string | number, walletAddress: string) => {
  try {
    const response = await fetch(
      `${API_URL}/contests/${contestId}/check-participation?wallet_address=${encodeURIComponent(walletAddress)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch participation data: HTTP ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message || errorJson.error) {
          errorMessage += ` - ${errorJson.message || errorJson.error}`;
        }
      } catch (e) {
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      isParticipating: data.is_participating,
      participantData: data.participant_data
    };
  } catch (error) {
    console.error(`Error fetching participation for contest ${contestId}:`, error);
    throw error;
  }
};
