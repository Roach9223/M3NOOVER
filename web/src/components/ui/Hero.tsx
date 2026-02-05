'use client';

import { motion } from 'framer-motion';
import { cn } from '@m3noover/shared';
import { Button } from '@m3noover/ui';
import { ReactNode } from 'react';
import { Container } from './Container';
import { staggerContainer, staggerItem, transitions } from '@/lib/animations';
import Link from 'next/link';

interface HeroProps {
  title: string | ReactNode;
  subtitle?: string;
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
  fullHeight?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Hero({
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  fullHeight = false,
  className,
  children,
}: HeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden bg-black',
        fullHeight ? 'min-h-screen flex items-center' : 'pt-32 pb-20 md:pt-40 md:pb-28',
        className
      )}
      data-testid="hero"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/50 via-black to-black" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-500/15 rounded-full blur-[120px]"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-400/10 rounded-full blur-[100px]"
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <Container className="relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h1
            variants={staggerItem}
            transition={transitions.normal}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[0.95]"
            data-testid="hero-title"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              variants={staggerItem}
              transition={transitions.normal}
              className="mt-6 text-lg md:text-xl lg:text-2xl text-neutral-300 max-w-2xl mx-auto"
            >
              {subtitle}
            </motion.p>
          )}

          {(ctaPrimary || ctaSecondary) && (
            <motion.div
              variants={staggerItem}
              transition={transitions.normal}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              {ctaPrimary && (
                <Link href={ctaPrimary.href}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                    data-testid="hero-cta-primary"
                  >
                    {ctaPrimary.text}
                  </Button>
                </Link>
              )}
              {ctaSecondary && (
                <Link href={ctaSecondary.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                    data-testid="hero-cta-secondary"
                  >
                    {ctaSecondary.text}
                  </Button>
                </Link>
              )}
            </motion.div>
          )}

          {children && (
            <motion.div
              variants={staggerItem}
              transition={transitions.normal}
              className="mt-12"
            >
              {children}
            </motion.div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
