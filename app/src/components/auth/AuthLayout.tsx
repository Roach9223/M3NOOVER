'use client';

import { brand } from '@m3noover/shared';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-black">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-accent-500 tracking-tight">
          {brand.name.primary}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">{brand.pillarTagline}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-charcoal-900 rounded-2xl p-8 border border-charcoal-800">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="text-neutral-400 mt-2">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
