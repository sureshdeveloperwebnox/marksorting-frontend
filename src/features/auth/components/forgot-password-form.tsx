'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCcw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      await api.post('/auth/forgot-password', values);
      setIsSubmitted(true);
      toast.success('Reset link sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isSubmitted ? (
        <motion.div
          key="form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full"
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">
                Registered Email
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
            
            <Button 
              type="submit" 
              className="relative w-full h-14 rounded-2xl font-bold text-base shadow-[0_10px_20px_-8px_rgba(255,107,0,0.3)] bg-gradient-to-r from-[#ff6b00] to-[#ff3b00] text-white hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mt-2 flex items-center justify-center cursor-pointer border-none"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw className="animate-spin" size={18} />
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-semibold hover:text-[#ff6b00] transition-colors">
              <ArrowLeft size={16} />
              <span>Back to Secure Sign In</span>
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <CheckCircle2 size={40} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Check Your Inbox</h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              We've sent a secure recovery link to <br />
              <span className="text-gray-900 dark:text-white font-bold">{form.getValues('email')}</span>
            </p>
          </div>
          <Button 
            variant="outline"
            className="w-full h-14 rounded-2xl font-bold border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-700 dark:text-gray-300"
            onClick={() => setIsSubmitted(false)}
          >
            Didn't receive email? Try again
          </Button>
          <Link href="/login" className="block text-sm text-[#ff6b00] hover:text-[#ff5a00] font-semibold">
            Return to Login
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
