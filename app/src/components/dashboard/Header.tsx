'use client';

import { UserMenu } from './UserMenu';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  onMenuClick?: () => void;
}

export function Header({ userName, userEmail, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-charcoal-900 border-b border-charcoal-800 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-neutral-400 hover:text-white"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User menu */}
      <UserMenu userName={userName} userEmail={userEmail} />
    </header>
  );
}
