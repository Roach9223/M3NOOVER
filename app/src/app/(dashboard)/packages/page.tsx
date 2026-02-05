import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PackageCard } from '@/components/billing/PackageCard';
import type { Package, Subscription } from '@/types/payment';

export const metadata = {
  title: 'Training Packages',
};

export default async function PackagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch packages
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('price_cents');

  // Fetch user's active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      package:packages(*)
    `)
    .eq('parent_id', user.id)
    .eq('status', 'active')
    .single();

  const recurringPackages = packages?.filter((p) => p.is_recurring) || [];
  const oneTimePackages = packages?.filter((p) => !p.is_recurring) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Training Packages</h1>
        <p className="text-neutral-400 mt-1">
          Choose a package that fits your training goals
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white">
              You&apos;re currently subscribed to <span className="font-semibold">{subscription.package?.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Monthly Packages */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recurringPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg as Package}
              isCurrentPlan={subscription?.package_id === pkg.id}
              hasActiveSubscription={!!subscription}
            />
          ))}
        </div>
      </div>

      {/* One-Time Options */}
      {oneTimePackages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Single Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {oneTimePackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg as Package}
                isCurrentPlan={false}
                hasActiveSubscription={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
