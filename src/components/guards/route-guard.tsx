'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { usePermissions } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  anyPermission?: string[];
  allPermissions?: string[];
  requiredRole?: string;
  requiredRoles?: string[];
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
  redirectTo?: string;
  fallback?: ReactNode;
}

export function RouteGuard({
  children,
  requiredPermission,
  requiredPermissions,
  anyPermission,
  allPermissions,
  requiredRole,
  requiredRoles,
  module,
  action,
  redirectTo = '/unauthorized',
  fallback,
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    isSuperAdmin,
    role,
  } = usePermissions();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Super admin bypasses all permission checks
    if (isSuperAdmin()) {
      return;
    }

    // Check single permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(redirectTo);
      return;
    }

    // Check multiple permissions (any)
    if (requiredPermissions && !requiredPermissions.some(p => hasPermission(p))) {
      router.push(redirectTo);
      return;
    }

    // Check any of the specified permissions
    if (anyPermission && !hasAnyPermission(anyPermission)) {
      router.push(redirectTo);
      return;
    }

    // Check all of the specified permissions
    if (allPermissions && !hasAllPermissions(allPermissions)) {
      router.push(redirectTo);
      return;
    }

    // Check single role
    if (requiredRole && role !== requiredRole) {
      router.push(redirectTo);
      return;
    }

    // Check multiple roles (any)
    if (requiredRoles && (!role || !requiredRoles.includes(role))) {
      router.push(redirectTo);
      return;
    }

    // Check module + action permission
    if (module && action && !can(action, module)) {
      router.push(redirectTo);
      return;
    }
  }, [
    isAuthenticated,
    requiredPermission,
    requiredPermissions,
    anyPermission,
    allPermissions,
    requiredRole,
    requiredRoles,
    module,
    action,
    redirectTo,
    router,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    isSuperAdmin,
    role,
  ]);

  // Show loading state while checking permissions
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check permissions and render fallback if needed
  if (!isSuperAdmin()) {
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return fallback || null;
    }

    if (requiredPermissions && !requiredPermissions.some(p => hasPermission(p))) {
      return fallback || null;
    }

    if (anyPermission && !hasAnyPermission(anyPermission)) {
      return fallback || null;
    }

    if (allPermissions && !hasAllPermissions(allPermissions)) {
      return fallback || null;
    }

    if (requiredRole && role !== requiredRole) {
      return fallback || null;
    }

    if (requiredRoles && (!role || !requiredRoles.includes(role))) {
      return fallback || null;
    }

    if (module && action && !can(action, module)) {
      return fallback || null;
    }
  }

  return <>{children}</>;
}

// Higher-order component for easier usage
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RouteGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard {...guardProps}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}
