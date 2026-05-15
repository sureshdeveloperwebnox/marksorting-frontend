'use client';

import { RegisterForm } from '@/features/auth/components/register-form';
import { AuthLayout } from '@/features/auth/components/auth-layout';

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join the world's most advanced sorting ecosystem"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
