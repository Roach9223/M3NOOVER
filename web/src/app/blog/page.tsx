import type { Metadata } from 'next';
import { Button } from '@m3noover/ui';
import Link from 'next/link';
import { Hero, Section, Container } from '@/components/ui';
import { ArrowRightIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Training Tips & Insights | M3 Training Blog',
  description:
    'Athletic training tips, youth sports advice, and insights from Coach Chuck in Temecula, CA. Coming soon.',
};

export default function BlogPage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        title={
          <>
            Training <span className="text-gradient-brand">Blog</span>
          </>
        }
        subtitle="Tips, insights, and stories from Coach Chuck"
      />

      {/* Coming Soon Section */}
      <Section variant="dark" padding="lg">
        <Container size="md">
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-accent-500/10 flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Coming Soon
            </h2>
            <p className="text-lg text-neutral-400 mb-8 max-w-lg mx-auto">
              We're working on bringing you training tips, athlete spotlights, and insights from Coach Chuck. Check back soon.
            </p>
            <Link href="/contact">
              <Button variant="primary" size="lg">
                Get Notified When We Launch
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* What to Expect Section */}
      <Section padding="lg">
        <Container size="md">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            What to Expect
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Training Tips',
                description:
                  'Practical advice for athletes and parents on training, recovery, and performance.',
              },
              {
                title: 'Athlete Spotlights',
                description:
                  'Stories from M3 athletes on their journey to becoming stronger, faster, and more confident.',
              },
              {
                title: 'Coach Insights',
                description:
                  "Coach Chuck's perspective on youth sports, mental toughness, and athletic development.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-charcoal-800/50 border border-charcoal-700/50"
              >
                <h4 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h4>
                <p className="text-neutral-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
