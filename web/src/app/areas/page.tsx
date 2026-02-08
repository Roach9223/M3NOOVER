import type { Metadata } from 'next';
import { Button } from '@m3noover/ui';
import Link from 'next/link';
import { Hero, Section, Container, SectionHeading } from '@/components/ui';
import { ArrowRightIcon, LocationIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Athletic Training Near You | Temecula, Murrieta, Menifee & More',
  description:
    'M3 Training serves athletes throughout the Temecula Valley. Located at Self Made Training Facility in Murrieta, serving Temecula, Menifee, Wildomar, Lake Elsinore & more.',
};

const serviceAreas = [
  {
    city: 'Temecula',
    heading: 'Athletic Training in Temecula',
    description:
      "Temecula is the heart of our service area. Whether you're a student athlete at Chaparral, Great Oak, or Temecula Valley High School, Coach Chuck is ready to help you reach your potential. Just a short drive to Self Made Training Facility in Murrieta.",
    driveTime: '5-10 min drive',
    primary: true,
  },
  {
    city: 'Murrieta',
    heading: 'Athletic Training in Murrieta',
    description:
      "M3 Training is based at Self Made Training Facility on Madison Ave in Murrieta — right in the heart of the Temecula Valley. Murrieta families enjoy the most convenient access to Coach Chuck's programs.",
    driveTime: 'Home base',
    primary: true,
  },
  {
    city: 'Menifee',
    heading: 'Athletic Training in Menifee',
    description:
      "Menifee athletes are welcome at M3 Training. Whether you're at Heritage, Paloma Valley, or Menifee's newer high schools, we're just a quick drive down the 215. Build the strength and speed to compete at the next level.",
    driveTime: '~15 min drive',
    primary: false,
  },
  {
    city: 'Wildomar',
    heading: 'Athletic Training in Wildomar',
    description:
      "Wildomar families have easy access to elite athletic training at Self Made Training Facility. Elsinore High School athletes and youth sports participants — Coach Chuck is ready to help you level up.",
    driveTime: '~10 min drive',
    primary: false,
  },
  {
    city: 'Lake Elsinore',
    heading: 'Athletic Training in Lake Elsinore',
    description:
      "Lake Elsinore athletes looking for serious training have found their destination. Whether you're preparing for high school sports or looking to earn a college scholarship, the drive to Murrieta is worth it.",
    driveTime: '~20 min drive',
    primary: false,
  },
  {
    city: 'French Valley',
    heading: 'Athletic Training in French Valley',
    description:
      "French Valley is one of the fastest-growing communities in the Temecula Valley — and its young athletes deserve world-class training. Self Made Training Facility is just minutes away.",
    driveTime: '~10 min drive',
    primary: false,
  },
  {
    city: 'Fallbrook',
    heading: 'Athletic Training in Fallbrook',
    description:
      "Fallbrook athletes willing to make the drive will find a training experience unlike anything available locally. Coach Chuck works with dedicated athletes from across the region.",
    driveTime: '~25 min drive',
    primary: false,
  },
];

export default function AreasPage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        title={
          <>
            Serving Athletes Across the{' '}
            <span className="text-gradient-brand">Temecula Valley</span>
          </>
        }
        subtitle="Elite athletic training for youth and adults — from Temecula to Lake Elsinore and everywhere in between."
      />

      {/* Facility Callout */}
      <Section variant="dark" padding="md">
        <Container size="md">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-6 rounded-2xl bg-accent-500/10 border border-accent-500/20">
            <LocationIcon className="w-8 h-8 text-accent-400 flex-shrink-0" />
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold text-white">
                Located at Self Made Training Facility
              </p>
              <p className="text-neutral-400">
                25389 Madison Ave Suite C-101, Murrieta, CA 92562
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=25389+Madison+Ave+Suite+C-101+Murrieta+CA+92562"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:text-accent-300 font-medium whitespace-nowrap"
            >
              Get Directions →
            </a>
          </div>
        </Container>
      </Section>

      {/* Service Areas Grid */}
      <Section padding="lg">
        <Container>
          <SectionHeading
            title="Cities We Serve"
            subtitle="Coach Chuck trains athletes from across Southwest Riverside County and Northern San Diego County"
          />

          <div className="space-y-8">
            {serviceAreas.map((area) => (
              <div
                key={area.city}
                className={`p-6 md:p-8 rounded-2xl border ${
                  area.primary
                    ? 'bg-charcoal-800 border-accent-500/30'
                    : 'bg-charcoal-800/50 border-charcoal-700/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                      {area.heading}
                    </h2>
                    <p className="text-neutral-300 leading-relaxed">
                      {area.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 md:text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        area.primary
                          ? 'bg-accent-500/20 text-accent-400'
                          : 'bg-charcoal-700 text-neutral-400'
                      }`}
                    >
                      {area.driveTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section variant="gradient" padding="lg">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              Ready to Train?
            </h2>
            <p className="text-lg text-neutral-300 mb-10 max-w-xl mx-auto">
              No matter where you are in the Temecula Valley, elite athletic training is within reach. Contact Coach Chuck to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                  Contact Coach Chuck
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/programs">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  View Programs
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
