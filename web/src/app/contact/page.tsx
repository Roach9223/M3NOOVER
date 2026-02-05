import type { Metadata } from 'next';
import Image from 'next/image';
import { Hero, Section, Container, ContactForm } from '@/components/ui';
import { LocationIcon, EmailIcon, PhoneIcon, InstagramIcon, FacebookIcon, YouTubeIcon } from '@/components/icons';
import { contactInfo } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact | M3NOOVER',
  description: 'Get in touch with Coach Chuck at M3NOOVER. Located at Self Made Training Facility in Temecula, CA.',
};

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        title={
          <>
            Get In <span className="text-gradient-brand">Touch</span>
          </>
        }
        subtitle="Ready to start your training journey? Send us a message and we'll get back to you within 24 hours."
      />

      {/* Contact Section */}
      <Section variant="dark" padding="lg">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
              <ContactForm />
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>

              <div className="space-y-6">
                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400 flex-shrink-0">
                    <LocationIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Training Location</h3>
                    <p className="text-neutral-400">
                      {contactInfo.location.name}<br />
                      {contactInfo.location.city}, {contactInfo.location.state}
                    </p>
                  </div>
                </div>

                {/* Email Placeholder */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400 flex-shrink-0">
                    <EmailIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Email</h3>
                    <p className="text-neutral-400">
                      <a href="mailto:coach@m3noover.com" className="hover:text-accent-400 transition-colors">
                        coach@m3noover.com
                      </a>
                    </p>
                  </div>
                </div>

                {/* Phone Placeholder */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400 flex-shrink-0">
                    <PhoneIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Phone</h3>
                    <p className="text-neutral-400">
                      <a href="tel:+15551234567" className="hover:text-accent-400 transition-colors">
                        (555) 123-4567
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-10">
                <h3 className="font-semibold text-white mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  {[
                    { icon: InstagramIcon, label: 'Instagram', href: 'https://instagram.com/coach_m3noover' },
                    { icon: FacebookIcon, label: 'Facebook', href: 'https://facebook.com' },
                    { icon: YouTubeIcon, label: 'YouTube', href: 'https://youtube.com' },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-lg bg-charcoal-800 flex items-center justify-center text-neutral-400 hover:text-accent-400 hover:bg-charcoal-700 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Facility Image */}
              <div className="mt-10">
                <div className="aspect-video rounded-xl overflow-hidden relative">
                  <Image
                    src="/images/contact-bg.jpg"
                    alt="Athletes at Self Made Training Facility"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Hours Section */}
      <Section padding="md">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Training Hours</h2>
            <div className="inline-grid grid-cols-2 gap-x-12 gap-y-2 text-left">
              <span className="text-neutral-400">Monday - Friday</span>
              <span className="text-white">6:00 AM - 8:00 PM</span>
              <span className="text-neutral-400">Saturday</span>
              <span className="text-white">8:00 AM - 4:00 PM</span>
              <span className="text-neutral-400">Sunday</span>
              <span className="text-white">By Appointment</span>
            </div>
            <p className="mt-6 text-sm text-neutral-500">
              * Hours may vary. Contact us to schedule a session.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
