'use client';

import { motion } from 'framer-motion';
import { cn } from '@m3noover/shared';
import { ReactNode } from 'react';
import { scaleIn, transitions } from '@/lib/animations';

interface PillarCardProps {
  pillar: 'Mindset' | 'Movement' | 'Mastery';
  description: string;
  icon: ReactNode;
  className?: string;
}

export function PillarCard({ pillar, description, icon, className }: PillarCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      transition={transitions.normal}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        'group relative p-6 md:p-8 rounded-2xl bg-charcoal-800 border border-charcoal-700',
        'hover:border-accent-500/50 hover:shadow-lg hover:shadow-accent-500/10',
        'transition-colors duration-300',
        className
      )}
      data-testid={`pillar-card-${pillar.toLowerCase()}`}
    >
      {/* Icon */}
      <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center text-accent-400 group-hover:text-accent-300 transition-colors">
        <div className="w-7 h-7">{icon}</div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{pillar}</h3>

      {/* Description */}
      <p className="text-neutral-400 leading-relaxed">{description}</p>

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-accent-500 to-secondary-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </motion.div>
  );
}
