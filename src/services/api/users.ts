import { API_URL } from "../../config/config";
import { User } from "../../types";
import { logError } from "./utils";

export const users = {
  getAll: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      return data.users;
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  },

  getOne: async (wallet: string): Promise<User> => {
    try {
      const response = await fetch(`${API_URL}/users/${wallet}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `User not found: ${response.statusText}`
        );
      }
      return response.json();
    } catch (error: any) {
      logError("users.getOne", error, { wallet });
      throw error;
    }
  },

  update: async (wallet: string, nickname: string): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${wallet}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    if (!response.ok) throw new Error("Failed to update user");
  },

  updateSettings: async (
    wallet: string,
    settings: Record<string, any>
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/users/${wallet}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update settings: ${response.statusText}`
        );
      }
    } catch (error: any) {
      logError("users.updateSettings", error, { wallet, settings });
      throw error;
    }
  },
};
