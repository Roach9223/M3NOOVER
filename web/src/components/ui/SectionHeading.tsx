'use client';

import { motion } from 'framer-motion';
import { cn } from '@m3noover/shared';
import { slideUp, transitions, viewport } from '@/lib/animations';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  alignment = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewport}
      className={cn(
        'mb-12 md:mb-16',
        alignment === 'center' && 'text-center',
        className
      )}
      data-testid="section-heading"
    >
      <motion.h2
        variants={slideUp}
        transition={transitions.normal}
        className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={slideUp}
          transition={{ ...transitions.normal, delay: 0.1 }}
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
