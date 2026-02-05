'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CloseIcon } from '@/components/icons';
import { Button } from '@m3noover/ui';

interface NavLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
}

const menuVariants = {
  closed: { x: '100%' },
  open: { x: 0 },
};

const linkVariants = {
  closed: { opacity: 0, x: 20 },
  open: { opacity: 1, x: 0 },
};

const staggerContainer = {
  open: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
  closed: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-charcoal-900 z-50 lg:hidden"
            data-testid="nav-mobile-menu"
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <motion.button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                aria-label="Close menu"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <CloseIcon className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Nav links with stagger */}
            <nav className="px-6 py-4">
              <motion.ul
                className="space-y-2"
                variants={staggerContainer}
                initial="closed"
                animate="open"
                exit="closed"
              >
                {links.map((link) => (
                  <motion.li key={link.href} variants={linkVariants}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block py-3 text-2xl font-semibold text-neutral-200 hover:text-accent-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              {/* CTA */}
              <motion.div
                className="mt-8 pt-8 border-t border-charcoal-700 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link href="/contact" onClick={onClose}>
                  <Button variant="primary" size="lg" className="w-full">
                    Get Started
                  </Button>
                </Link>
                <a
                  href="https://m3noover.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="block"
                >
                  <Button variant="outline" size="lg" className="w-full">
                    Client Portal
                  </Button>
                </a>
              </motion.div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
