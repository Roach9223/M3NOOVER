import Link from 'next/link';
import { Button } from '@m3noover/ui';

export const metadata = {
  title: 'Payment Successful',
};

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-neutral-400 mb-8">
          Thank you for your payment. A receipt has been sent to your email.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/billing">
            <Button variant="primary">View Billing</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
