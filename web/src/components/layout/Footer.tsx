import Link from 'next/link';
import { brand } from '@m3noover/shared';
import { InstagramIcon, FacebookIcon, YouTubeIcon, TwitterIcon } from '@/components/icons';

const footerLinks = {
  quickLinks: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Programs', href: '/programs' },
    { label: 'Contact', href: '/contact' },
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
  { label: 'Instagram', href: 'https://instagram.com/coach_m3noover', icon: InstagramIcon },
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'YouTube', href: 'https://youtube.com', icon: YouTubeIcon },
  { label: 'Twitter', href: 'https://twitter.com', icon: TwitterIcon },
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
              Training Location
            </h3>
            <address className="not-italic text-sm text-neutral-400 space-y-2">
              <p>Self Made Training Facility</p>
              <p>Temecula, CA</p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-charcoal-800 flex flex-col md:flex-row justify-between items-center gap-4">
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
