import { LoginForm } from '@/features/auth/components/login-form';
import { AuthLayout } from '@/features/auth/components/auth-layout';

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your dashboard to manage mill operations"
    >
      <LoginForm />
    </AuthLayout>
  );
}
