import { brand } from '@m3noover/shared';
import { Button } from '@m3noover/ui';
import Link from 'next/link';
import {
  Hero,
  Section,
  Container,
  SectionHeading,
  PillarCard,
  ValueProp,
  TestimonialCard,
  InstagramFeed,
} from '@/components/ui';
import { MindsetIcon, MovementIcon, MasteryIcon, ArrowRightIcon } from '@/components/icons';
import { pillarDescriptions, whyM3Features, testimonials } from '@/lib/constants';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        title={
          <>
            Building Strong Bodies,
            <br />
            <span className="text-gradient-brand">Disciplined Minds</span>
          </>
        }
        subtitle={brand.pillarTagline}
        ctaPrimary={{ text: 'Start Training', href: '/contact' }}
        ctaSecondary={{ text: 'View Programs', href: '/programs' }}
        fullHeight
        backgroundImage="/images/hero-training.jpg"
      />

      {/* Pillars Section */}
      <Section variant="dark" padding="lg">
        <Container>
          <SectionHeading
            title="The Three Pillars"
            subtitle="Every athlete's journey is built on the same foundation. Master these, and you master yourself."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <PillarCard
              pillar="Mindset"
              description={pillarDescriptions.Mindset}
              icon={<MindsetIcon className="w-full h-full" />}
            />
            <PillarCard
              pillar="Movement"
              description={pillarDescriptions.Movement}
              icon={<MovementIcon className="w-full h-full" />}
            />
            <PillarCard
              pillar="Mastery"
              description={pillarDescriptions.Mastery}
              icon={<MasteryIcon className="w-full h-full" />}
            />
          </div>
        </Container>
      </Section>

      {/* Why M3 Section */}
      <Section padding="lg">
        <Container>
          <SectionHeading
            title="Why M3?"
            subtitle="What sets us apart from the rest"
          />

          <div className="space-y-16 md:space-y-24">
            {whyM3Features.map((feature, index) => (
              <ValueProp
                key={feature.title}
                title={feature.title}
                description={feature.description}
                imageSrc={feature.imageSrc}
                imageAlt={feature.imageAlt}
                reversed={index % 2 === 1}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Testimonials Section */}
      <Section variant="dark" padding="lg">
        <Container>
          <SectionHeading
            title="What Athletes Say"
            subtitle="Real results from real athletes"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.name}
                quote={testimonial.quote}
                name={testimonial.name}
                sport={testimonial.sport}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Instagram Section */}
      <Section padding="lg">
        <Container>
          <SectionHeading
            title="Follow the Journey"
            subtitle="Training highlights and athlete wins"
          />
          <InstagramFeed />
        </Container>
      </Section>

      {/* CTA Section */}
      <Section variant="gradient" padding="xl">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6">
              Ready to Transform?
            </h2>
            <p className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto">
              Join the athletes who chose to stop making excuses and start making progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                  Get Started Today
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  Meet Coach Chuck
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
