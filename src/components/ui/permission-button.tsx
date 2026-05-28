'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  allPermissions?: string[];
  module?: string;
  action?: 'view' | 'create' | 'update' | 'delete' | 'export';
  fallback?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PermissionButton({
  children,
  permission,
  permissions,
  anyPermission,
  allPermissions,
  module,
  action,
  fallback = null,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  ...props
}: PermissionButtonProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    isSuperAdmin,
  } = usePermissions();

  // Super admin bypasses all permission checks
  if (isSuperAdmin()) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    );
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

  // Check module + action permission
  if (module && action && !can(action, module)) {
    return <>{fallback}</>;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}

// Convenience components for common actions
export function CreateButton({
  module,
  children,
  ...props
}: Omit<PermissionButtonProps, 'action'> & { module: string }) {
  return (
    <PermissionButton
      module={module}
      action="create"
      variant="default"
      {...props}
    >
      {children || `Create ${module}`}
    </PermissionButton>
  );
}

export function EditButton({
  module,
  children,
  ...props
}: Omit<PermissionButtonProps, 'action'> & { module: string }) {
  return (
    <PermissionButton
      module={module}
      action="update"
      variant="outline"
      size="sm"
      {...props}
    >
      {children || 'Edit'}
    </PermissionButton>
  );
}

export function DeleteButton({
  module,
  children,
  ...props
}: Omit<PermissionButtonProps, 'action'> & { module: string }) {
  return (
    <PermissionButton
      module={module}
      action="delete"
      variant="destructive"
      size="sm"
      {...props}
    >
      {children || 'Delete'}
    </PermissionButton>
  );
}

export function ViewButton({
  module,
  children,
  ...props
}: Omit<PermissionButtonProps, 'action'> & { module: string }) {
  return (
    <PermissionButton
      module={module}
      action="view"
      variant="outline"
      size="sm"
      {...props}
    >
      {children || 'View'}
    </PermissionButton>
  );
}

export function ExportButton({
  module,
  children,
  ...props
}: Omit<PermissionButtonProps, 'action'> & { module: string }) {
  return (
    <PermissionButton
      module={module}
      action="export"
      variant="secondary"
      size="sm"
      {...props}
    >
      {children || 'Export'}
    </PermissionButton>
  );
}
