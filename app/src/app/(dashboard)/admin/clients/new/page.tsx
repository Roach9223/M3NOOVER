import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientOnboardingWizard } from '@/components/admin/ClientOnboardingWizard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Add Client',
};

interface PackageOption {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  sessions_per_week?: number;
}

async function getPackages(supabase: Awaited<ReturnType<typeof createClient>>): Promise<PackageOption[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, description, price_cents, sessions_per_week')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  if (error) {
    console.error('Error fetching packages:', error);
    // Return default packages if table doesn't exist or is empty
    return [
      {
        id: 'foundation',
        name: 'M3 Foundation',
        description: '2 sessions per week',
        price_cents: 30000,
        sessions_per_week: 2,
      },
      {
        id: 'competitor',
        name: 'M3 Competitor',
        description: '4 sessions per week',
        price_cents: 50000,
        sessions_per_week: 4,
      },
      {
        id: 'elite',
        name: 'M3 Elite',
        description: 'Unlimited sessions',
        price_cents: 75000,
      },
    ];
  }

  return data || [];
}

export default async function NewClientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const packages = await getPackages(supabase);

  return (
    <div className="pb-20 md:pb-0">
      {/* Back link */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Clients
      </Link>

      <ClientOnboardingWizard packages={packages} />
    </div>
  );
}
