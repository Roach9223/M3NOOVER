import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { brand } from '@m3noover/shared';
import { Navigation, Footer } from '@/components/layout';
import {
  LocalBusinessStructuredData,
  SportsActivityStructuredData,
  WebsiteStructuredData,
  PersonalTrainerStructuredData,
  ServiceStructuredData,
} from '@/components/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://m3noover.com'),
  title: {
    default: 'M3 Training | Athletic Training in Temecula, CA',
    template: '%s | M3 Training Temecula',
  },
  description:
    'Elite athletic training in Temecula, CA. Coach Chuck offers 1-on-1, small group, and youth sports training. Serving Temecula, Murrieta, Menifee & surrounding areas.',
  keywords: [
    'athletic trainer temecula',
    'sports training temecula',
    'youth athletic training temecula',
    'personal trainer temecula',
    'speed and agility training temecula',
    'athletic trainer murrieta',
    'sports training murrieta',
    'youth sports training menifee',
    'high school athlete training',
  ],
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
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'M3 Training - Athletic Training in Temecula',
      },
    ],
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
        <PersonalTrainerStructuredData />
        <ServiceStructuredData />
      </head>
      <body className="bg-black text-neutral-100 antialiased">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
