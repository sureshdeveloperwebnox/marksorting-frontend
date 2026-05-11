'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login', values);
      const { access_token, user } = response.data;
      setAuth(user, access_token);
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[440px]"
    >
      <div className="flex justify-center mb-8">
        <Logo className="scale-125" />
      </div>
      
      <Card className="border-none shadow-2xl bg-white dark:bg-[#1a1c1b] rounded-3xl overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="pt-8 pb-4 text-center">
          <CardTitle className="text-3xl font-black text-gray-900 dark:text-white">Welcome Back</CardTitle>
          <CardDescription className="text-gray-500 font-medium">Please enter your details to sign in</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                {...form.register('email')} 
                placeholder="admin@marksorting.com" 
                className="rounded-xl bg-gray-50 dark:bg-gray-900 border-none h-12 focus:ring-2 focus:ring-primary/20 transition-all px-4"
              />
              {form.formState.errors.email && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="password" className="text-xs font-bold uppercase tracking-wider text-gray-500">Password</Label>
                <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot password?</button>
              </div>
              <Input 
                id="password" 
                type="password" 
                {...form.register('password')} 
                className="rounded-xl bg-gray-50 dark:bg-gray-900 border-none h-12 focus:ring-2 focus:ring-primary/20 transition-all px-4"
              />
              {form.formState.errors.password && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Don't have an account? <button className="text-primary font-bold hover:underline">Contact Support</button>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center mt-8 text-xs text-gray-400 font-medium">
        &copy; 2024 Mark Sorting System. All rights reserved.
      </p>
    </motion.div>
  );
}
