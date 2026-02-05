import { AuthLayout, RegisterForm } from '@/components/auth';

export const metadata = {
  title: 'Create Account',
};

export default function RegisterPage() {
  return (
    <AuthLayout title="Get Started" subtitle="Create your training account">
      <RegisterForm />
    </AuthLayout>
  );
}
