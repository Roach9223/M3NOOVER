'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TodayAtAGlance } from './TodayAtAGlance';
import { MetricsRow } from './MetricsRow';
import { ActivityFeed } from './ActivityFeed';
import { QuickActionsBar } from './QuickActionsBar';
import { QuickNoteModal } from './QuickNoteModal';
import type { SessionData } from './SessionRow';
import type { DashboardStats } from '@/app/api/admin/dashboard-stats/route';
import type { ActivityItem } from '@/app/api/admin/recent-activity/route';

interface AdminDashboardProps {
  initialSessions: SessionData[];
  initialStats: DashboardStats;
  initialActivities: ActivityItem[];
}

export function AdminDashboard({
  initialSessions,
  initialStats,
  initialActivities,
}: AdminDashboardProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteModalProps, setNoteModalProps] = useState<{
    bookingId?: string;
    athleteId?: string;
    athleteName?: string;
    sessionType?: string;
  }>({});

  const handleMarkComplete = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/scheduling/bookings/${sessionId}/complete`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to mark session complete');
      }

      // Update local state
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, status: 'completed' } : s
        )
      );

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleAddNoteFromSession = (session: SessionData) => {
    setNoteModalProps({
      bookingId: session.id,
      athleteId: undefined, // We'll need to pass this from the session data
      athleteName: session.athlete_name,
      sessionType: session.session_type_name || undefined,
    });
    setNoteModalOpen(true);
  };

  const handleAddNoteQuick = () => {
    setNoteModalProps({});
    setNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setNoteModalProps({});
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Today at a Glance */}
      <TodayAtAGlance
        sessions={sessions}
        onMarkComplete={handleMarkComplete}
        onAddNote={handleAddNoteFromSession}
      />

      {/* Quick Actions */}
      <QuickActionsBar onAddNote={handleAddNoteQuick} />

      {/* Key Metrics */}
      <MetricsRow
        revenueThisMonth={initialStats.revenueThisMonth}
        activeClients={initialStats.activeClients}
        sessionsThisWeek={initialStats.sessionsThisWeek}
        outstandingCount={initialStats.outstandingInvoices.count}
        outstandingAmount={initialStats.outstandingInvoices.totalCents}
      />

      {/* Recent Activity */}
      <ActivityFeed activities={initialActivities} />

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={noteModalOpen}
        onClose={handleCloseNoteModal}
        {...noteModalProps}
      />
    </div>
  );
}
