'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Shield, FileText, ChevronDown, ChevronRight, Check, LayoutDashboard, Users, Building2, Briefcase, Wrench, FileBarChart, ShoppingCart, Ticket, Settings, Activity, UserCog } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateRole, useUpdateRole, useRole, useAllPermissions, Permission } from '@/services/role-service';
import { useRoleStore } from '@/store/useRoleStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MasterMillsIcon } from '@/components/icons';

const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// Module configuration with display names, icons, and order
const MODULE_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string; order: number }> = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, description: 'View system dashboard', order: 1 },
  users: { label: 'User Management', icon: Users, description: 'Manage system users', order: 2 },
  roles: { label: 'Role Management', icon: UserCog, description: 'Manage roles and permissions', order: 3 },
  customers: { label: 'Customer Management', icon: Building2, description: 'Manage customer records', order: 4 },
  mills: { label: 'Mill Management', icon: Building2, description: 'Manage mill information', order: 5 },
  master_mills: { label: 'Masters', icon: MasterMillsIcon, description: 'Manage master records', order: 5.5 },
  service_categories: { label: 'Service Categories', icon: Briefcase, description: 'Manage service categories', order: 6 },
  service_reports: { label: 'Service Reports', icon: FileBarChart, description: 'Manage service reports', order: 7 },
  installation_reports: { label: 'Installation Reports', icon: Wrench, description: 'Manage installation reports', order: 8 },
  expenses: { label: 'Expense Management', icon: ShoppingCart, description: 'Manage expenses', order: 9 },
  expense_categories: { label: 'Expense Categories', icon: Briefcase, description: 'Manage expense categories', order: 10 },
  stores: { label: 'Store Management', icon: ShoppingCart, description: 'Manage store records', order: 11 },
  materials: { label: 'Materials', icon: Briefcase, description: 'Manage materials inventory', order: 12 },
  technicians: { label: 'Technicians', icon: Users, description: 'Manage technicians', order: 13 },
  tickets: { label: 'Support Tickets', icon: Ticket, description: 'Manage support tickets', order: 14 },
  reports: { label: 'Reports', icon: FileBarChart, description: 'Generate and view reports', order: 15 },
  notifications: { label: 'Notifications', icon: Activity, description: 'Manage notifications', order: 16 },
  settings: { label: 'System Settings', icon: Settings, description: 'Manage system settings', order: 17 },
  activity_logs: { label: 'Activity Logs', icon: Activity, description: 'View system activity logs', order: 18 },
};

// Permission action labels for cleaner display
const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  update: 'Edit',
  delete: 'Delete',
  export: 'Export',
  assign: 'Assign',
  assign_role: 'Assign Role',
  assign_permissions: 'Assign Permissions',
  manage: 'Manage',
  broadcast: 'Broadcast',
  generate: 'Generate',
  company: 'Company Settings',
};

function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  const grouped = permissions.reduce((acc, perm) => {
    const module = perm.name.split('.')[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Sort modules by configured order
  return Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => {
      const orderA = MODULE_CONFIG[a]?.order || 99;
      const orderB = MODULE_CONFIG[b]?.order || 99;
      return orderA - orderB;
    })
  );
}

export function RoleFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedRoleId } = useRoleStore();
  const isEdit = !!selectedRoleId;

  const { data: roleData, isLoading: roleLoading, isFetching: roleFetching } = useRole(selectedRoleId);
  const { data: allPermissions = [], isLoading: permsLoading } = useAllPermissions();
  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

  // Track the last roleId we initialized so we re-init when switching roles
  const initializedForId = React.useRef<string | null>(null);

  const [selectedPermIds, setSelectedPermIds] = React.useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: { name: '', description: '' }
  });

  React.useEffect(() => {
    if (!isFormDrawerOpen) return;

    if (isEdit && roleData) {
      // Only re-initialize when we have fresh data (not while a background
      // refetch is still in flight with potentially stale data) OR when the
      // selected role changes.
      const freshForThisRole = initializedForId.current !== selectedRoleId || !roleFetching;
      if (!freshForThisRole) return;

      initializedForId.current = selectedRoleId;
      reset({ name: roleData.name, description: roleData.description || '' });
      const ids = new Set<string>(
        ((roleData as any).permissions ?? []).map((p: Permission) => p.id)
      );
      setSelectedPermIds(ids);
      const groups = groupPermissions(allPermissions);
      const expanded: Record<string, boolean> = {};
      Object.keys(groups).forEach((g) => { expanded[g] = true; });
      setOpenGroups(expanded);
    } else if (!isEdit) {
      initializedForId.current = null;
      reset({ name: '', description: '' });
      setSelectedPermIds(new Set());
      const groups = groupPermissions(allPermissions);
      const expanded: Record<string, boolean> = {};
      Object.keys(groups).forEach((g) => { expanded[g] = true; });
      setOpenGroups(expanded);
    }
  }, [isFormDrawerOpen, roleData, roleFetching, reset, isEdit, selectedRoleId, allPermissions]);

  const togglePerm = (id: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGroup = (module: string, perms: Permission[]) => {
    const allSelected = perms.every((p) => selectedPermIds.has(p.id));
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (allSelected) perms.forEach((p) => next.delete(p.id));
      else perms.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const onSubmit: SubmitHandler<RoleFormValues> = async (data) => {
    try {
      const payload = { ...data, permission_ids: Array.from(selectedPermIds) };
      if (isEdit) {
        await updateRole({ id: selectedRoleId, ...payload });
        toast.success('Role updated successfully');
      } else {
        await createRole(payload);
        toast.success('Role created successfully');
      }
      closeFormDrawer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const isLoading = (isEdit && roleLoading) || permsLoading;
  const isSubmitting = isCreating || isUpdating;
  const grouped = groupPermissions(allPermissions);

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => {
      if (!open) {
        initializedForId.current = null; // reset so next open always re-initializes
        closeFormDrawer();
      }
    }}>
      <SheetContent side="right">
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Shield size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? 'Edit Role' : 'Add New Role'}
              </SheetTitle>
              <SheetDescription>
                {isEdit ? 'Update role information and permissions.' : 'Create a new role with permissions.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Role Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} className="text-primary/70" />
                    Role Name
                  </Label>
                  <Input
                    {...register('name')}
                    placeholder="Enter role name (e.g., Manager)"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                  />
                  {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.name.message}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-primary/70" />
                    Description
                  </Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Describe the role responsibilities (Optional)"
                    className="min-h-[80px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium resize-none"
                  />
                  {errors.description && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.description.message}</p>}
                </div>
              </form>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Check size={14} className="text-primary/70" />
                    Module Permissions
                    <span className="ml-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      {selectedPermIds.size} / {allPermissions.length}
                    </span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPermIds.size === allPermissions.length) {
                        setSelectedPermIds(new Set());
                      } else {
                        setSelectedPermIds(new Set(allPermissions.map((p) => p.id)));
                      }
                    }}
                    className="text-[11px] font-bold text-primary hover:underline px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                  >
                    {selectedPermIds.size === allPermissions.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Module Cards Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(grouped).map(([module, perms]) => {
                    const allSelected = perms.every((p) => selectedPermIds.has(p.id));
                    const someSelected = perms.some((p) => selectedPermIds.has(p.id));
                    const isOpen = openGroups[module] ?? false;
                    const config = MODULE_CONFIG[module];
                    const ModuleIcon = (config?.icon || Shield) as any;

                    return (
                      <div
                        key={module}
                        className={cn(
                          'rounded-xl border overflow-hidden transition-all duration-200',
                          allSelected
                            ? 'border-primary/30 bg-primary/[0.02] dark:bg-primary/5'
                            : someSelected
                              ? 'border-primary/20 bg-gray-50/50 dark:bg-white/[0.02]'
                              : 'border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900'
                        )}
                      >
                        {/* Module Header Card */}
                        <div className="flex items-center gap-3 p-3">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(module, perms)}
                            className={cn(
                              'w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all duration-150 flex-shrink-0',
                              allSelected
                                ? 'bg-primary border-primary text-white'
                                : someSelected
                                  ? 'bg-primary/20 border-primary/50 text-primary'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                            )}
                          >
                            {allSelected && <Check size={12} strokeWidth={3} />}
                            {someSelected && <Check size={12} strokeWidth={3} className="opacity-60" />}
                          </button>

                          {/* Icon */}
                          <div className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                            allSelected
                              ? 'bg-primary text-white'
                              : someSelected
                                ? 'bg-primary/10 text-primary'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          )}>
                            <ModuleIcon size={18} />
                          </div>

                          {/* Module Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {config?.label || module.replace(/_/g, ' ')}
                              </span>
                              <span className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                                allSelected
                                  ? 'bg-primary/10 text-primary'
                                  : someSelected
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                              )}>
                                {perms.filter((p) => selectedPermIds.has(p.id)).length}/{perms.length}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {config?.description || 'Module permissions'}
                            </p>
                          </div>

                          {/* Expand Button */}
                          <button
                            type="button"
                            onClick={() => setOpenGroups((prev) => ({ ...prev, [module]: !prev[module] }))}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600"
                          >
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>

                        {/* Permission Actions Grid */}
                        {isOpen && (
                          <div className="px-3 pb-3">
                            <div className="ml-11 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {perms.map((perm) => {
                                const actionKey = perm.name.split('.')[1] ?? perm.name;
                                const actionLabel = ACTION_LABELS[actionKey] || actionKey.replace(/_/g, ' ');
                                const checked = selectedPermIds.has(perm.id);

                                return (
                                  <label
                                    key={perm.id}
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150 border',
                                      checked
                                        ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30'
                                        : 'bg-gray-50/50 border-transparent hover:bg-gray-100 dark:bg-white/[0.02] dark:hover:bg-white/5'
                                    )}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => togglePerm(perm.id)}
                                      className={cn(
                                        'w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 flex-shrink-0',
                                        checked
                                          ? 'bg-primary border-primary text-white'
                                          : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                                      )}
                                    >
                                      {checked && <Check size={10} strokeWidth={3} />}
                                    </button>
                                    <span className={cn(
                                      'text-xs font-medium capitalize',
                                      checked
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400'
                                    )}>
                                      {actionLabel}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={closeFormDrawer}
              className="flex-1 rounded-xl h-11 font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="role-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update Role' : 'Save Role'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
