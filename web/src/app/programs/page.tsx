import type { Metadata } from 'next';
import { Button } from '@m3noover/ui';
import Link from 'next/link';
import { Hero, Section, Container, SectionHeading, ProgramCard } from '@/components/ui';
import { ArrowRightIcon } from '@/components/icons';
import { programs } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Training Programs | M3NOOVER',
  description: 'Explore our training programs: Youth Athletes, Small Group Training, 1-on-1 Personal Training, and Seasonal Camps.',
};

export default function ProgramsPage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        title={
          <>
            Our <span className="text-gradient-brand">Programs</span>
          </>
        }
        subtitle="Find the training program that fits your goals, schedule, and budget."
      />

      {/* Programs Grid */}
      <Section variant="dark" padding="lg">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {programs.map((program) => (
              <ProgramCard
                key={program.slug}
                slug={program.slug}
                title={program.title}
                description={program.description}
                features={program.features}
                imageSrc={program.imageSrc}
                imageAlt={program.imageAlt}
                href="/contact"
                ctaText="Get Started"
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Custom Programs Section */}
      <Section padding="lg">
        <Container size="md">
          <div className="text-center">
            <SectionHeading
              title="Need Something Different?"
              subtitle="We can create a custom training plan tailored to your specific sport, goals, or team."
            />

            <div className="p-8 rounded-2xl bg-charcoal-800 border border-charcoal-700">
              <h3 className="text-xl font-bold text-white mb-4">Custom Programs Include:</h3>
              <ul className="text-neutral-300 space-y-2 mb-8">
                <li>Team training sessions</li>
                <li>Sport-specific conditioning</li>
                <li>Competition prep packages</li>
                <li>Corporate wellness programs</li>
              </ul>
              <Link href="/contact">
                <Button variant="primary" size="lg">
                  Contact Us to Discuss
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ Teaser */}
      <Section variant="dark" padding="lg">
        <Container size="md">
          <SectionHeading
            title="Common Questions"
            alignment="center"
          />

          <div className="space-y-4">
            {[
              {
                q: 'What ages do you work with?',
                a: 'We train athletes from age 8 through adults. Our youth programs are specifically designed for different developmental stages.',
              },
              {
                q: 'Do I need to be in shape to start?',
                a: "Absolutely not. We meet you where you are and build from there. Every athlete starts somewhere.",
              },
              {
                q: 'How often should I train?',
                a: 'Most athletes see best results with 2-3 sessions per week, but we can customize based on your schedule and sport season.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-charcoal-800/50 border border-charcoal-700/50"
              >
                <h4 className="text-lg font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-neutral-400">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Have More Questions? Contact Us
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
