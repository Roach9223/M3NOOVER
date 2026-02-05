import type { Metadata } from 'next';
import { Button } from '@m3noover/ui';
import Link from 'next/link';
import Image from 'next/image';
import { Hero, Section, Container, SectionHeading, FeatureList } from '@/components/ui';
import { CalendarIcon, ChatIcon, ShieldIcon, HeartIcon, ArrowRightIcon } from '@/components/icons';
import { parentFeatures } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'For Parents | M3NOOVER',
  description: 'Learn how M3NOOVER keeps your young athlete safe while building strength, discipline, and confidence.',
};

const featureIcons = [CalendarIcon, ChatIcon, HeartIcon, ShieldIcon];

export default function ParentsPage() {
  const featuresWithIcons = parentFeatures.map((feature, index) => ({
    ...feature,
    icon: <div className="w-full h-full">{featureIcons[index]({})}</div>,
  }));

  return (
    <>
      {/* Hero Section */}
      <Hero
        title={
          <>
            For <span className="text-gradient-brand">Parents</span>
          </>
        }
        subtitle="Your child's safety, growth, and success are our top priorities."
      />

      {/* Key Concerns Section */}
      <Section variant="dark" padding="lg">
        <Container>
          <SectionHeading
            title="What Parents Need to Know"
            subtitle="We understand your concerns. Here's how we address them."
          />

          <FeatureList features={featuresWithIcons} columns={2} />
        </Container>
      </Section>

      {/* Promise Section */}
      <Section padding="lg">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/parents-trust.jpg"
                alt="Coach Chuck overseeing athlete training on equipment"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="inline-block p-1 px-4 rounded-full bg-accent-500/10 text-accent-400 text-sm font-medium mb-6">
                Our Promise to You
              </div>

              <blockquote className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-8">
                &quot;Your child won&apos;t just get a workout —<br />
                <span className="text-gradient-brand">they&apos;ll get structure, discipline, and mentorship.&quot;</span>
              </blockquote>

              <p className="text-lg text-neutral-300 max-w-2xl mx-auto lg:mx-0">
                Coach Chuck treats every young athlete like family. High standards with real empathy means your child will be pushed to grow — but never pushed beyond what&apos;s safe and appropriate.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Process Section */}
      <Section variant="dark" padding="lg">
        <Container>
          <SectionHeading
            title="How It Works"
            subtitle="Getting started is simple"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Free Consultation',
                description: "We'll discuss your child's goals, current fitness level, and any concerns you have.",
              },
              {
                step: '02',
                title: 'Assessment & Plan',
                description: "Coach Chuck evaluates your athlete and creates a personalized training plan.",
              },
              {
                step: '03',
                title: 'Start Training',
                description: "Begin the journey with regular sessions, progress tracking, and ongoing communication.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-black text-charcoal-700 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-neutral-400">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Trust Indicators */}
      <Section padding="lg">
        <Container size="md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '5+', label: 'Years Experience' },
              { value: '500+', label: 'Athletes Trained' },
              { value: '100%', label: 'Safety Focused' },
              { value: '4.9', label: 'Parent Rating' },
            ].map((stat) => (
              <div key={stat.label} className="p-6 rounded-xl bg-charcoal-800/50">
                <div className="text-3xl md:text-4xl font-black text-accent-500 mb-1">{stat.value}</div>
                <div className="text-sm text-neutral-400">{stat.label}</div>
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
              Ready to Give Your Athlete an Edge?
            </h2>
            <p className="text-lg text-neutral-300 mb-10 max-w-xl mx-auto">
              Schedule a free consultation to discuss your child&apos;s goals and how M3NOOVER can help.
            </p>
            <Link href="/contact">
              <Button variant="primary" size="lg" className="px-8">
                Schedule Free Consultation
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
