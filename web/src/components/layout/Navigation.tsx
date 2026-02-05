'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@m3noover/shared';
import { Button } from '@m3noover/ui';
import { MenuIcon } from '@/components/icons';
import { MobileMenu } from './MobileMenu';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Programs', href: '/programs' },
  { label: 'Parents', href: '/parents' },
  { label: 'Contact', href: '/contact' },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-charcoal-900/95 backdrop-blur-md border-b border-charcoal-800'
            : 'bg-transparent'
        )}
        data-testid="nav-header"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl md:text-3xl font-black tracking-tight text-accent-500 hover:text-accent-400 transition-colors"
              data-testid="nav-logo"
            >
              M3
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-accent-400'
                      : 'text-neutral-300 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3" data-testid="nav-cta">
              <a
                href="https://m3noover.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="md">
                  Client Portal
                </Button>
              </a>
              <Link href="/contact">
                <Button variant="primary" size="md">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-neutral-300 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
      />
    </>
  );
}
