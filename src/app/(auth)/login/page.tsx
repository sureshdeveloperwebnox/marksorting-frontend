import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';
import { AuthLayout } from '@/features/auth/components/auth-layout';

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your dashboard to manage mill operations"
    >
      <Suspense fallback={<div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">Loading Login Form...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
