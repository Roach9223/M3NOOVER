import Link from 'next/link';
import { Button } from '@m3noover/ui';

export const metadata = {
  title: 'Payment Cancelled',
};

export default function PaymentCancelPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
        <p className="text-neutral-400 mb-8">
          Your payment was cancelled. No charges have been made.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/billing">
            <Button variant="primary">Try Again</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
