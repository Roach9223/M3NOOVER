import { AuthLayout, ForgotPasswordForm } from '@/components/auth';

export const metadata = {
  title: 'Forgot Password',
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to reset your password">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
