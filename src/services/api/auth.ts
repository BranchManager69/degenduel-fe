// src/services/api/auth.ts

/**
 * This file contains the API endpoints for the authentication service.
 * It is used to get the current session data, verify a wallet signature, and verify a Privy auth token.
 */

import axios from "axios";

import { API_URL, DDAPI_DEBUG_MODE } from "../../config/config";
import { useStore } from "../../store/useStore";

// Note: The PRIVY_CLIENT_KEY is used server-side for token verification
// We don't use it directly in the frontend, but we document it here for reference

/**
 * Gets the current session data, including user information if authenticated
 * @returns Object containing user data or error information
 */
export const getSessionData = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/session`, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth] Session response:", {
        status: response.status,
        data: response.data,
      });
    }

    return {
      user: response.data?.user || null,
      session: response.data?.session || null,
    };
  } catch (error: any) {
    // Only log detailed error if it's not a 401 (unauthorized is expected when not logged in)
    if (error?.response?.status !== 401) {
      console.error("[Auth] Session check failed:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
    } else {
      console.log("[Auth] No session available");
    }

    return {
      user: null,
      error:
        error?.response?.data?.message ||
        error?.message ||
        "Session check failed",
    };
  }
};

/**
 * Gets comprehensive authentication status including all methods and Privy link status
 * @returns Comprehensive auth status object
 */
export const getAuthStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/status`, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth] Status response:", {
        status: response.status,
        data: response.data,
      });
    }

    return response.data;
  } catch (error: any) {
    console.error("[Auth] Status check failed:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    // Return a default structure in case of error
    return {
      timestamp: new Date().toISOString(),
      authenticated: false,
      methods: {},
    };
  }
};

/**
 * Gets a WebSocket authentication token
 * @returns The WebSocket token or null if error
 */
export const getWebSocketToken = async (): Promise<string | null> => {
  try {
    if (DDAPI_DEBUG_MODE === "true") {
      console.log(
        "[Auth] Requesting access token for WebSocket authentication",
      );
    }

    // Append timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `${API_URL}/auth/token?_t=${timestamp}`;

    // Try to get the token from the session
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      withCredentials: true,
      timeout: 5000, // 5 second timeout
    });

    if (DDAPI_DEBUG_MODE === "true") {
      console.log(
        `[AUTHDEBUG] \n[useAuth] [getAccessToken] \n[${url}] \n[${JSON.stringify(response.data)}]`,
      );
      console.log(`
        [WS TOKEN  ] ${response.data?.token}
        [WS EXPIRES] ${response.data?.expiresIn}
      `);
    }

    // Return the token or null if no token is available
    return response.data?.token || null;
  } catch (error: any) {
    // Log the error
    console.error("[Auth] Failed to get WSS access token:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    return null;
  }
};

/**
 * Verifies a wallet signature with the server
 * @param wallet The wallet address
 * @param signature The signature as Uint8Array
 * @param message The original message that was signed
 * @returns The user data and authentication result
 */
export const verifyWalletSignature = async (
  wallet: string,
  signature: Uint8Array,
  message: string,
) => {
  try {
    // If debug mode is enabled, log the request
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth Debug] Sending verification request");
    }

    // Convert signature to array for JSON serialization
    const signatureArray = Array.from(signature);

    const response = await axios.post(
      `${API_URL}/auth/verify-wallet`,
      { wallet, signature: signatureArray, message },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Debug": "true",
          Origin: window.location.origin,
        },
        withCredentials: true,
      },
    );

    // If debug mode is enabled, log the response
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth Debug] Verification response:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.config.url,
        cookies: document.cookie,
      });
    }

    // Update the user in the store
    const store = useStore.getState();
    if (response.data?.user) {
      store.setUser({
        ...response.data.user,
        jwt: response.data.token,
      });
    }

    // Add a small delay to ensure cookie is set
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      user: response.data.user,
      token: response.data.token,
    };
  } catch (error: any) {
    // Handle 502 Bad Gateway specifically
    if (error?.response?.status === 502) {
      throw new Error(
        "Server is currently unavailable. Please try again in a few minutes.",
      );
    }

    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to verify wallet";
    throw new Error(errorMessage);
  }
};

/**
 * Verifies a Privy auth token with the server
 * @param token The Privy auth token
 * @param userId The Privy user ID (optional)
 * @param deviceInfo Optional device information for authorization
 * @returns The user data and authentication result
 */
export const verifyPrivyToken = async (
  token: string,
  userId?: string,
  deviceInfo?: {
    device_id?: string;
    device_name?: string;
    device_type?: string;
  }
) => {
  try {
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth Debug] Sending Privy verification request");
    }

    const requestData = {
      token,
      userId,
      ...deviceInfo
    };

    const response = await axios.post(
      `${API_URL}/auth/verify-privy`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Debug": "true",
          Origin: window.location.origin,
        },
        withCredentials: true,
      }
    );

    // If debug mode is enabled, log the response
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth Debug] Privy verification response:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.config.url,
        cookies: document.cookie,
      });
    }

    // Update the user in the store
    const store = useStore.getState();
    if (response.data?.user) {
      store.setUser({
        ...response.data.user,
        jwt: response.data.token,
        privyId: response.data.user.privyId,
      });
    }

    // Add a small delay to ensure cookie is set
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      user: response.data.user,
      token: response.data.token,
      device: response.data.device,
    };
  } catch (error: any) {
    // Handle 502 Bad Gateway specifically
    if (error?.response?.status === 502) {
      throw new Error(
        "Server is currently unavailable. Please try again in a few minutes."
      );
    }

    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to verify Privy login";
    throw new Error(errorMessage);
  }
};

/**
 * Links a Privy account to an existing authenticated wallet
 * @param token The Privy auth token
 * @param userId The Privy user ID
 * @returns The linking result
 */
export const linkPrivyAccount = async (token: string, userId: string) => {
  try {
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth Debug] Sending Privy account linking request");
    }

    const response = await axios.post(
      `${API_URL}/auth/link-privy`,
      { token, userId },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Debug": "true",
          Origin: window.location.origin,
        },
        withCredentials: true,
      }
    );

    // If debug mode is enabled, log the response
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth Debug] Privy account linking response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    }

    // Return the response data
    return response.data;
  } catch (error: any) {
    // Handle 502 Bad Gateway specifically
    if (error?.response?.status === 502) {
      throw new Error(
        "Server is currently unavailable. Please try again in a few minutes."
      );
    }

    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to link Privy account";
      
    console.error("[Auth] Failed to link Privy account:", errorMessage);
    
    throw new Error(errorMessage);
  }
};