'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { motion } from 'framer-motion';
import { Mail, Lock, User, RefreshCcw, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/[^A-Za-z0-9]/, 'Include a special character'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register, isRegistering } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    register(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="border-none shadow-none bg-transparent lg:bg-white/80 dark:lg:bg-[#121212]/80 lg:backdrop-blur-xl lg:rounded-[40px] overflow-hidden relative lg:border lg:border-white/20">
        <CardContent className="px-0 lg:px-10 pb-12">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px] font-black uppercase tracking-[0.15em] text-gray-400 ml-1">
                Full Name
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <Input 
                  {...form.register('full_name')} 
                  placeholder="John Doe" 
                  className="rounded-2xl bg-gray-50/50 dark:bg-white/5 border-none h-14 pl-12 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
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
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-[13px] font-black uppercase tracking-[0.15em] text-gray-400 ml-1">
                Secure Password
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
            
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(255,107,0,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 mt-6" 
              disabled={isRegistering}
            >
              {isRegistering ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw className="animate-spin" size={20} />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Create My Account</span>
                  <ArrowRight size={20} />
                </div>
              )}
            </Button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 font-bold">
              Already have an account? <Link href="/login" className="text-primary hover:underline underline-offset-4">Sign In Instead</Link>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center mt-10 text-xs text-gray-400 font-black uppercase tracking-widest">
        &copy; 2024 Mark Sorting System. Advanced Sorting Solutions.
      </p>
    </motion.div>
  );
}
