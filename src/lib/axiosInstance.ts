import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config/config';
// Import authService carefully to potentially trigger logout, or use an event bus
// Importing directly might create circular dependencies depending on usage.
// Consider using an event emitter or a simpler callback if logout is needed here.
import { authService } from '../services/AuthService'; // Check path validity

// Create a dedicated Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies automatically
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Often needed for backend session detection
  },
  timeout: 15000, // Set a reasonable timeout (e.g., 15 seconds)
});

// Variable to prevent concurrent refresh attempts
let isRefreshing = false;
// Array to hold requests waiting for token refresh
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; config: InternalAxiosRequestConfig }[] = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      // We don't need to add the token header manually if using cookies
      // The original request config should be sufficient
      axiosInstance(prom.config).then(prom.resolve).catch(prom.reject);
    }
  });
  failedQueue = [];
};

// Response Interceptor for handling 401 errors and retrying requests
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip token refresh for auth-related endpoints
    const authEndpoints = ['/auth/refresh', '/auth/challenge', '/auth/verify-wallet', '/auth/status', '/auth/login', '/auth/logout'];
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));

    // Check if it's a 401 error and not an auth endpoint
    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {

      // Enhanced token detection - check multiple sources
      const hasStoredTokens = (
        document.cookie.includes('token=') ||
        document.cookie.includes('jwt=') ||
        document.cookie.includes('r_session=') ||
        localStorage.getItem('degenduel-storage')?.includes('"jwt"') ||
        // Check if user appears authenticated in auth service
        (typeof window !== 'undefined' && (window as any).authService?.isAuthenticated?.())
      );

      if (!hasStoredTokens) {
        console.log('[Axios Interceptor] No authentication tokens found, skipping refresh');
        return Promise.reject(error);
      }

      // Prevent multiple refresh attempts concurrently
      if (isRefreshing) {
        console.log('[Axios Interceptor] Refresh already in progress, queuing request');
        // If refresh is already in progress, queue the failed request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      // Mark that we are refreshing
      originalRequest._retry = true; // Mark request as retried to prevent infinite loops
      isRefreshing = true;

      try {
        console.group('🔄 [Axios Interceptor] Token Refresh Attempt');
        console.log('Original request failed with 401:', originalRequest.url);
        console.log('Auth tokens detected, attempting refresh...');

        // Try to refresh the token
        console.log('[axios] Attempting token refresh...');
        const refreshResponse = await axiosInstance.post('/auth/refresh', {});

        if (refreshResponse.status === 200) {
          console.log('[axios] Token refresh successful, retrying original request');
          
          // Process all queued requests now that we have a fresh token
          processQueue(null);
          
          // Retry the original request
          return axiosInstance.request(originalRequest);
        } else {
          throw new Error(`Token refresh failed with status: ${refreshResponse.status}`);
        }

      } catch (refreshError: any) {
        console.group('❌ [Axios Interceptor] Token Refresh Failed');
        console.error('Refresh error:', refreshError?.response?.data || refreshError?.message);
        console.log('Triggering logout and rejecting queued requests');
        console.groupEnd();

        // Process queue with error
        processQueue(refreshError);

        // Enhanced logout trigger - use multiple methods
        try {
          // Try to use authService if available
          if (typeof window !== 'undefined' && (window as any).authService?.logout) {
            await (window as any).authService.logout();
          } else if (authService?.logout) {
            await authService.logout();
          } else {
            // Fallback: redirect to login
            console.warn('[Axios Interceptor] AuthService not available, redirecting to login');
            window.location.href = '/login';
          }
        } catch (logoutError) {
          console.error('[Axios Interceptor] Logout failed:', logoutError);
          // Ultimate fallback
          window.location.href = '/login';
        }

        // Reject the original request's promise with the refresh error
        return Promise.reject(refreshError);
      } finally {
        // Reset refreshing flag
        isRefreshing = false;
      }
    }

    // For any other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default axiosInstance; 