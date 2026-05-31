'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { motion } from 'framer-motion';
import { Mail, Lock, RefreshCcw, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
            Email Address
          </Label>
          <div className="flex items-center w-full rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] focus-within:border-[#ff6b00] focus-within:ring-2 focus-within:ring-[#ff6b00]/10 transition-all overflow-hidden h-14 group">
            <div className="w-12 h-full flex items-center justify-center border-r border-gray-200/80 dark:border-white/10 text-gray-400 group-focus-within:text-[#ff6b00] transition-colors bg-gray-50/50 dark:bg-white/5 shrink-0">
              <Mail size={18} />
            </div>
            <input 
              id="email"
              type="email" 
              {...form.register('email')} 
              placeholder="Enter your email address" 
              className="flex-1 h-full px-4 bg-transparent border-0 outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400/80 placeholder:font-normal focus:ring-0 focus:outline-none"
            />
          </div>
          {form.formState.errors.email && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-red-500 mt-1 ml-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {form.formState.errors.email.message}
            </motion.p>
          )}
        </div>
        
        {/* Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
            Password
          </Label>
          <div className="flex items-center w-full rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] focus-within:border-[#ff6b00] focus-within:ring-2 focus-within:ring-[#ff6b00]/10 transition-all overflow-hidden h-14 group">
            <div className="w-12 h-full flex items-center justify-center border-r border-gray-200/80 dark:border-white/10 text-gray-400 group-focus-within:text-[#ff6b00] transition-colors bg-gray-50/50 dark:bg-white/5 shrink-0">
              <Lock size={18} />
            </div>
            <input 
              id="password"
              type={showPassword ? 'text' : 'password'} 
              {...form.register('password')} 
              placeholder="Enter your password"
              className="flex-1 h-full px-4 bg-transparent border-0 outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400/80 placeholder:font-normal focus:ring-0 focus:outline-none"
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

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between pt-0.5 ml-1">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-[#ff6b00] focus:ring-[#ff6b00] accent-[#ff6b00] cursor-pointer"
              defaultChecked
            />
            Remember me
          </label>
          <Link 
            href="/forgot-password" 
            className="text-xs font-semibold text-[#ff6b00] hover:text-[#ff5a00] transition-colors"
          >
            Reset Password?
          </Link>
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="relative w-full h-14 rounded-2xl font-bold text-base shadow-[0_10px_20px_-8px_rgba(255,107,0,0.3)] bg-gradient-to-r from-[#ff6b00] to-[#ff3b00] text-white hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mt-1.5 flex items-center justify-center cursor-pointer border-none" 
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <div className="flex items-center gap-2">
              <RefreshCcw className="animate-spin" size={18} />
              <span>Verifying...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Lock size={18} />
                <span>Sign In</span>
              </div>
              <ArrowRight className="absolute right-6 w-5 h-5" />
            </>
          )}
        </Button>
      </form>
      
      {/* Security & Badges Container */}
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-3 gap-1 py-2 px-3 rounded-[16px] bg-[#f0f6f2] dark:bg-[#121c15] border border-emerald-100/50 dark:border-emerald-950/20">
          <div className="flex items-center justify-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Strong Security
          </div>
          <div className="flex items-center justify-center gap-1 text-[9px] font-semibold text-[#ff6b00] border-x border-gray-200/60 dark:border-white/5">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            Data Protection
          </div>
          <div className="flex items-center justify-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Your Privacy
          </div>
        </div>

        {/* Redirect Footer Link */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-1">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#ff6b00] hover:text-[#ff5a00] font-semibold inline-flex items-center gap-0.5 group">
              Create Account
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">&gt;</span>
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
