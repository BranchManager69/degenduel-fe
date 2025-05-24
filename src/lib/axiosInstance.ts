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

    // Check if it's a 401 error and not a request to the refresh endpoint itself
    if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) {

      // Prevent multiple refresh attempts concurrently
      if (isRefreshing) {
        // If refresh is already in progress, queue the failed request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      // Mark that we are refreshing
      originalRequest._retry = true; // Mark request as retried to prevent infinite loops
      isRefreshing = true;

      try {
        console.log('[Axios Interceptor] Session expired (401). Attempting token refresh...');
        // Make the refresh request (no body needed, uses r_session cookie)
        await axiosInstance.post('/auth/refresh', {}); // Using the same instance ensures cookies are sent

        console.log('[Axios Interceptor] Token refresh successful. Retrying original request...');
        // Process queue without passing token
        processQueue(null);
        // Retry the original request with the same instance
        return axiosInstance(originalRequest);

      } catch (refreshError: any) {
        console.error('[Axios Interceptor] Token refresh failed.', refreshError?.response?.data || refreshError);
        // Process queue without passing token
        processQueue(refreshError);
        // Trigger logout
        // Using authService directly might cause circular dependency issues.
        // Consider an event emitter or state management action instead.
        authService.logout();
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