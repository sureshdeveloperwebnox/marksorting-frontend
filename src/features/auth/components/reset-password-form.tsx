'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Lock, RefreshCcw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/[^A-Za-z0-9]/, 'Include a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema) as any,
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        token,
        password: values.password,
      });
      toast.success('Password updated successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">Invalid Link</h3>
          <p className="text-gray-500 font-medium">This reset link is invalid or has expired.</p>
        </div>
        <Link href="/forgot-password" className="block text-sm text-[#ff6b00] hover:text-[#ff5a00] font-semibold">
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* New Secure Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
            New Secure Password
          </Label>
          <div className="flex items-center w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#18181b] focus-within:border-[#ff6b00] dark:focus-within:border-[#ff6b00] focus-within:ring-2 focus-within:ring-[#ff6b00]/15 transition-all overflow-hidden h-14 group shadow-sm">
            <div className="w-12 h-full flex items-center justify-center border-r border-gray-200/80 dark:border-white/10 text-gray-400 group-focus-within:text-[#ff6b00] transition-colors bg-gray-50/50 dark:bg-white/5 shrink-0">
              <Lock size={18} />
            </div>
            <input 
              id="password"
              type={showPassword ? 'text' : 'password'} 
              data-slot="bare-input"
              {...form.register('password')} 
              placeholder="Enter your new password"
              className="flex-1 h-full px-4 bg-transparent border-none outline-none ring-0 shadow-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400/80 placeholder:font-normal focus:ring-0 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="h-full px-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.formState.errors.password && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-red-500 mt-1 ml-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {form.formState.errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
            Confirm New Password
          </Label>
          <div className="flex items-center w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#18181b] focus-within:border-[#ff6b00] dark:focus-within:border-[#ff6b00] focus-within:ring-2 focus-within:ring-[#ff6b00]/15 transition-all overflow-hidden h-14 group shadow-sm">
            <div className="w-12 h-full flex items-center justify-center border-r border-gray-200/80 dark:border-white/10 text-gray-400 group-focus-within:text-[#ff6b00] transition-colors bg-gray-50/50 dark:bg-white/5 shrink-0">
              <Lock size={18} />
            </div>
            <input 
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'} 
              data-slot="bare-input"
              {...form.register('confirmPassword')} 
              placeholder="Confirm your new password"
              className="flex-1 h-full px-4 bg-transparent border-none outline-none ring-0 shadow-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400/80 placeholder:font-normal focus:ring-0 focus:outline-none"
            />
          </div>
          {form.formState.errors.confirmPassword && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-red-500 mt-1 ml-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {form.formState.errors.confirmPassword.message}
            </motion.p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="relative w-full h-14 rounded-2xl font-bold text-base shadow-[0_10px_20px_-8px_rgba(255,107,0,0.3)] bg-gradient-to-r from-[#ff6b00] to-[#ff3b00] text-white hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mt-2 flex items-center justify-center cursor-pointer border-none"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <div className="flex items-center gap-2">
              <RefreshCcw className="animate-spin" size={18} />
              <span>Updating...</span>
            </div>
          ) : (
            'Update Password'
          )}
        </Button>
      </form>
    </motion.div>
  );
}
