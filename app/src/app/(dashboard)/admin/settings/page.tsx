'use client';

import Link from 'next/link';
import { Button } from '@m3noover/ui';

interface SettingsCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const settingsCards: SettingsCard[] = [
  {
    title: 'Scheduling',
    description: 'Booking policies, cancellation notice, and time windows',
    href: '/admin/schedule/settings',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Session Types',
    description: 'Manage training session types and pricing',
    href: '/admin/schedule/session-types',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'Availability',
    description: 'Set weekly schedule and blocked dates',
    href: '/admin/schedule/availability',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Integrations',
    description: 'Connect Google Calendar and other services',
    href: '/admin/settings/integrations',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-neutral-400 mt-1">Configure your M3FIT dashboard</p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {settingsCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 hover:border-accent-500 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-charcoal-800 rounded-lg text-accent-500 group-hover:bg-accent-500/10 transition-colors">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-accent-500 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">
                    {card.description}
                  </p>
                </div>
                <svg className="w-5 h-5 text-neutral-600 group-hover:text-accent-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
