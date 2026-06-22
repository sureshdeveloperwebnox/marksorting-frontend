'use client';

import { useEffect, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import Cookies from 'js-cookie';

interface AuthProviderProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

// How often to re-verify the profile (5 min)
const AUTH_RECHECK_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lastCheckedAt = useRef(0);
  const inFlightCheck = useRef<Promise<void> | null>(null);

  // ── Profile verification (runs on navigation / visibility change) ──────────
  useEffect(() => {
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
    if (isPublicPath) {
      useAuthStore.getState().setInitialized(true);
      return;
    }

    const now = Date.now();
    const authIsFresh = isAuthenticated && now - lastCheckedAt.current < AUTH_RECHECK_MS;
    if (authIsFresh || inFlightCheck.current) return;

    inFlightCheck.current = api
      .get('/auth/profile')
      .then((response) => {
        if (response.data) {
          setAuth(response.data);
        }
      })
      .catch(() => {
        useAuthStore.getState().logout();
      })
      .finally(() => {
        lastCheckedAt.current = Date.now();
        inFlightCheck.current = null;
        useAuthStore.getState().setInitialized(true);
      });
  }, [isAuthenticated, pathname, setAuth]);

  // ── Tab visibility: force re-check profile when user returns to tab ────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') return;
      lastCheckedAt.current = 0;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ── Proactive token refresh and auto-logout timer ─────────────────────────
  // Inspects companion cookies dynamically to check when they expire.
  // Logs user out immediately if refresh token is expired or deleted.
  // Proactively refreshes if access token has less than 2 minutes left.
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiryAndRefresh = async () => {
      const now = Date.now();

      // 1. Check refresh token expiration
      const refreshTokenExpires = Cookies.get('refresh_token_expires');
      if (refreshTokenExpires) {
        const refreshExpiryTime = parseInt(refreshTokenExpires, 10);
        if (isNaN(refreshExpiryTime) || now >= refreshExpiryTime) {
          console.warn('[AuthProvider] Refresh token expired. Logging out.');
          handleLogoutRedirect();
          return;
        }
      } else {
        // If authenticated but no refresh token expiry cookie exists, session is invalid
        console.warn('[AuthProvider] Refresh token expiry cookie missing. Logging out.');
        handleLogoutRedirect();
        return;
      }

      // 2. Check access token expiration
      const accessTokenExpires = Cookies.get('access_token_expires');
      if (accessTokenExpires) {
        const accessExpiryTime = parseInt(accessTokenExpires, 10);
        // If the access token is expiring in less than 2 minutes (120 seconds), refresh it
        if (!isNaN(accessExpiryTime) && accessExpiryTime - now < 120 * 1000) {
          console.info('[AuthProvider] Access token expiring soon. Triggering proactive refresh.');
          await triggerTokenRefresh();
        }
      }
    };

    const triggerTokenRefresh = async () => {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      try {
        const res = await axios.get(`${baseURL}/auth/refresh`, { withCredentials: true });
        if (res.data?.user) {
          setAuth(res.data.user);
        }
      } catch (error) {
        console.error('[AuthProvider] Proactive refresh failed:', error);
        // Refresh failed (invalid/revoked refresh token), log out immediately
        handleLogoutRedirect();
      }
    };

    const handleLogoutRedirect = () => {
      // Clear cookies manually to avoid any mismatch
      Cookies.remove('access_token_expires');
      Cookies.remove('refresh_token_expires');
      
      // Asynchronously tell backend to clear cookies
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      axios.post(`${baseURL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});

      // Clear client state
      useAuthStore.getState().logout();

      // Redirect to login page
      window.location.href = '/login?expired=true';
    };

    // Run check immediately on mount/auth state change
    checkTokenExpiryAndRefresh();

    // Check periodically every 10 seconds
    const interval = setInterval(checkTokenExpiryAndRefresh, 10 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setAuth]);

  return <>{children}</>;
}
