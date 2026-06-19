import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<any> | null = null;

const getRefreshTokenPromise = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .get(`${api.defaults.baseURL}/auth/refresh`, {
        withCredentials: true,
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // NEVER try to refresh tokens for these auth endpoints (would cause infinite loops or invalid state)
    const skipRefreshUrls = [
      '/auth/logout',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',       // ← critical: prevents infinite refresh loop
      '/auth/forgot-password',
      '/auth/reset-password',
    ];

    if (skipRefreshUrls.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await getRefreshTokenPromise();
        // Retry the original request with refreshed cookies
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — session is truly expired, log user out
        if (typeof window !== 'undefined') {
          // Asynchronously tell the backend to clear cookies
          axios
            .post(`${api.defaults.baseURL}/auth/logout`, {}, { withCredentials: true })
            .catch(() => {});

          // Clear client-side auth state
          useAuthStore.getState().logout();

          // Redirect to login page with session expired indicator
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

