'use client';

import React, { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { RefreshCcw } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <AuthLayout 
      title="Create New Password" 
      subtitle="Ensure your new password is strong and secure"
    >
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <RefreshCcw className="animate-spin text-primary" size={40} />
          <p className="text-gray-500 font-bold animate-pulse">Initializing Secure Reset...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
