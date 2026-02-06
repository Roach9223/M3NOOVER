import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard',
};

// Helper to format currency
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// Helper to format date relative to now
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Helper to format past date
function formatPastDate(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Calculate age from date of birth
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

interface Athlete {
  id: string;
  name: string;
  date_of_birth: string | null;
  sports: string[];
  is_active: boolean;
}

interface UpcomingSession {
  id: string;
  start_time: string;
  status: string;
  athlete_name: string | null;
  session_type_name: string;
}

interface AthleteWithLastSession extends Athlete {
  last_session_date: string | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // Redirect admin users to admin dashboard
  if (profile?.role === 'admin') {
    redirect('/admin');
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Fetch parent's athletes
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, name, date_of_birth, sports, is_active')
    .eq('parent_id', user.id)
    .eq('is_active', true)
    .order('name');

  // Fetch upcoming sessions for this parent's athletes
  const { data: upcomingSessions } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      status,
      athletes(name),
      session_types(name)
    `)
    .eq('parent_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .gt('start_time', new Date().toISOString())
    .order('start_time')
    .limit(5);

  // Get last session for each athlete
  const athleteIds = athletes?.map(a => a.id) || [];
  let lastSessionMap: Record<string, string> = {};

  if (athleteIds.length > 0) {
    const { data: lastSessions } = await supabase
      .from('bookings')
      .select('athlete_id, start_time')
      .in('athlete_id', athleteIds)
      .eq('status', 'completed')
      .order('start_time', { ascending: false });

    // Get the most recent session per athlete
    if (lastSessions) {
      for (const session of lastSessions) {
        if (session.athlete_id && !lastSessionMap[session.athlete_id]) {
          lastSessionMap[session.athlete_id] = session.start_time;
        }
      }
    }
  }

  // Combine athletes with their last session
  const athletesWithLastSession: AthleteWithLastSession[] = (athletes || []).map(athlete => ({
    ...athlete,
    last_session_date: lastSessionMap[athlete.id] || null,
  }));

  // Format upcoming sessions
  const formattedSessions: UpcomingSession[] = (upcomingSessions || []).map((session: Record<string, unknown>) => ({
    id: session.id as string,
    start_time: session.start_time as string,
    status: session.status as string,
    athlete_name: (session.athletes as { name: string } | null)?.name || null,
    session_type_name: (session.session_types as { name: string } | null)?.name || 'Training Session',
  }));

  // Note: Outstanding balance would require an invoices table
  // For now, we'll show a placeholder or hide if no invoices system exists
  const outstandingBalance = 0; // TODO: Implement when invoices table is added

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Welcome back, {firstName}!
        </h1>
        <p className="text-neutral-400 mt-1">
          Here&apos;s your family&apos;s training overview
        </p>
      </div>

      {/* Outstanding Balance Card */}
      {outstandingBalance > 0 ? (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 font-medium uppercase tracking-wide">Outstanding Balance</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(outstandingBalance)}</p>
              <p className="text-sm text-neutral-400 mt-1">Due upon receipt</p>
            </div>
            <Link
              href="/billing"
              className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors"
            >
              Pay Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-medium uppercase tracking-wide">Account Status</p>
              <p className="text-lg font-semibold text-green-500">All clear! No balance due.</p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Upcoming Sessions</h2>
          <Link
            href="/schedule"
            className="text-sm text-accent-500 hover:text-accent-400 transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {formattedSessions.length > 0 ? (
            <>
              {formattedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white">
                      {session.athlete_name && `${session.athlete_name} - `}{session.session_type_name}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {formatRelativeDate(new Date(session.start_time))}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-accent-500/10 text-accent-500 rounded-full">
                    {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 bg-charcoal-800/50 rounded-lg border border-dashed border-charcoal-700">
              <p className="text-neutral-400">No upcoming sessions scheduled</p>
            </div>
          )}

          {/* Book Session CTA */}
          <Link
            href="/schedule"
            className="flex items-center justify-between p-4 bg-charcoal-800/50 rounded-lg border border-dashed border-charcoal-700 hover:border-accent-500/50 transition-colors group"
          >
            <div>
              <p className="font-medium text-neutral-400 group-hover:text-white transition-colors">
                Book a session
              </p>
              <p className="text-sm text-neutral-500">Schedule your next training</p>
            </div>
            <span className="px-4 py-2 text-sm font-medium text-accent-500 group-hover:bg-accent-500/10 rounded-lg transition-colors">
              Schedule
            </span>
          </Link>
        </div>
      </div>

      {/* My Athletes */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Athletes</h2>
          <Link
            href="/athletes"
            className="text-sm text-accent-500 hover:text-accent-400 transition-colors"
          >
            Manage
          </Link>
        </div>

        {athletesWithLastSession.length > 0 ? (
          <div className="space-y-4">
            {athletesWithLastSession.map((athlete) => (
              <div
                key={athlete.id}
                className="flex items-start justify-between p-4 bg-charcoal-800/50 rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-accent-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-500 font-semibold text-lg">
                      {athlete.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {athlete.name}
                      {athlete.date_of_birth && (
                        <span className="text-neutral-500 font-normal ml-2">
                          ({calculateAge(athlete.date_of_birth)})
                        </span>
                      )}
                    </p>
                    {athlete.sports && athlete.sports.length > 0 && (
                      <p className="text-sm text-neutral-400">
                        {athlete.sports.join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-neutral-500 mt-1">
                      {athlete.last_session_date
                        ? `Last session: ${formatPastDate(new Date(athlete.last_session_date))}`
                        : 'No sessions yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-charcoal-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-neutral-400 mb-4">No athletes added yet</p>
            <Link
              href="/athletes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Athlete
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
