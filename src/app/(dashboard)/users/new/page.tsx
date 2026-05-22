'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Camera, ArrowLeft, Globe, User as UserIcon, Save, Trash2, RefreshCcw, Loader2, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { PageShell } from '@/components/layouts/PageShell';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateUser, useUpdateUser, useRoles, useUser } from '@/services/user-service';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { cn, normalizePhoneNumber } from '@/lib/utils';
import { ImageUpload } from '@/components/common/image-upload';
import { useAuthStore } from '@/store/auth-store';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { useS3Upload } from '@/hooks/use-s3-upload';

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

function UserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const isEdit = !!userId;

  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { data: userData, isLoading: userLoading } = useUser(userId);
  const { mutateAsync: createUser, isPending: isCreating } = useCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const [showPassword, setShowPassword] = React.useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { uploadFile, isUploading: isUploadingBg, uploadProgress: bgUploadProgress } = useS3Upload();
  const bgInputRef = React.useRef<HTMLInputElement>(null);
  const [bgPreview, setBgPreview] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState
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

  const { errors } = formState;

  // Debug: Log form errors to console if button is not working
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form Errors:', errors);
    }
  }, [errors]);

  React.useEffect(() => {
    if (userData) {
      reset({
        full_name: userData.full_name,
        email: userData.email,
        phone_number: normalizePhoneNumber(userData.phone_number),
        role_id: userData.role.id || '',
        account_status: userData.account_status,
        profile_image: userData.profile_image || '',
        background_image: userData.background_image || '',
      });
      if (userData.background_image_url) {
        setBgPreview(userData.background_image_url);
      }
    }
  }, [userData, reset]);

  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    try {
      if (isEdit) {
        const updatedUser = await updateUser({ id: userId, ...data });
        
        // Sync auth store immediately if updating own profile
        if (currentUser && currentUser.id === userId) {
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
        
        toast.success('User updated successfully');
      } else {
        if (!data.password) {
          toast.error('Password is required for new users');
          return;
        }
        await createUser(data);
        toast.success('User created successfully');
      }
      router.push('/users');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  if (isEdit && userLoading) {
    return (
      <PageShell className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </PageShell>
    );
  }

  return (
    <PageShell 
      className="max-w-[1200px] mx-auto overflow-hidden w-full"
      contentClassName="p-0 bg-transparent border-none shadow-none space-y-0"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5 min-h-full"
        >
          {/* Hidden File Input for Background Image */}
          <input 
            type="file" 
            ref={bgInputRef}
            className="hidden" 
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Show local preview immediately
                const reader = new FileReader();
                reader.onloadend = () => {
                  setBgPreview(reader.result as string);
                };
                reader.readAsDataURL(file);

                const res = await uploadFile(file);
                if (res) {
                  setValue('background_image', res.key);
                  setBgPreview(res.fileUrl);
                }
              }
            }}
          />

          {/* Hero Gradient Section */}
          <div 
            className="h-48 md:h-64 bg-gradient-to-br from-[#E0E7FF] via-[#F5F3FF] to-[#FFF7ED] relative group cursor-pointer overflow-hidden"
            onClick={() => !isUploadingBg && bgInputRef.current?.click()}
          >
            {/* Background Image if uploaded */}
            {bgPreview ? (
              <img 
                src={bgPreview} 
                alt="Background Cover" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}

            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none z-10">
              {isUploadingBg ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <span className="text-white font-semibold text-sm">Uploading {bgUploadProgress}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white bg-black/50 backdrop-blur-md px-4 py-2 rounded-full font-semibold">
                  <Camera size={18} />
                  <span>{watch('background_image') ? 'Change Cover' : 'Upload Cover'}</span>
                </div>
              )}
            </div>

            <Link href="/users">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-6 left-6 bg-white/50 backdrop-blur-md hover:bg-white/80 rounded-full h-10 w-10 p-0 z-20"
              >
                <ArrowLeft size={18} />
              </Button>
            </Link>
          </div>

          {/* Profile Header Overlay */}
          <div className="px-8 md:px-12 pb-12 -mt-16 md:-mt-20 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                <ImageUpload
                  value={watch('profile_image')}
                  previewUrl={userData?.profile_image_url}
                  onChange={(url) => setValue('profile_image', url)}
                  className="w-32 h-32 md:w-40 md:h-40"
                />
                <div className="text-center md:text-left space-y-1 pb-2">
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {isEdit ? 'Edit User' : 'New User'} <span className="text-primary leading-none">.</span>
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">
                    {isEdit ? 'Update existing user credentials' : 'Create a new team member account'}
                  </p>
                </div>
              </div>
              <div className="flex justify-center md:justify-end pb-2">
                <Button 
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white rounded-xl h-12 px-8 font-black transition-all hover:scale-105 active:scale-95 gap-2 shadow-sm hover:shadow-lg hover:shadow-primary/20"
                >
                  {isCreating || isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                  {isEdit ? 'Update Changes' : 'Save User'}
                </Button>
              </div>
            </div>

            {/* Form Content */}
            <div className="mt-16 space-y-0 divide-y divide-gray-100 dark:divide-white/5 border-t border-gray-100 dark:border-white/5">
              
              {/* Name Field */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Label className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-3">
                  <UserIcon size={16} className="text-primary/70" />
                  Full Name
                </Label>
                <div className="md:col-span-2 space-y-1">
                  <Input 
                    {...register('full_name')}
                    placeholder="Enter full name" 
                    className="h-12 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                  />
                  {errors.full_name && <p className="text-xs text-rose-500 font-bold ml-1">{errors.full_name.message}</p>}
                </div>
              </div>

              {/* Email Field */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Label className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-3">
                  <Mail size={16} className="text-primary/70" />
                  Email Address
                </Label>
                <div className="md:col-span-2 space-y-1">
                  <Input 
                    {...register('email')}
                    placeholder="name@example.com" 
                    className="h-12 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                  />
                  {errors.email && <p className="text-xs text-rose-500 font-bold ml-1">{errors.email.message}</p>}
                </div>
              </div>

              {/* Password Field */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Label className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-3">
                  <Lock size={16} className="text-primary/70" />
                  Password
                </Label>
                <div className="md:col-span-2 space-y-1 relative">
                  <div className="relative flex items-center">
                    <Input 
                      {...register('password')}
                      type={showPassword ? "text" : "password"}
                      placeholder={isEdit ? "Leave blank to keep current" : "••••••••"} 
                      className={cn(
                        "h-12 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold transition-all pr-12",
                        errors.password && "ring-2 ring-rose-500/20"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-gray-400 hover:text-primary transition-colors outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-rose-500 font-bold ml-1 flex items-center gap-1"
                    >
                      <div className="w-1 h-1 rounded-full bg-rose-500" />
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Label className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-3">
                  <Globe size={16} className="text-primary/70" />
                  User Role
                </Label>
                <div className="md:col-span-2 space-y-1">
                  <Select 
                    onValueChange={(val) => setValue('role_id', val ?? '', { shouldValidate: true })} 
                    value={watch('role_id') || undefined}
                    items={roles?.map(r => ({ value: r.id, label: r.name }))}
                  >
                    <SelectTrigger className="h-12 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                      <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select a role"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id} className="font-bold py-3">
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role_id && <p className="text-xs text-rose-500 font-bold ml-1">{errors.role_id.message}</p>}
                </div>
              </div>

              {/* Phone Number */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Label className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-3">
                  <Phone size={16} className="text-primary/70" />
                  Phone Number
                </Label>
                <div className="md:col-span-2 space-y-1.5">
                  <Controller
                    name="phone_number"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter phone number"
                      />
                    )}
                  />
                  {errors.phone_number && (
                    <p className="text-xs text-rose-500 font-bold ml-1">
                      {errors.phone_number.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Label className="text-sm font-semibold text-primary uppercase tracking-widest">
                  Profile Photo
                  <p className="text-[10px] lowercase text-primary/50 font-semibold mt-1 normal-case tracking-normal">Upload a clear face photo.</p>
                </Label>
                <div className="md:col-span-2">
                  <ImageUpload
                    value={watch('profile_image')}
                    previewUrl={userData?.profile_image_url}
                    onChange={(url) => setValue('profile_image', url)}
                    shape="rectangle"
                    className="max-w-xs"
                  />
                </div>
              </div>

              {/* Account Status */}
              <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Label className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-3">
                  <RefreshCcw size={16} className="text-primary/70" />
                  Account Status
                </Label>
                <div className="md:col-span-2">
                  <Select 
                    onValueChange={(val) => setValue('account_status', val ?? 'ACTIVE')} 
                    value={watch('account_status')}
                  >
                    <SelectTrigger className="h-12 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
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
            </div>
          </div>
        </motion.div>
      </form>
    </PageShell>
  );
}

export default function UserFormPage() {
  return (
    <Suspense fallback={
      <PageShell className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </PageShell>
    }>
      <UserForm />
    </Suspense>
  );
}
