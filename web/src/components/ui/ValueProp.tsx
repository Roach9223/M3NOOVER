'use client';

import { motion } from 'framer-motion';
import { cn } from '@m3noover/shared';
import { ReactNode } from 'react';
import { slideLeft, slideRight, transitions, viewport } from '@/lib/animations';

interface ValuePropProps {
  title: string;
  description: string;
  icon?: ReactNode;
  reversed?: boolean;
  className?: string;
}

export function ValueProp({
  title,
  description,
  icon,
  reversed = false,
  className,
}: ValuePropProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center',
        className
      )}
    >
      {/* Image/Icon placeholder */}
      <motion.div
        variants={reversed ? slideLeft : slideRight}
        initial="initial"
        whileInView="animate"
        viewport={viewport}
        transition={transitions.normal}
        className={cn(
          'aspect-square max-w-md mx-auto lg:max-w-none rounded-2xl bg-gradient-to-br from-charcoal-700 to-charcoal-900 flex items-center justify-center',
          reversed && 'lg:order-2'
        )}
      >
        {icon ? (
          <div className="w-24 h-24 text-accent-500/50">{icon}</div>
        ) : (
          <span className="text-neutral-600 text-sm">Image Placeholder</span>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        variants={reversed ? slideRight : slideLeft}
        initial="initial"
        whileInView="animate"
        viewport={viewport}
        transition={transitions.normal}
        className={cn(reversed && 'lg:order-1')}
      >
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h3>
        <p className="text-neutral-400 text-lg leading-relaxed">{description}</p>
      </motion.div>
    </div>
  );
}
