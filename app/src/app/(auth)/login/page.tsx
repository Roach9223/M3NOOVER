import { Suspense } from 'react';
import { AuthLayout, LoginForm } from '@/components/auth';

export const metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <Suspense fallback={<div className="text-center text-neutral-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
