'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Mail, Phone, User as UserIcon, Lock, Eye, EyeOff, RefreshCcw, Globe } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateUser, useUpdateUser, useUser, useRoles } from '@/services/user-service';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { useUserStore } from '@/store/useUserStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { ImageUpload } from '@/components/common/image-upload';

const userSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Include at least one special character')
    .optional()
    .or(z.literal('')),
  phone_number: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidPhoneNumber(val),
      { message: 'Please enter a valid phone number with correct country code' }
    ),
  role_id: z.string().min(1, 'Please select a role'),
  account_status: z.string().min(1, 'Status is required'),
  profile_image: z.string().optional().or(z.literal('')),
  background_image: z.string().optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

export function UserFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedUserId } = useUserStore();
  const isEdit = !!selectedUserId;

  const { data: userData, isLoading: userLoading } = useUser(selectedUserId);
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { mutateAsync: createUser, isPending: isCreating } = useCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const [showPassword, setShowPassword] = React.useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone_number: '',
      role_id: '',
      account_status: 'ACTIVE',
      profile_image: '',
      background_image: '',
    }
  });

  React.useEffect(() => {
    if (isFormDrawerOpen) {
      if (isEdit && userData) {
        let phone = userData.phone_number || '';
        if (phone && !phone.startsWith('+')) {
          if (phone.length === 10) {
            phone = `+91${phone}`;
          } else {
            phone = `+${phone}`;
          }
        }

        reset({
          full_name: userData.full_name,
          email: userData.email,
          password: '',
          phone_number: phone,
          role_id: userData.role.id || '',
          account_status: userData.account_status,
          profile_image: userData.profile_image || '',
          background_image: userData.background_image || '',
        });
      } else if (!isEdit) {
        reset({
          full_name: '',
          email: '',
          password: '',
          phone_number: '',
          role_id: '',
          account_status: 'ACTIVE',
          profile_image: '',
          background_image: '',
        });
      }
    }
  }, [isFormDrawerOpen, userData, reset, isEdit]);
  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    try {
      if (isEdit) {
        const { password, ...rest } = data;
        const payload = password ? data : rest;
        const updatedUser = await updateUser({ id: selectedUserId, ...payload });
        
        if (currentUser && currentUser.id === selectedUserId && updatedUser) {
          setAuth({
            ...currentUser,
            full_name: updatedUser.full_name,
            email: updatedUser.email,
            profile_image: updatedUser.profile_image,
            profile_image_url: updatedUser.profile_image_url,
            background_image: updatedUser.background_image,
            background_image_url: updatedUser.background_image_url,
          });
        }
      } else {
        if (!data.password) {
          toast.error('Password is required for new users');
          return;
        }
        await createUser(data);
      }
      closeFormDrawer();
    } catch (error) {
      // Errors and success toasts are handled by mutations in user-service
    }
  };
  const isLoading = isEdit && userLoading;
  const isSubmitting = isCreating || isUpdating;

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent side="right">
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <UserIcon size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? 'Edit User' : 'Add New User'}
              </SheetTitle>
              <SheetDescription>
                {isEdit ? 'Update user information.' : 'Create a new team member account.'}
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
            <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                {/* Images Upload Option */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest">Profile Photo</Label>
                    <ImageUpload
                      value={watch('profile_image')}
                      previewUrl={isEdit ? userData?.profile_image_url : undefined}
                      onChange={(url) => setValue('profile_image', url)}
                      shape="circle"
                      className="w-28 h-28"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest">Cover Photo</Label>
                    <ImageUpload
                      value={watch('background_image')}
                      previewUrl={isEdit ? userData?.background_image_url : undefined}
                      onChange={(url) => setValue('background_image', url)}
                      shape="rectangle"
                      className="w-full aspect-video"
                    />
                  </div>
                </div>

                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <UserIcon size={14} className="text-primary/70" />
                    Full Name
                  </Label>
                  <Input 
                    {...register('full_name')}
                    placeholder="Enter full name" 
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                  />
                  {errors.full_name && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.full_name.message}</p>}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} className="text-primary/70" />
                    Email Address
                  </Label>
                  <Input 
                    {...register('email')}
                    placeholder="name@example.com" 
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                  />
                  {errors.email && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.email.message}</p>}
                </div>

                {/* Password Field */}
                {!isEdit && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Lock size={14} className="text-primary/70" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input 
                        {...register('password')}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors outline-none"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.password.message}</p>}
                  </div>
                )}

                {isEdit && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Lock size={14} className="text-primary/70" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input 
                        {...register('password')}
                        type={showPassword ? "text" : "password"}
                        placeholder="Leave blank to keep current" 
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors outline-none"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.password.message}</p>}
                  </div>
                )}

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Phone size={14} className="text-primary/70" />
                    Phone Number
                  </Label>
                  <Controller
                    name="phone_number"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter phone number (Optional)"
                        className="h-11"
                      />
                    )}
                  />
                  {errors.phone_number && (
                    <p className="text-[11px] text-rose-500 font-bold ml-1">
                      {errors.phone_number.message}
                    </p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Globe size={14} className="text-primary/70" />
                    User Role
                  </Label>
                  <Select 
                    onValueChange={(val) => setValue('role_id', val ?? '', { shouldValidate: true })} 
                    value={watch('role_id') || undefined}
                    items={roles?.map(r => ({ value: r.id, label: r.name }))}
                  >
                    <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                      {watch('role_id') ? (
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {roles?.find((r) => r.id === watch('role_id'))?.name ?? 'Unknown Role'}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">
                          {isLoadingRoles ? 'Loading roles...' : 'Select a role'}
                        </span>
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id} className="font-bold py-3">
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role_id && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.role_id.message}</p>}
                </div>

                {/* Account Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <RefreshCcw size={14} className="text-primary/70" />
                    Account Status
                  </Label>
                  <Select 
                    onValueChange={(val) => setValue('account_status', val ?? 'ACTIVE')} 
                    value={watch('account_status')}
                    items={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'LOCKED', label: 'Locked' }
                    ]}
                  >
                    <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="ACTIVE" className="font-bold py-3 text-emerald-500">Active</SelectItem>
                      <SelectItem value="INACTIVE" className="font-bold py-3 text-amber-500">Inactive</SelectItem>
                      <SelectItem value="LOCKED" className="font-bold py-3 text-rose-500">Locked</SelectItem>
                    </SelectContent>
                  </Select>
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
              form="user-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update User' : 'Save User'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
