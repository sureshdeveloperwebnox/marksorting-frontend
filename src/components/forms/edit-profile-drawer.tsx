'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Mail, Phone, User as UserIcon, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ImageUpload } from '@/components/common/image-upload';

const COUNTRY_MAX_LENGTHS: Record<string, number> = {
  IN: 10, // India
  US: 10, // United States
  CA: 10, // Canada
  GB: 10, // United Kingdom
  AU: 9,  // Australia
  SG: 8,  // Singapore
  AE: 9,  // United Arab Emirates
  SA: 9,  // Saudi Arabia
  QA: 8,  // Qatar
  KW: 8,  // Kuwait
  BH: 8,  // Bahrain
  MY: 10, // Malaysia
  ID: 12, // Indonesia
  PH: 10, // Philippines
  TH: 9,  // Thailand
  VN: 9,  // Vietnam
  JP: 10, // Japan
  KR: 10, // South Korea
  CN: 11, // China
  HK: 8,  // Hong Kong
  LK: 9,  // Sri Lanka
  NP: 10, // Nepal
  BD: 10, // Bangladesh
  PK: 10, // Pakistan
};

const validatePhoneLength = (phone: string) => {
  if (!phone) return true;
  
  try {
    const parsed = parsePhoneNumberFromString(phone);
    if (parsed && parsed.country) {
      const maxLen = COUNTRY_MAX_LENGTHS[parsed.country] || 15;
      if (parsed.nationalNumber && parsed.nationalNumber.length > maxLen) {
        return false;
      }
    }
    return isValidPhoneNumber(phone);
  } catch (e) {
    return false;
  }
};

const profileSchema = z.object({
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
      (val) => !val || validatePhoneLength(val),
      { message: 'Please enter a valid phone number with correct length for your country' }
    ),
  profile_image: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDrawer({ open, onOpenChange }: EditProfileDrawerProps) {
  const user = useAuthStore((state) => state.user);
  const { updateProfile, isUpdatingProfile } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone_number: '',
      profile_image: '',
    }
  });

  React.useEffect(() => {
    if (open && user) {
      let phone = (user as any).phone_number || '';
      // Only add + if missing, don't assume specific country code
      if (phone && !phone.startsWith('+')) {
        phone = `+${phone}`;
      }

      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        password: '',
        phone_number: phone,
        profile_image: user.profile_image || '',
      });
    }
  }, [open, user, reset]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
      // Clean up values
      const payload: any = {
        full_name: data.full_name,
        email: data.email,
        profile_image: data.profile_image || '',
      };

      if (data.phone_number) {
        payload.phone_number = data.phone_number;
      } else {
        payload.phone_number = '';
      }

      if (data.password) {
        payload.password = data.password;
      }

      await updateProfile(payload);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by mutation onError toast
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <UserIcon size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">Edit Profile</SheetTitle>
              <SheetDescription>Update your personal account information.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24">
          <form id="profile-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Profile Photo */}
            <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-gray-100 dark:border-white/5">
              <Label className="text-xs font-semibold text-primary uppercase tracking-widest">Profile Photo</Label>
              <ImageUpload
                value={watch('profile_image')}
                previewUrl={user?.profile_image_url}
                onChange={(url) => setValue('profile_image', url)}
                shape="circle"
                className="w-28 h-28"
              />
            </div>

            <div className="space-y-4">
              {/* Full Name */}
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

              {/* Email Address */}
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

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Lock size={14} className="text-primary/70" />
                  New Password
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

              {/* Phone Number */}
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
            </div>
          </form>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl h-11 font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="profile-edit-form"
              disabled={isUpdatingProfile}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              Save Changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
