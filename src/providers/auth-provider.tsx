'use client';

import { useEffect, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import api, { refreshTokens } from '@/lib/api';
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
  const expiresAt = useAuthStore((state) => state.expiresAt);
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
          setAuth(response.data, response.data.expires_at);
        }
      })
      .catch((error) => {
        console.error('[AuthProvider] Profile check failed:', error);
        // Only log out if it is an explicit 401 Unauthorized
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
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
  // Inspects in-memory expiresAt timestamp dynamically to check when access token expires.
  // Logs user out immediately if session has expired or refresh fails.
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiryAndRefresh = async () => {
      const now = Date.now();

      if (expiresAt) {
        // If the access token has already expired (or expires in the next 10 seconds), refresh immediately
        if (now >= expiresAt) {
          console.warn('[AuthProvider] Access token expired. Triggering refresh.');
          await triggerTokenRefresh();
          return;
        }

        // If the access token is expiring in less than 2 minutes (120 seconds), refresh it
        if (expiresAt - now < 120 * 1000) {
          console.info('[AuthProvider] Access token expiring soon. Triggering proactive refresh.');
          await triggerTokenRefresh();
        }
      }
    };

    const triggerTokenRefresh = async () => {
      try {
        await refreshTokens();
      } catch (error: any) {
        console.error('[AuthProvider] Proactive refresh failed:', error);
        const status = error.response?.status;
        // Only redirect to login if it's a definitive authentication error (400, 401, 403)
        if (status === 400 || status === 401 || status === 403) {
          handleLogoutRedirect();
        }
      }
    };

    const handleLogoutRedirect = () => {
      // Clear client state first
      useAuthStore.getState().logout();

      // Asynchronously tell backend to clear cookies
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      axios.post(`${baseURL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});

      // Redirect to login page
      window.location.href = '/login?expired=true';
    };

    // Run check immediately on mount/auth state change
    checkTokenExpiryAndRefresh();

    // Check periodically every 10 seconds
    const interval = setInterval(checkTokenExpiryAndRefresh, 10 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, expiresAt, setAuth]);

  return <>{children}</>;
}
