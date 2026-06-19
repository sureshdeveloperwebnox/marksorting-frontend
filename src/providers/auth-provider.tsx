'use client';

import { useEffect, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface AuthProviderProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

// How often to re-verify the profile (5 min)
const AUTH_RECHECK_MS = 5 * 60 * 1000;

// Proactively refresh the access token 1 hour before expiry.
// Access token is 1 day (86400s), so refresh after 23 hours.
const TOKEN_REFRESH_INTERVAL_MS = 23 * 60 * 60 * 1000;

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

  // ── Proactive token rotation — runs every 23 h while authenticated ─────────
  // Silently calls /auth/refresh before the 1-day access token expires so the
  // user is never interrupted with a "session expired" message.
  useEffect(() => {
    if (!isAuthenticated) return;

    const doRefresh = () => {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      axios
        .get(`${baseURL}/auth/refresh`, { withCredentials: true })
        .then((res) => {
          // Update profile in Zustand if user data is returned
          if (res.data?.user) {
            setAuth(res.data.user);
          }
        })
        .catch(() => {
          // If background refresh fails, fall through to the next 401 handler
          // which will properly log the user out with an expired-session message.
        });
    };

    const timer = setInterval(doRefresh, TOKEN_REFRESH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isAuthenticated, setAuth]);

  return <>{children}</>;
}
