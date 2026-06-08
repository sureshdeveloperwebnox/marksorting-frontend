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
    
    // NEVER try to refresh tokens for logout, login, register, forgot-password, or reset-password
    if (
      originalRequest.url?.includes('/auth/logout') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/forgot-password') ||
      originalRequest.url?.includes('/auth/reset-password')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await getRefreshTokenPromise();
        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          // Asynchronously clear cookies on the backend
          axios.post(`${api.defaults.baseURL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});
          
          // Clear user profile/state in Zustand
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
