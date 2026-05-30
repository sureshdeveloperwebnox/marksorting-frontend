'use client';

import { useEffect, ReactNode, useRef } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface AuthProviderProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
const AUTH_RECHECK_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lastCheckedAt = useRef(0);
  const inFlightCheck = useRef<Promise<void> | null>(null);

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

  return <>{children}</>;
}
