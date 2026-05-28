'use client';

import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionWrapperProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  allPermissions?: string[];
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
}

export function PermissionWrapper({
  children,
  permission,
  permissions,
  anyPermission,
  allPermissions,
  role,
  roles,
  fallback = null,
  module,
  action,
}: PermissionWrapperProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    isSuperAdmin,
    isAdmin,
  } = usePermissions();

  // Super admin bypasses all permission checks
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions (any)
  if (permissions && !permissions.some(p => hasPermission(p))) {
    return <>{fallback}</>;
  }

  // Check any of the specified permissions
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <>{fallback}</>;
  }

  // Check all of the specified permissions
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>;
  }

  // Check single role
  if (role) {
    const userRole = usePermissions().role;
    if (userRole !== role) {
      return <>{fallback}</>;
    }
  }

  // Check multiple roles (any)
  if (roles) {
    const userRole = usePermissions().role;
    if (!roles.includes(userRole || '')) {
      return <>{fallback}</>;
    }
  }

  // Check module + action permission
  if (module && action && !can(action, module)) {
    return <>{fallback}</>;
  }

  // Check admin-level access
  if (role === 'Admin' && !isAdmin()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
  fallback?: React.ReactNode;
}

export function PermissionButton({
  children,
  permission,
  permissions,
  anyPermission,
  module,
  action,
  fallback,
  ...props
}: PermissionButtonProps) {
  return (
    <PermissionWrapper
      permission={permission}
      permissions={permissions}
      anyPermission={anyPermission}
      module={module}
      action={action}
      fallback={fallback}
    >
      <button {...props}>{children}</button>
    </PermissionWrapper>
  );
}

interface PermissionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
  fallback?: React.ReactNode;
  href: string;
}

export function PermissionLink({
  children,
  permission,
  permissions,
  anyPermission,
  module,
  action,
  fallback,
  href,
  ...props
}: PermissionLinkProps) {
  return (
    <PermissionWrapper
      permission={permission}
      permissions={permissions}
      anyPermission={anyPermission}
      module={module}
      action={action}
      fallback={fallback}
    >
      <a href={href} {...props}>{children}</a>
    </PermissionWrapper>
  );
}
