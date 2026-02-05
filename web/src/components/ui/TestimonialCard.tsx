'use client';

import { motion } from 'framer-motion';
import { cn } from '@m3noover/shared';
import { scaleIn, transitions } from '@/lib/animations';

interface TestimonialCardProps {
  quote: string;
  name: string;
  sport: string;
  className?: string;
}

export function TestimonialCard({ quote, name, sport, className }: TestimonialCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      transition={transitions.normal}
      className={cn(
        'p-6 md:p-8 rounded-2xl bg-charcoal-800 border border-charcoal-700',
        'hover:border-charcoal-600 transition-colors',
        className
      )}
    >
      {/* Quote icon */}
      <div className="text-accent-500/30 text-5xl font-serif leading-none mb-4">"</div>

      {/* Quote text */}
      <p className="text-neutral-300 text-lg leading-relaxed mb-6">
        {quote}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500/20 to-secondary-400/20 flex items-center justify-center">
          <span className="text-accent-400 font-bold text-sm">
            {name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-sm text-neutral-500">{sport}</p>
        </div>
      </div>
    </motion.div>
  );
}
