import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { brand } from '@m3noover/shared';
import { Navigation, Footer } from '@/components/layout';
import {
  LocalBusinessStructuredData,
  SportsActivityStructuredData,
  WebsiteStructuredData,
} from '@/components/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: `${brand.name.primary} | ${brand.pillarTagline}`,
    template: `%s | ${brand.name.primary}`,
  },
  description: brand.tagline,
  keywords: ['athletic training', 'youth sports', 'personal training', 'Temecula', 'fitness coaching'],
  authors: [{ name: 'M3NOOVER' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: brand.name.primary,
    description: brand.tagline,
    url: 'https://m3noover.com',
    siteName: brand.name.primary,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.name.primary,
    description: brand.tagline,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <LocalBusinessStructuredData />
        <SportsActivityStructuredData />
        <WebsiteStructuredData />
      </head>
      <body className="bg-black text-neutral-100 antialiased">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
