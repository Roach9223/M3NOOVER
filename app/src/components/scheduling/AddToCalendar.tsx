'use client';

import { useState } from 'react';
import { Button } from '@m3noover/ui';
import {
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadICSFile,
  createEventFromBooking,
} from '@/lib/calendar-links';

interface AddToCalendarProps {
  booking: {
    start_time: string;
    end_time: string;
    session_type?: { name: string } | null;
    notes?: string | null;
  };
  variant?: 'buttons' | 'dropdown';
  size?: 'sm' | 'md';
}

export function AddToCalendar({ booking, variant = 'dropdown', size = 'md' }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const event = createEventFromBooking(booking);
  const googleUrl = getGoogleCalendarUrl(event);
  const outlookUrl = getOutlookCalendarUrl(event);

  const handleICSDownload = () => {
    const sessionName = booking.session_type?.name || 'session';
    const filename = `m3fit-${sessionName.toLowerCase().replace(/\s+/g, '-')}.ics`;
    downloadICSFile(event, filename);
    setIsOpen(false);
  };

  const handleGoogleClick = () => {
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleOutlookClick = () => {
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonPadding = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2';

  // Buttons variant - shows all buttons inline
  if (variant === 'buttons') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleGoogleClick}
          className={`flex items-center gap-2 ${buttonPadding} bg-charcoal-800 hover:bg-charcoal-700 text-neutral-300 hover:text-white rounded-lg transition-colors`}
        >
          <GoogleIcon className={iconClass} />
          <span>Google</span>
        </button>
        <button
          onClick={handleICSDownload}
          className={`flex items-center gap-2 ${buttonPadding} bg-charcoal-800 hover:bg-charcoal-700 text-neutral-300 hover:text-white rounded-lg transition-colors`}
        >
          <AppleIcon className={iconClass} />
          <span>Apple</span>
        </button>
        <button
          onClick={handleOutlookClick}
          className={`flex items-center gap-2 ${buttonPadding} bg-charcoal-800 hover:bg-charcoal-700 text-neutral-300 hover:text-white rounded-lg transition-colors`}
        >
          <OutlookIcon className={iconClass} />
          <span>Outlook</span>
        </button>
      </div>
    );
  }

  // Dropdown variant - shows a button with dropdown menu
  return (
    <div className="relative">
      <Button
        variant="secondary"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <CalendarPlusIcon className={iconClass} />
        <span>Add to Calendar</span>
        <ChevronDownIcon className={`${iconClass} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-charcoal-800 border border-charcoal-700 rounded-xl shadow-xl z-20 overflow-hidden">
            <button
              onClick={handleGoogleClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-300 hover:text-white hover:bg-charcoal-700 transition-colors"
            >
              <GoogleIcon className="w-5 h-5" />
              <span>Google Calendar</span>
            </button>
            <button
              onClick={handleICSDownload}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-300 hover:text-white hover:bg-charcoal-700 transition-colors border-t border-charcoal-700"
            >
              <AppleIcon className="w-5 h-5" />
              <span>Apple Calendar</span>
            </button>
            <button
              onClick={handleOutlookClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-300 hover:text-white hover:bg-charcoal-700 transition-colors border-t border-charcoal-700"
            >
              <OutlookIcon className="w-5 h-5" />
              <span>Outlook</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Icon components
function CalendarPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.23-.578.23h-8.256v-6.182l1.215.994c.1.082.215.123.347.123.13 0 .246-.041.347-.123l6.885-5.631c.09-.065.151-.114.183-.15a.563.563 0 00.095-.315z" />
      <path fill="#0078D4" d="M24 5.387c0-.11-.025-.205-.076-.285-.05-.08-.11-.151-.183-.215l-.076-.053-7.13-4.692a.694.694 0 00-.347-.094.686.686 0 00-.347.094L8.928 4.671v8.818l6.885-5.631a.65.65 0 01.694 0l7.131 5.834c.152-.09.265-.22.34-.385a.563.563 0 00.095-.315l-.073-7.605z" />
      <path fill="#0078D4" d="M8.928 18.67h5.926V4.672H8.928v.001l-6.885 5.631a.65.65 0 01-.694 0L.04 9.178c-.152.09-.265.22-.34.385a.563.563 0 00-.095.315v10.478c0 .23.08.424.238.576.158.154.352.23.578.23h8.507V18.67z" />
      <path fill="#28A8EA" d="M9 10.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" />
      <path fill="#fff" d="M3.5 7.5a3 3 0 100 6 3 3 0 000-6zm0 1c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
    </svg>
  );
}
