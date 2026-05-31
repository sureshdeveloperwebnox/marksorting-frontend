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
          <Card className="border-none shadow-none bg-transparent lg:bg-white/80 dark:lg:bg-[#121212]/80 lg:backdrop-blur-xl lg:rounded-[40px] overflow-hidden relative lg:border lg:border-white/20">
            <CardContent className="px-0 lg:px-10 pb-12 pt-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2.5">
                  <Label className="text-[13px] font-semibold uppercase tracking-[0.15em] text-gray-400 ml-1">
                    Registered Email
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
                
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(255,107,0,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCcw className="animate-spin" size={20} />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
              
              <div className="mt-10 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 font-bold hover:text-primary transition-colors">
                  <ArrowLeft size={16} />
                  <span>Back to Secure Sign In</span>
                </Link>
              </div>
            </CardContent>
          </Card>
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
            className="w-full h-14 rounded-2xl font-black border-2 border-gray-100 hover:bg-gray-50 transition-all"
            onClick={() => setIsSubmitted(false)}
          >
            Didn't receive email? Try again
          </Button>
          <Link href="/login" className="block text-sm text-primary font-black uppercase tracking-widest hover:underline underline-offset-8">
            Return to Login
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
