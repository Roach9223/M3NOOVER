'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminBottomNavProps {
  onAddNote: () => void;
}

const moreMenuItems = [
  { label: 'Athletes', href: '/admin/athletes' },
  { label: 'Invoices', href: '/admin/invoices' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
  { label: 'Settings', href: '/admin/settings' },
];

export function AdminBottomNav({ onAddNote }: AdminBottomNavProps) {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }

    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Schedule',
      href: '/admin/schedule',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Note',
      action: 'openQuickNote',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      isCenter: true,
    },
    {
      label: 'Clients',
      href: '/admin/clients',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'More',
      action: 'openMoreMenu',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
    },
  ];

  // Check if current path matches any "More" menu item
  const isMoreActive = moreMenuItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-charcoal-900 border-t border-charcoal-800 md:hidden">
      {/* More Menu Dropdown */}
      {moreMenuOpen && (
        <div
          ref={moreMenuRef}
          className="absolute bottom-16 right-2 w-48 bg-charcoal-800 border border-charcoal-700 rounded-xl shadow-xl overflow-hidden"
        >
          {moreMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-500/10 text-accent-500'
                    : 'text-neutral-300 hover:bg-charcoal-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          if (item.action === 'openQuickNote') {
            // Center "Note" button - larger and accent colored
            return (
              <button
                key={item.label}
                onClick={onAddNote}
                className="flex flex-col items-center justify-center -mt-4"
                aria-label={item.label}
              >
                <div className="w-14 h-14 bg-accent-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-accent-500/30">
                  {item.icon}
                </div>
                <span className="text-[10px] text-accent-400 mt-1 font-medium">
                  {item.label}
                </span>
              </button>
            );
          }

          if (item.action === 'openMoreMenu') {
            return (
              <button
                key={item.label}
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex flex-col items-center justify-center py-1 px-3 ${
                  moreMenuOpen || isMoreActive ? 'text-accent-500' : 'text-neutral-400'
                }`}
                aria-label={item.label}
                aria-expanded={moreMenuOpen}
              >
                {item.icon}
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </button>
            );
          }

          const isActive = item.href === pathname || (item.href && pathname.startsWith(item.href + '/'));

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`flex flex-col items-center justify-center py-1 px-3 ${
                isActive ? 'text-accent-500' : 'text-neutral-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
