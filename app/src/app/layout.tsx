import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { brand } from '@m3noover/shared';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: `${brand.name.primary} | Client Portal`,
    template: `%s | ${brand.name.primary}`,
  },
  description: 'Your personal training dashboard - Track your progress, schedule sessions, and achieve your goals.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: brand.name.primary,
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/apple-touch-icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-black text-neutral-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
