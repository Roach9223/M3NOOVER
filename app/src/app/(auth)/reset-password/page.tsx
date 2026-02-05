import { Suspense } from 'react';
import { AuthLayout, ResetPasswordForm } from '@/components/auth';

export const metadata = {
  title: 'Reset Password',
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new password">
      <Suspense fallback={<div className="text-center text-neutral-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
