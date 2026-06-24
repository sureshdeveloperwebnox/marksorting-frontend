import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<any> | null = null;

export const refreshTokens = () => {
  if (!refreshPromise) {
    refreshPromise = api
      .get('/auth/refresh')
      .then((res) => {
        if (res.data?.user) {
          let expiresAtTimestamp: number | null = null;
          if (res.data.access_token) {
            try {
              const base64Url = res.data.access_token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(window.atob(base64));
              if (payload.exp) {
                expiresAtTimestamp = payload.exp * 1000;
              }
            } catch (e) {
              console.error('Failed to parse rotated token exp:', e);
            }
          }
          useAuthStore.getState().setAuth(res.data.user, expiresAtTimestamp);
        }
        return res;
      })
      .catch((error) => {
        // Clear state & redirect only on actual client/auth failures (400, 401, 403)
        const status = error.response?.status;
        if (status === 400 || status === 401 || status === 403) {
          if (typeof window !== 'undefined') {
            Cookies.remove('access_token_expires');
            Cookies.remove('refresh_token_expires');

            // Asynchronously tell the backend to clear cookies
            axios
              .post(`${api.defaults.baseURL}/auth/logout`, {}, { withCredentials: true })
              .catch(() => {});

            useAuthStore.getState().logout();

            window.location.href = '/login?expired=true';
          }
        }
        return Promise.reject(error);
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
        await refreshTokens();
        // Retry the original request with refreshed cookies
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

