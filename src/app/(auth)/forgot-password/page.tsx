'use client';

import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { AuthLayout } from '@/features/auth/components/auth-layout';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter your email to receive a secure recovery link"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
