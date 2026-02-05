'use client';

import { motion } from 'framer-motion';
import { cn } from '@m3noover/shared';
import { Button } from '@m3noover/ui';
import Link from 'next/link';
import { CheckIcon } from '@/components/icons';
import { scaleIn, staggerItem, transitions } from '@/lib/animations';

interface ProgramCardProps {
  title: string;
  description: string;
  features: string[];
  href: string;
  ctaText?: string;
  slug: string;
  className?: string;
}

export function ProgramCard({
  title,
  description,
  features,
  href,
  ctaText = 'Get Started',
  slug,
  className,
}: ProgramCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      transition={transitions.normal}
      whileHover={{ scale: 1.02, y: -8 }}
      className={cn(
        'group flex flex-col h-full rounded-2xl bg-charcoal-800 border border-charcoal-700 overflow-hidden',
        'hover:border-accent-500/50 hover:shadow-xl hover:shadow-accent-500/10',
        'transition-shadow duration-300',
        className
      )}
      data-testid={`program-card-${slug}`}
    >
      {/* Image placeholder */}
      <div className="aspect-[16/10] bg-gradient-to-br from-charcoal-700 to-charcoal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-800 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
          <span className="text-sm">Image Placeholder</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-neutral-400 text-sm mb-4">{description}</p>

        {/* Features with stagger */}
        <ul className="space-y-2 mb-6 flex-1">
          {features.map((feature, index) => (
            <motion.li
              key={index}
              variants={staggerItem}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              transition={{ ...transitions.fast, delay: index * 0.05 }}
              className="flex items-start gap-2 text-sm text-neutral-300"
            >
              <CheckIcon className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <Link href={href} className="mt-auto">
          <Button variant="outline" size="md" className="w-full group-hover:border-accent-400 group-hover:text-accent-400 transition-colors">
            {ctaText}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
