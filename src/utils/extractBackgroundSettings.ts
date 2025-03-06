// src/utils/extractBackgroundSettings.ts

/**
 * Extracts background scene settings from system settings with failsafe handling
 * @param systemSettings System settings object from API or WebSocket
 * @returns Properly formatted background scene configuration
 */

import { SYSTEM_SETTINGS as DEFAULT_SETTINGS } from "../config/config";

interface SystemSettings {
  background_scene?:
    | string
    | {
        enabled: boolean;
        scenes: Array<{
          name: string;
          enabled: boolean;
          zIndex: number;
          blendMode: string;
        }>;
      };
  [key: string]: any;
}

/**
 * Extracts background scene settings from system settings with failsafe handling
 * @param systemSettings System settings object from API or WebSocket
 * @returns Properly formatted background scene configuration
 */
export function extractBackgroundSettings(
  systemSettings: SystemSettings | null
) {
  // If no settings provided, use defaults
  if (!systemSettings) {
    // No background_scene found in global system settings
    console.log(
      "No background_scene in global system settings! Falling back to local default."
    );
    // Return local default background_scene settings
    return DEFAULT_SETTINGS.BACKGROUND_SCENE;
  }

  try {
    // Try to parse background_scene if it's a string
    let backgroundScene = systemSettings.background_scene;

    // If background_scene is a string, try to parse it as JSON
    if (typeof backgroundScene === "string") {
      try {
        backgroundScene = JSON.parse(backgroundScene);
      } catch (error) {
        console.error("Error parsing background_scene JSON string:", error);
        // Return local default background_scene settings
        return DEFAULT_SETTINGS.BACKGROUND_SCENE;
      }
    }

    // If parsing failed or value is missing, return defaults
    if (!backgroundScene) {
      // No background_scene is found in global system settings
      console.warn("No background scene settings found, using defaults");
      // Return local default background_scene settings
      return DEFAULT_SETTINGS.BACKGROUND_SCENE;
    }

    // Convert from DB format to expected format - safely access properties
    const parsedConfig = backgroundScene as {
      enabled?: boolean;
      scenes?: Array<{
        name: string;
        enabled: boolean;
        zIndex: number;
        blendMode: string;
      }>;
    };

    // Return properly formatted background scene configuration
    return {
      ENABLED: parsedConfig.enabled ?? true,
      SCENES: parsedConfig.scenes ?? DEFAULT_SETTINGS.BACKGROUND_SCENE.SCENES,
    };
  } catch (error) {
    // Error processing background settings
    console.error("Error processing background settings:", error);
    // Failsafe: return defaults
    return DEFAULT_SETTINGS.BACKGROUND_SCENE;
  }
}
