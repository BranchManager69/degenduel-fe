import { createApiClient, logError } from "./utils";
import { API_URL } from "../../config/config";
import { UserLevel } from "../../services/userService";
import { User } from "../../types/index";

export const users = {
  getAll: async (): Promise<User[]> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/users");
      const data = await response.json();
      return data.users;
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  },

  getOne: async (wallet: string): Promise<User> => {
    try {
      const api = createApiClient();
      const response = await api.fetch(`/users/${wallet}`);
      return response.json();
    } catch (error: any) {
      logError("users.getOne", error, { wallet });
      throw error;
    }
  },

  update: async (wallet: string, nickname: string): Promise<void> => {
    try {
      const api = createApiClient();
      await api.fetch(`/users/${wallet}`, {
        method: "PUT",
        body: JSON.stringify({ nickname }),
      });
    } catch (error: any) {
      logError("users.update", error, { wallet, nickname });
      throw error;
    }
  },

  updateSettings: async (
    wallet: string,
    settings: Record<string, any>,
  ): Promise<void> => {
    try {
      const api = createApiClient();
      await api.fetch(`/users/${wallet}/settings`, {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
    } catch (error: any) {
      logError("users.updateSettings", error, { wallet, settings });
      throw error;
    }
  },

  // Add new endpoint for user level data
  getUserLevel: async (wallet: string): Promise<UserLevel> => {
    try {
      const api = createApiClient();
      const response = await api.fetch(`/users/${wallet}/level`);
      return response.json();
    } catch (error: any) {
      logError("users.getUserLevel", error, { wallet });
      // Return fallback data if the endpoint doesn't exist
      return {
        current_level: {
          level_number: 1,
          class_name: "Novice",
          title: "DegenDuel Novice",
          icon_url: "/images/levels/novice.png",
        },
        experience: {
          current: 0,
          next_level_at: 100,
          percentage: 0,
        },
        achievements: {
          bronze: { current: 0, required: 1 },
          silver: { current: 0, required: 0 },
          gold: { current: 0, required: 0 },
          platinum: { current: 0, required: 0 },
          diamond: { current: 0, required: 0 },
        },
      };
    }
  },

  // Add endpoint for retrieving profile image
  getProfileImage: async (wallet: string): Promise<string> => {
    try {
      // First try to check if the API has a profile image endpoint
      const defaultImageUrl = "/images/avatars/default.png";
      const api = createApiClient();
      const response = await api.fetch(`/users/${wallet}/profile-image`, {
        method: "HEAD", // Just check if it exists, don't download the image
      });

      if (response.ok) {
        return `${API_URL}/users/${wallet}/profile-image`;
      }

      return defaultImageUrl;
    } catch (error) {
      console.warn("Profile image fetch failed, using default", error);
      return "/images/avatars/default.png";
    }
  },
};
