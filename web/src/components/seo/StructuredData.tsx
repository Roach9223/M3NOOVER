import { brand } from '@m3noover/shared';
import { contactInfo } from '@/lib/constants';

const localBusinessData = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://m3noover.com/#organization',
  name: 'M3 Training - Coach Chuck',
  description:
    'Elite athletic training for youth and adults in the Temecula Valley. Located at Self Made Training Facility in Murrieta, CA.',
  url: 'https://m3noover.com',
  telephone: contactInfo.phone.tel,
  email: contactInfo.email,
  location: {
    '@type': 'Place',
    name: 'Self Made Training Facility Temecula Valley',
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
  },
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
  areaServed: [
    { '@type': 'City', name: 'Temecula' },
    { '@type': 'City', name: 'Murrieta' },
    { '@type': 'City', name: 'Menifee' },
    { '@type': 'City', name: 'Wildomar' },
    { '@type': 'City', name: 'Lake Elsinore' },
    { '@type': 'City', name: 'French Valley' },
    { '@type': 'City', name: 'Fallbrook' },
  ],
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
  priceRange: '$149-$699/month',
  image: 'https://m3noover.com/og-image.jpg',
  sameAs: [
    contactInfo.social.instagram,
    contactInfo.social.facebook,
    contactInfo.social.youtube,
  ],
};

const sportsActivityData = {
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
    streetAddress: contactInfo.location.address.street,
    addressLocality: contactInfo.location.address.city,
    addressRegion: contactInfo.location.address.state,
    postalCode: contactInfo.location.address.zip,
    addressCountry: contactInfo.location.address.country,
  },
  areaServed: 'Temecula Valley, CA',
};

const personalTrainerData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Coach Chuck',
  jobTitle: 'Athletic Trainer & Coach',
  worksFor: {
    '@type': 'Organization',
    name: 'M3 Training',
    url: 'https://m3noover.com',
  },
  workLocation: {
    '@type': 'Place',
    name: 'Self Made Training Facility Temecula Valley',
    address: {
      '@type': 'PostalAddress',
      streetAddress: contactInfo.location.address.street,
      addressLocality: contactInfo.location.address.city,
      addressRegion: contactInfo.location.address.state,
      postalCode: contactInfo.location.address.zip,
    },
  },
  knowsAbout: [
    'Athletic Training',
    'Youth Sports Performance',
    'Speed and Agility Training',
    'Strength and Conditioning',
  ],
};

const servicesData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '1-on-1 Athletic Training',
    description: 'Personalized one-on-one athletic training sessions',
    provider: { '@type': 'SportsActivityLocation', name: 'M3 Training' },
    areaServed: 'Temecula Valley, CA',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Youth Athletic Training',
    description: 'Age-appropriate training for student athletes ages 8-18',
    provider: { '@type': 'SportsActivityLocation', name: 'M3 Training' },
    areaServed: 'Temecula Valley, CA',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Small Group Training',
    description: 'Competitive training in groups of 3-5 athletes',
    provider: { '@type': 'SportsActivityLocation', name: 'M3 Training' },
    areaServed: 'Temecula Valley, CA',
  },
];

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

export function PersonalTrainerStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(personalTrainerData),
      }}
    />
  );
}

export function ServiceStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(servicesData),
      }}
    />
  );
}
