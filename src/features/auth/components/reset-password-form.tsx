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
    resolver: zodResolver(resetPasswordSchema),
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
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">Invalid Link</h3>
          <p className="text-gray-500 font-medium">This reset link is invalid or has expired.</p>
        </div>
        <Link href="/forgot-password" className="block text-primary font-black uppercase tracking-widest hover:underline underline-offset-8">
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
      <Card className="border-none shadow-none bg-transparent lg:bg-white/80 dark:lg:bg-[#121212]/80 lg:backdrop-blur-xl lg:rounded-[40px] overflow-hidden relative lg:border lg:border-white/20">
        <CardContent className="px-0 lg:px-10 pb-12 pt-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-[13px] font-semibold uppercase tracking-[0.15em] text-gray-400 ml-1">
                New Secure Password
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  {...form.register('password')} 
                  placeholder="••••••••"
                  className="rounded-2xl bg-gray-50/50 dark:bg-white/5 border-none h-14 pl-12 pr-12 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label className="text-[13px] font-semibold uppercase tracking-[0.15em] text-gray-400 ml-1">
                Confirm New Password
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  {...form.register('confirmPassword')} 
                  placeholder="••••••••"
                  className="rounded-2xl bg-gray-50/50 dark:bg-white/5 border-none h-14 pl-12 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(255,107,0,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw className="animate-spin" size={20} />
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
