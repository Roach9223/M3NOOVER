'use client';

import { motion } from 'framer-motion';
import { cn } from '@m3noover/shared';
import { ReactNode } from 'react';
import { staggerContainer, staggerItem, transitions } from '@/lib/animations';

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface FeatureListProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureList({ features, columns = 3, className }: FeatureListProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-100px' }}
      className={cn('grid grid-cols-1 gap-6 md:gap-8', gridCols[columns], className)}
    >
      {features.map((feature, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          transition={transitions.normal}
          className="flex flex-col items-start p-6 rounded-xl bg-charcoal-800/50 border border-charcoal-700/50"
        >
          <div className="w-12 h-12 mb-4 rounded-lg bg-accent-500/10 flex items-center justify-center text-accent-400">
            <div className="w-6 h-6">{feature.icon}</div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
