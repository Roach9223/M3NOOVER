import { brand } from '@m3noover/shared';
import { contactInfo } from '@/lib/constants';

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
  telephone: contactInfo.phone.tel,
  email: contactInfo.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: contactInfo.location.address.street,
    addressLocality: contactInfo.location.address.city,
    addressRegion: contactInfo.location.address.state,
    postalCode: contactInfo.location.address.zip,
    addressCountry: contactInfo.location.address.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: contactInfo.location.coordinates.latitude,
    longitude: contactInfo.location.coordinates.longitude,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: contactInfo.hours.weekdays.open,
      closes: contactInfo.hours.weekdays.close,
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: contactInfo.hours.saturday.open,
      closes: contactInfo.hours.saturday.close,
    },
  ],
  priceRange: '$$',
  image: 'https://m3noover.com/og-image.jpg',
  sameAs: [
    contactInfo.social.instagram,
    contactInfo.social.facebook,
    contactInfo.social.youtube,
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
    addressLocality: contactInfo.location.address.city,
    addressRegion: contactInfo.location.address.state,
    addressCountry: contactInfo.location.address.country,
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
