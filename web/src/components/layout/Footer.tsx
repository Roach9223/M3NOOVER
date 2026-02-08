import Link from 'next/link';
import { brand } from '@m3noover/shared';
import { InstagramIcon, FacebookIcon, YouTubeIcon, TwitterIcon } from '@/components/icons';
import { contactInfo } from '@/lib/constants';

const footerLinks = {
  quickLinks: [
    { label: 'Home', href: '/', external: false },
    { label: 'About', href: '/about', external: false },
    { label: 'Programs', href: '/programs', external: false },
    { label: 'Service Areas', href: '/areas', external: false },
    { label: 'Contact', href: '/contact', external: false },
    { label: 'Client Portal', href: 'https://m3noover.app', external: true },
  ],
  programs: [
    { label: 'Youth Athletes', href: '/programs#youth' },
    { label: 'Small Group', href: '/programs#group' },
    { label: 'Personal Training', href: '/programs#personal' },
    { label: 'Camps & Clinics', href: '/programs#camps' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

const socialLinks = [
  { label: 'Instagram', href: contactInfo.social.instagram, icon: InstagramIcon },
  { label: 'Facebook', href: contactInfo.social.facebook, icon: FacebookIcon },
  { label: 'YouTube', href: contactInfo.social.youtube, icon: YouTubeIcon },
];

export function Footer() {
  return (
    <footer className="bg-charcoal-900 border-t border-charcoal-800" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-3xl font-black text-accent-500"
              data-testid="footer-logo"
            >
              M3
            </Link>
            <p className="mt-4 text-sm text-neutral-400 max-w-xs">
              {brand.tagline}
            </p>
            {/* Social links */}
            <div className="mt-6 flex gap-4" data-testid="footer-social">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-charcoal-800 flex items-center justify-center text-neutral-400 hover:text-accent-400 hover:bg-charcoal-700 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3" data-testid="footer-links">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-neutral-400 hover:text-accent-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 hover:text-accent-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Programs
            </h3>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-accent-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h3>
            <address className="not-italic text-sm text-neutral-400 space-y-3">
              <p>
                <a
                  href={contactInfo.location.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-400 transition-colors"
                >
                  {contactInfo.location.name}<br />
                  {contactInfo.location.address.street}<br />
                  {contactInfo.location.address.city}, {contactInfo.location.address.state} {contactInfo.location.address.zip}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${contactInfo.phone.tel}`}
                  className="hover:text-accent-400 transition-colors"
                >
                  {contactInfo.phone.display}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-accent-400 transition-colors"
                >
                  {contactInfo.email}
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Service Area */}
        <div className="mt-12 pt-8 border-t border-charcoal-800">
          <p className="text-sm text-neutral-500 text-center mb-6">
            Located at Self Made Training Facility in Murrieta — Serving{' '}
            <Link href="/areas" className="hover:text-neutral-300 transition-colors">
              Temecula
            </Link>
            , Menifee, Wildomar, Lake Elsinore & surrounding areas
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-500" data-testid="footer-copyright">
            &copy; {new Date().getFullYear()} {brand.name.legal}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
