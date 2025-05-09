// src/services/api/auth.ts

/**
 * This file contains the API endpoints for the authentication service.
 * It is used to get the current session data, verify wallet and Privy auth tokens.
 * 
 * WARNING: REFACTOR PENDING (May 2025)
 * This is one of THREE separate authentication services in the codebase.
 * This file specifically handles Twitter auth and Privy contexts.
 * The complete auth system will be consolidated into a single service.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

import axios from "axios";
import { API_URL, DDAPI_DEBUG_MODE } from "../../config/config";
import { useStore } from "../../store/useStore";

/**
 * Gets the current session data, including user information if authenticated
 * @returns Object containing user data or error information
 * 
 * @param {string} API_URL - The URL of the API
 * @param {string} DDAPI_DEBUG_MODE - Whether to enable debug mode
 * @param {useStore} useStore - The store to update with the user data
 * @returns {Promise<{user: User | null, session: Session | null}>} - The user data and session data
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
 * 
 * @param {string} API_URL - The URL of the API
 * @param {string} DDAPI_DEBUG_MODE - Whether to enable debug mode
 * @param {useStore} useStore - The store to update with the user data
 * @returns {Promise<{user: User | null, session: Session | null}>} - The user data and session data
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
 * 
 * @param {string} API_URL - The URL of the API
 * @param {string} DDAPI_DEBUG_MODE - Whether to enable debug mode
 * @param {useStore} useStore - The store to update with the user data
 * @returns {Promise<string | null>} - The WebSocket token or null if error
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
 * @param {string} wallet The wallet address
 * @param {Uint8Array} signature The signature as Uint8Array
 * @param {string} message The original message that was signed
 * @returns {Promise<{user: User | null, session: Session | null}>} - The user data and authentication result
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
 * @param {string} token The Privy auth token
 * @param {string} userId The Privy user ID (optional)
 * @param {object} deviceInfo Optional device information for authorization
 * @returns {Promise<{user: User | null, session: Session | null}>} - The user data and authentication result
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

    // Create an AbortController for timeout control
    const controller = new AbortController();
    // Set a 15-second timeout
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await axios.post(
      `${API_URL}/auth/verify-privy`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Debug": "true",
          Origin: window.location.origin,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        withCredentials: true,
        signal: controller.signal,
        timeout: 15000, // 15-second timeout
      }
    );

    // Clear the timeout
    clearTimeout(timeoutId);

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
    // Handle AbortController timeout
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      throw new Error("Privy verification timed out. Please try again later.");
    }

    // Handle specific HTTP error status codes
    if (error?.response) {
      switch (error.response.status) {
        case 400:
          // Missing required fields
          throw new Error("Missing required information for login. Please try again.");
        
        case 401:
          // Invalid token
          throw new Error("Your login session has expired. Please log in again.");
        
        case 404:
          // No user found
          throw new Error("User account not found. Please create an account first.");
        
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          throw new Error("Server is currently unavailable. Please try again in a few minutes.");
        
        default:
          // Use server-provided error if available
          if (error.response.data?.message) {
            throw new Error(error.response.data.message);
          }
      }
    }

    // Check for specific error patterns
    const errorMsg = error.message || '';
    if (errorMsg.includes('Failed to get user details from Privy')) {
      throw new Error("Unable to retrieve your account information. Please try again later.");
    } else if (errorMsg.includes('No wallet address')) {
      throw new Error("No wallet found in your account. Please connect a wallet first.");
    }

    // Default error message
    const errorMessage = error?.message || "Failed to verify Privy login";
    throw new Error(errorMessage);
  }
};

/**
 * Links a Privy account to an existing authenticated wallet
 * @param {string} token The Privy auth token
 * @param {string} userId The Privy user ID
 * @returns {Promise<any>} - The linking result
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

/**
 * Initiates Twitter authentication flow
 * @returns {Promise<string>} - The URL to redirect to for Twitter auth
 */
export const getTwitterAuthUrl = async (): Promise<string> => {
  // Return directly to the Twitter login endpoint as confirmed by backend
  return `${API_URL}/auth/twitter/login`;
};

/**
 * Links a Twitter account to existing authenticated user
 * @returns {Promise<{success: boolean, message: string}>} - Success status and message
 */
export const linkTwitterAccount = async (): Promise<{success: boolean, message: string}> => {
  try {
    const response = await axios.post(`${API_URL}/auth/twitter/link`, {}, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Debug": "true",
        Origin: window.location.origin,
      },
      withCredentials: true,
    });
    
    return {
      success: true,
      message: response.data.message || "Twitter account linked successfully"
    };
  } catch (error: any) {
    const errorMessage = 
      error?.response?.data?.message ||
      error?.message ||
      "Failed to link Twitter account";
      
    console.error("[Auth] Failed to link Twitter account:", errorMessage);
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Checks if a Twitter account is linked to the current user
 * @returns {Promise<{linked: boolean, username?: string}>} - Status of Twitter linking
 */
export const checkTwitterLinkStatus = async (): Promise<{
  linked: boolean, 
  username?: string
}> => {
  try {
    const status = await getAuthStatus();
    
    return {
      linked: !!status.methods?.twitter?.linked,
      username: status.methods?.twitter?.details?.username
    };
  } catch (error) {
    console.error("[Auth] Failed to check Twitter link status:", error);
    return { linked: false };
  }
};

/**
 * Biometric Authentication API Endpoints
 */

/**
 * Gets options for registering a new biometric credential
 * @param {string} userId User ID to associate with the credential
 * @param {object} options Optional parameters for registration
 * @returns {Promise<any>} - Registration options from the server
 */
export const getBiometricRegistrationOptions = async (
  userId: string,
  options?: {
    nickname?: string;
    authenticatorType?: 'platform' | 'cross-platform';
  }
): Promise<any> => {
  try {
    // Prepare request data
    const requestData = {
      userId,
      nickname: options?.nickname,
      authenticatorType: options?.authenticatorType || 'platform'
    };
    
    const response = await axios.post(
      `${API_URL}/auth/biometric/register-options`, 
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        withCredentials: true,
      }
    );
    
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth] Biometric registration options:", response.data);
    }
    
    return response.data;
  } catch (error: any) {
    console.error("[Auth] Failed to get biometric registration options:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      "Failed to get biometric registration options"
    );
  }
};

/**
 * Verifies a biometric credential registration
 * @param {any} attestation The attestation response from the WebAuthn API
 * @returns {Promise<any>} - Verification result from the server
 */
export const verifyBiometricRegistration = async (attestation: any): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/biometric/register-verify`,
      attestation,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        withCredentials: true,
      }
    );
    
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth] Biometric registration verification:", response.data);
    }
    
    return response.data;
  } catch (error: any) {
    console.error("[Auth] Failed to verify biometric registration:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      "Failed to verify biometric registration"
    );
  }
};

/**
 * Gets options for authenticating with a biometric credential
 * @param {string} userId User ID associated with the credential
 * @returns {Promise<any>} - Authentication options from the server
 */
export const getBiometricAuthenticationOptions = async (userId: string): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/biometric/auth-options`,
      { userId },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        withCredentials: true,
      }
    );
    
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth] Biometric authentication options:", response.data);
    }
    
    return response.data;
  } catch (error: any) {
    console.error("[Auth] Failed to get biometric authentication options:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      "Failed to get biometric authentication options"
    );
  }
};

/**
 * Verifies a biometric authentication assertion
 * @param {any} assertion The assertion response from the WebAuthn API
 * @returns {Promise<any>} - Authentication result from the server
 */
export const verifyBiometricAuthentication = async (assertion: any): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/biometric/auth-verify`,
      assertion,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        withCredentials: true,
      }
    );
    
    if (DDAPI_DEBUG_MODE === "true") {
      console.log("[Auth] Biometric authentication verification:", response.data);
    }
    
    // Update the user in the store
    const store = useStore.getState();
    if (response.data?.user) {
      store.setUser({
        ...response.data.user,
        jwt: response.data.token,
      });
    }
    
    return response.data;
  } catch (error: any) {
    console.error("[Auth] Failed to verify biometric authentication:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      "Failed to verify biometric authentication"
    );
  }
};

/**
 * Checks if a user has registered biometric credentials
 * @param {string} userId User ID to check
 * @returns {Promise<boolean>} - Whether the user has registered credentials
 */
export const checkBiometricCredentialStatus = async (userId: string): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${API_URL}/auth/biometric/credentials?userId=${encodeURIComponent(userId)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        withCredentials: true,
      }
    );
    
    return !!response.data?.hasCredential;
  } catch (error: any) {
    console.error("[Auth] Failed to check biometric credential status:", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    return false;
  }
};

// All exports are handled as named exports above.