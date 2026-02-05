import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StatCard } from '@/components/dashboard';

export const metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminPage() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Admin Dashboard
        </h1>
        <p className="text-neutral-400 mt-1">
          Manage athletes and sessions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Athletes"
          value={12}
          trend={{ value: 8, isPositive: true }}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Sessions This Week"
          value={18}
          subtitle="3 today"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Active Programs"
          value={4}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          title="Revenue (Month)"
          value="$4,250"
          trend={{ value: 15, isPositive: true }}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Today's Schedule */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Today&apos;s Schedule</h2>
          <button className="text-sm text-accent-500 hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center text-accent-500 font-semibold">
                JM
              </div>
              <div>
                <p className="font-medium text-white">Jake Martinez</p>
                <p className="text-sm text-neutral-400">Speed & Agility Training</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">4:00 PM</p>
              <p className="text-sm text-neutral-400">60 min</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary-500/20 rounded-full flex items-center justify-center text-secondary-500 font-semibold">
                SK
              </div>
              <div>
                <p className="font-medium text-white">Sarah Kim</p>
                <p className="text-sm text-neutral-400">Strength Foundation</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">5:30 PM</p>
              <p className="text-sm text-neutral-400">45 min</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-semibold">
                MT
              </div>
              <div>
                <p className="font-medium text-white">Marcus Thompson</p>
                <p className="text-sm text-neutral-400">Athletic Performance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">7:00 PM</p>
              <p className="text-sm text-neutral-400">60 min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="p-4 bg-charcoal-900 border border-charcoal-800 rounded-xl text-left hover:border-accent-500/50 transition-colors group">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent-500/20 transition-colors">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="font-medium text-white">Add New Athlete</p>
          <p className="text-sm text-neutral-500">Register a new client</p>
        </button>
        <button className="p-4 bg-charcoal-900 border border-charcoal-800 rounded-xl text-left hover:border-accent-500/50 transition-colors group">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent-500/20 transition-colors">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="font-medium text-white">Schedule Session</p>
          <p className="text-sm text-neutral-500">Create a new training session</p>
        </button>
      </div>
    </div>
  );
}
