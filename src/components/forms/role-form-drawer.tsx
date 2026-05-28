'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Shield, FileText, ChevronDown, ChevronRight, Check } from 'lucide-react';
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

const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
});

type RoleFormValues = z.infer<typeof roleSchema>;

function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    const module = perm.name.split('.')[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}

export function RoleFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedRoleId } = useRoleStore();
  const isEdit = !!selectedRoleId;

  const { data: roleData, isLoading: roleLoading } = useRole(selectedRoleId);
  const { data: allPermissions = [], isLoading: permsLoading } = useAllPermissions();
  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

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
    if (isFormDrawerOpen) {
      if (isEdit && roleData) {
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
        reset({ name: '', description: '' });
        setSelectedPermIds(new Set());
        const groups = groupPermissions(allPermissions);
        const expanded: Record<string, boolean> = {};
        Object.keys(groups).forEach((g) => { expanded[g] = true; });
        setOpenGroups(expanded);
      }
    }
  }, [isFormDrawerOpen, roleData, reset, isEdit, allPermissions]);

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
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-white/5">
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
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} className="text-primary/70" />
                    Role Name
                  </Label>
                  <Input
                    {...register('name')}
                    placeholder="Enter role name (e.g., Manager)"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                  />
                  {errors.name && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.name.message}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-primary/70" />
                    Description
                  </Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Describe the role responsibilities (Optional)"
                    className="min-h-[80px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold resize-none"
                  />
                  {errors.description && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.description.message}</p>}
                </div>
              </form>

              {/* Permissions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Check size={14} className="text-primary/70" />
                    Permissions
                    <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      {selectedPermIds.size} selected
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
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    {selectedPermIds.size === allPermissions.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2">
                  {Object.entries(grouped).map(([module, perms]) => {
                    const allSelected = perms.every((p) => selectedPermIds.has(p.id));
                    const someSelected = perms.some((p) => selectedPermIds.has(p.id));
                    const isOpen = openGroups[module] ?? true;

                    return (
                      <div key={module} className="rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden">
                        {/* Module header */}
                        <button
                          type="button"
                          onClick={() => setOpenGroups((prev) => ({ ...prev, [module]: !prev[module] }))}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/70 dark:bg-white/4 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              onClick={(e) => { e.stopPropagation(); toggleGroup(module, perms); }}
                              className={cn(
                                'w-4 h-4 rounded flex items-center justify-center border-2 transition-colors cursor-pointer',
                                allSelected
                                  ? 'bg-primary border-primary'
                                  : someSelected
                                  ? 'bg-primary/30 border-primary'
                                  : 'border-gray-300 dark:border-white/20'
                              )}
                            >
                              {(allSelected || someSelected) && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-sm font-black capitalize text-gray-800 dark:text-white">
                              {module.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {perms.filter((p) => selectedPermIds.has(p.id)).length}/{perms.length}
                            </span>
                          </div>
                          {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                        </button>

                        {/* Permission rows */}
                        {isOpen && (
                          <div className="divide-y divide-gray-50 dark:divide-white/5">
                            {perms.map((perm) => {
                              const action = perm.name.split('.')[1] ?? perm.name;
                              const checked = selectedPermIds.has(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors"
                                >
                                  <div
                                    onClick={() => togglePerm(perm.id)}
                                    className={cn(
                                      'w-4 h-4 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0',
                                      checked ? 'bg-primary border-primary' : 'border-gray-300 dark:border-white/20'
                                    )}
                                  >
                                    {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-200">
                                      {action}
                                    </span>
                                    {perm.description && (
                                      <p className="text-[11px] text-gray-400 truncate">{perm.description}</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
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
