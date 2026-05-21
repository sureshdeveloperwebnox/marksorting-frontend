'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Shield, FileText } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateRole, useUpdateRole, useRole } from '@/services/role-service';
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

const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export function RoleFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedRoleId } = useRoleStore();
  const isEdit = !!selectedRoleId;

  const { data: roleData, isLoading: roleLoading } = useRole(selectedRoleId);
  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: {
      name: '',
      description: '',
    }
  });

  React.useEffect(() => {
    if (isFormDrawerOpen) {
      if (isEdit && roleData) {
        reset({
          name: roleData.name,
          description: roleData.description || '',
        });
      } else if (!isEdit) {
        reset({
          name: '',
          description: '',
        });
      }
    }
  }, [isFormDrawerOpen, roleData, reset, isEdit]);

  const onSubmit: SubmitHandler<RoleFormValues> = async (data) => {
    try {
      if (isEdit) {
        await updateRole({ id: selectedRoleId, ...data });
        toast.success('Role updated successfully');
      } else {
        await createRole(data);
        toast.success('Role created successfully');
      }
      closeFormDrawer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const isLoading = isEdit && roleLoading;
  const isSubmitting = isCreating || isUpdating;

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-white/5">
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
                {isEdit ? 'Update role information.' : 'Create a new role for user permissions.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                {/* Role Name Field */}
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

                {/* Description Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-primary/70" />
                    Description
                  </Label>
                  <Textarea 
                    {...register('description')}
                    placeholder="Describe the role responsibilities (Optional)" 
                    className="min-h-[100px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold resize-none"
                  />
                  {errors.description && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.description.message}</p>}
                </div>
              </div>
            </form>
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
