import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Athlete';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Welcome back, {firstName}!
        </h1>
        <p className="text-neutral-400 mt-1">
          Here&apos;s your training overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sessions This Week"
          value={3}
          subtitle="2 remaining"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Total Workouts"
          value={24}
          trend={{ value: 12, isPositive: true }}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          title="Current Streak"
          value="7 days"
          subtitle="Keep it up!"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
        />
        <StatCard
          title="Goals Achieved"
          value="3/5"
          subtitle="This month"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upcoming Sessions</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg">
            <div>
              <p className="font-medium text-white">Speed & Agility Training</p>
              <p className="text-sm text-neutral-400">Tomorrow, 4:00 PM</p>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-accent-500/10 text-accent-500 rounded-full">
              Confirmed
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg">
            <div>
              <p className="font-medium text-white">Strength Foundation</p>
              <p className="text-sm text-neutral-400">Thursday, 5:30 PM</p>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-accent-500/10 text-accent-500 rounded-full">
              Confirmed
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg border border-dashed border-charcoal-700">
            <div>
              <p className="font-medium text-neutral-400">No more sessions scheduled</p>
              <p className="text-sm text-neutral-500">Book your next session</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-accent-500 hover:bg-accent-500/10 rounded-lg transition-colors">
              Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-charcoal-900 border border-charcoal-800 rounded-xl text-left hover:border-accent-500/50 transition-colors group">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent-500/20 transition-colors">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="font-medium text-white">Book Session</p>
          <p className="text-sm text-neutral-500">Schedule your next workout</p>
        </button>
        <button className="p-4 bg-charcoal-900 border border-charcoal-800 rounded-xl text-left hover:border-accent-500/50 transition-colors group">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent-500/20 transition-colors">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="font-medium text-white">View Progress</p>
          <p className="text-sm text-neutral-500">Track your improvements</p>
        </button>
        <button className="p-4 bg-charcoal-900 border border-charcoal-800 rounded-xl text-left hover:border-accent-500/50 transition-colors group">
          <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent-500/20 transition-colors">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="font-medium text-white">Message Coach</p>
          <p className="text-sm text-neutral-500">Get in touch with Coach Chuck</p>
        </button>
      </div>
    </div>
  );
}
