import type { Metadata } from 'next';
import { Button } from '@m3noover/ui';
import Link from 'next/link';
import { Hero, Section, Container, SectionHeading } from '@/components/ui';
import { CheckIcon, ArrowRightIcon } from '@/components/icons';
import { coachStory } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About Coach Chuck | M3NOOVER',
  description: 'Learn about Coach Chuck and the M3NOOVER training philosophy. Honesty over hype, effort over excuses, progress over perfection.',
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        title={
          <>
            Meet <span className="text-gradient-brand">Coach Chuck</span>
          </>
        }
        subtitle="5+ years of transforming athletes in Temecula, CA"
      />

      {/* Story Section */}
      <Section variant="dark" padding="lg">
        <Container size="md">
          <div className="prose prose-lg prose-invert mx-auto">
            <p className="text-xl text-neutral-300 leading-relaxed mb-8">
              {coachStory.intro}
            </p>

            <div className="my-12 p-8 rounded-2xl bg-charcoal-800 border border-charcoal-700">
              <h3 className="text-xl font-bold text-white mb-6">The Journey</h3>
              <ul className="space-y-4">
                {coachStory.journey.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-accent-500 mt-1 flex-shrink-0" />
                    <span className="text-neutral-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-lg text-neutral-300 leading-relaxed">
              {coachStory.clients}
            </p>
          </div>
        </Container>
      </Section>

      {/* Philosophy Section */}
      <Section padding="lg">
        <Container size="md">
          <SectionHeading
            title={coachStory.philosophy.title}
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {coachStory.philosophy.points.map((point) => (
              <div
                key={point}
                className="p-6 rounded-xl bg-charcoal-800/50 border border-charcoal-700/50 text-center"
              >
                <p className="text-xl font-bold text-accent-400">{point}</p>
              </div>
            ))}
          </div>

          <p className="text-lg text-neutral-300 text-center max-w-3xl mx-auto leading-relaxed">
            {coachStory.philosophy.description}
          </p>
        </Container>
      </Section>

      {/* Image Placeholder Section */}
      <Section variant="dark" padding="md">
        <Container>
          <div className="aspect-[21/9] rounded-2xl bg-gradient-to-br from-charcoal-700 to-charcoal-900 flex items-center justify-center">
            <span className="text-neutral-600">Training in Action - Image Placeholder</span>
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section padding="lg">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-neutral-300 mb-10">
              Take the first step toward becoming the athlete you know you can be.
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
