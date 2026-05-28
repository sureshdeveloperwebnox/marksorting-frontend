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
import { Mail, Lock, RefreshCcw, Eye, EyeOff } from 'lucide-react';
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
      initial={{ opacity: 1, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="border-none shadow-none bg-transparent lg:bg-white/80 dark:lg:bg-[#121212]/80 lg:backdrop-blur-xl lg:rounded-[40px] overflow-hidden relative lg:border lg:border-white/20">
        <CardContent className="px-0 lg:px-10 pb-12">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-[13px] font-black uppercase tracking-[0.15em] text-gray-400 ml-1">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <Input 
                  type="email" 
                  {...form.register('email')} 
                  placeholder="name@company.com" 
                  className="rounded-2xl bg-gray-50/50 dark:bg-white/5 border-none h-14 pl-12 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
              </div>
              {form.formState.errors.email && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-bold text-red-500 mt-1 ml-1 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                  {form.formState.errors.email.message}
                </motion.p>
              )}
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[13px] font-black uppercase tracking-[0.15em] text-gray-400">
                  Password
                </Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                >
                  Reset Password
                </Link>
              </div>
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
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-bold text-red-500 mt-1 ml-1 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                  {form.formState.errors.password.message}
                </motion.p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(255,107,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(255,107,0,0.4)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 mt-4" 
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw className="animate-spin" size={20} />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Secure Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 font-bold mb-6">
              Don't have an account? <Link href="/register" className="text-primary hover:underline underline-offset-4">Register Now</Link>
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px bg-gray-100 flex-1" />
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">System Assistance</span>
              <div className="h-px bg-gray-100 flex-1" />
            </div>
            <p className="text-sm text-gray-500 font-bold">
              Facing issues? <button className="text-primary hover:underline underline-offset-4">Connect with Support</button>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-10 flex items-center justify-center gap-6 opacity-40">
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Server Online</span>
        </div>
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">SSL Encrypted</span>
        </div>
      </div>
    </motion.div>
  );
}
