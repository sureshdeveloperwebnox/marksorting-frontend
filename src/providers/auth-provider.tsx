'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePathname } from 'next/navigation';

interface AuthProviderProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
    if (!isPublicPath) {
      checkAuth();
    }
  }, [pathname]);

  return <>{children}</>;
}
