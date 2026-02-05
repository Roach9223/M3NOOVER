'use client';

interface ActivityItem {
  type: 'session_completed' | 'payment_received' | 'new_booking' | 'note_added';
  timestamp: string;
  description: string;
  entityId: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const activityIcons: Record<ActivityItem['type'], { icon: JSX.Element; color: string }> = {
  session_completed: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    color: 'text-green-400 bg-green-500/20',
  },
  payment_received: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    color: 'text-green-400 bg-green-500/20',
  },
  new_booking: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-accent-400 bg-accent-500/20',
  },
  note_added: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'text-blue-400 bg-blue-500/20',
  },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
          Recent Activity
        </h3>
        <p className="text-neutral-500 text-center py-4">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const { icon, color } = activityIcons[activity.type];
          return (
            <div
              key={`${activity.entityId}-${index}`}
              className="flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{activity.description}</p>
              </div>
              <p className="text-xs text-neutral-500 whitespace-nowrap">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
