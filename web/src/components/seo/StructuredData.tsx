import { brand } from '@m3noover/shared';

interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness';
  '@id': string;
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
  priceRange: string;
  image: string;
  sameAs: string[];
}

const localBusinessData: LocalBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://m3noover.com/#organization',
  name: brand.name.primary,
  description: brand.tagline,
  url: 'https://m3noover.com',
  telephone: '+1-951-555-0123', // Update with actual phone
  email: 'contact@m3noover.com', // Update with actual email
  address: {
    '@type': 'PostalAddress',
    streetAddress: '27499 Commerce Center Dr', // Update with actual address
    addressLocality: 'Temecula',
    addressRegion: 'CA',
    postalCode: '92590',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 33.4936,
    longitude: -117.1484,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '06:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: '08:00',
      closes: '14:00',
    },
  ],
  priceRange: '$$',
  image: 'https://m3noover.com/og-image.jpg', // Update with actual image
  sameAs: [
    'https://www.instagram.com/coach_m3noover',
    'https://www.facebook.com/m3noover',
  ],
};

interface SportsActivitySchema {
  '@context': 'https://schema.org';
  '@type': 'SportsActivityLocation';
  name: string;
  description: string;
  url: string;
  sport: string[];
  address: {
    '@type': 'PostalAddress';
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
}

const sportsActivityData: SportsActivitySchema = {
  '@context': 'https://schema.org',
  '@type': 'SportsActivityLocation',
  name: `${brand.name.primary} Athletic Training`,
  description:
    'Elite athletic training facility specializing in youth sports performance, speed training, strength conditioning, and mental performance coaching.',
  url: 'https://m3noover.com/programs',
  sport: [
    'Baseball',
    'Basketball',
    'Football',
    'Soccer',
    'Track and Field',
    'General Athletics',
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Temecula',
    addressRegion: 'CA',
    addressCountry: 'US',
  },
};

export function LocalBusinessStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(localBusinessData),
      }}
    />
  );
}

export function SportsActivityStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(sportsActivityData),
      }}
    />
  );
}

export function WebsiteStructuredData() {
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.name.primary,
    url: 'https://m3noover.com',
    description: brand.tagline,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://m3noover.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(websiteData),
      }}
    />
  );
}
