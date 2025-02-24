import { API_URL } from "../config/config";

export interface UserContest {
  contestId: string;
  name: string;
  status: "upcoming" | "active" | "completed";
  startTime: string;
  endTime: string;
  participantCount: number;
}

/**
 * Fetches all contests that the current user is participating in
 */
export const getUserContests = async (): Promise<UserContest[]> => {
  try {
    const response = await fetch(
      `${API_URL}/api/v2/contests/user/participating`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user contests: ${response.status}`);
    }

    const data = await response.json();
    return data.contests;
  } catch (error) {
    console.error("Error fetching user contests:", error);
    // For now, return mock data until the endpoint is available
    return getMockUserContests();
  }
};

/**
 * Mock data for development until the real endpoint is available
 */
const getMockUserContests = (): UserContest[] => {
  return [
    {
      contestId: "123",
      name: "Crypto Masters Tournament",
      status: "active",
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      endTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      participantCount: 42,
    },
    {
      contestId: "456",
      name: "Weekend Trading Challenge",
      status: "active",
      startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      endTime: new Date(Date.now() + 172800000).toISOString(), // 48 hours from now
      participantCount: 78,
    },
    {
      contestId: "789",
      name: "Upcoming Altcoin Showdown",
      status: "upcoming",
      startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      endTime: new Date(Date.now() + 259200000).toISOString(), // 72 hours from now
      participantCount: 15,
    },
  ];
};
