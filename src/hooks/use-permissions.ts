'use client';

import { useAuthStore } from '@/store/auth-store';

export function usePermissions() {
  const { user, isAuthenticated } = useAuthStore();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user?.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user?.permissions) {
      return false;
    }
    return permissions.some(permission => user.permissions.includes(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user?.permissions) {
      return false;
    }
    return permissions.every(permission => user.permissions.includes(permission));
  };

  /**
   * Check if user can perform a specific action on a module
   */
  const can = (action: 'view' | 'create' | 'update' | 'delete' | 'export', module: string): boolean => {
    return hasPermission(`${module}.${action}`);
  };

  /**
   * Check if user has access to a module (at least view permission)
   */
  const canAccessModule = (module: string): boolean => {
    return hasPermission(`${module}.view`);
  };

  /**
   * Get all permissions for a specific module
   */
  const getModulePermissions = (module: string): string[] => {
    if (!isAuthenticated || !user?.permissions) {
      return [];
    }
    return user.permissions.filter(permission => permission.startsWith(`${module}.`));
  };

  /**
   * Check if user has super admin role
   */
  const isSuperAdmin = (): boolean => {
    return user?.role === 'Super Admin';
  };

  /**
   * Check if user has admin-level access
   */
  const isAdmin = (): boolean => {
    return user?.role === 'Super Admin' || user?.role === 'Admin';
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    canAccessModule,
    getModulePermissions,
    isSuperAdmin,
    isAdmin,
    permissions: user?.permissions || [],
    role: user?.role,
  };
}
