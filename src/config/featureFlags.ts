/**
 * Feature Flags
 * 
 * This file contains feature flags that can be used to toggle features on and off.
 * These flags are used during development and feature migration to allow for
 * gradual rollout and testing of new features.
 */

export const featureFlags = {
  /**
   * Use the new unified authentication system
   * When true, components will use the new UnifiedAuthContext
   * When false, components will use the old AuthContext
   */
  useUnifiedAuth: true,

  /**
   * Use the new unified WebSocket system
   * When true, components will use the new UnifiedWebSocketContext
   * When false, components will use the old WebSocketContext
   */
  useUnifiedWebSocket: false,

  /**
   * Enable auth system debug logging
   * When true, additional debug information will be logged to the console
   */
  enableAuthDebugLogging: false
};

/**
 * Get the value of a feature flag
 * This function provides a centralized way to access feature flags,
 * allowing for future extension (like remote config).
 */
export function getFeatureFlag(flagName: keyof typeof featureFlags): boolean {
  // In the future, this could check localStorage, remote config, etc.
  return featureFlags[flagName];
}

/**
 * Set the value of a feature flag
 * This function provides a way to toggle features at runtime.
 */
export function setFeatureFlag(
  flagName: keyof typeof featureFlags, 
  value: boolean
): void {
  featureFlags[flagName] = value;
  
  // Optionally persist to localStorage for development
  if (process.env.NODE_ENV === 'development') {
    try {
      localStorage.setItem(
        'featureFlags', 
        JSON.stringify(featureFlags)
      );
    } catch (e) {
      console.error('Failed to persist feature flags to localStorage', e);
    }
  }
}

/**
 * Initialize feature flags from localStorage (development only)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    const storedFlags = localStorage.getItem('featureFlags');
    if (storedFlags) {
      const parsedFlags = JSON.parse(storedFlags);
      Object.keys(parsedFlags).forEach((flag) => {
        if (flag in featureFlags) {
          featureFlags[flag as keyof typeof featureFlags] = 
            parsedFlags[flag];
        }
      });
    }
  } catch (e) {
    console.error('Failed to load feature flags from localStorage', e);
  }
}