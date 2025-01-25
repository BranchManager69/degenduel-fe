import { API_URL } from "../config/config";

interface User {
  wallet_address: string;
  nickname: string;
}

class UserService {
  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.length < 2) return [];

    const response = await fetch(
      `${API_URL}/users?search=${encodeURIComponent(query)}&limit=5`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search users");
    }

    const data = await response.json();
    return data.users;
  }
}

export const userService = new UserService();
