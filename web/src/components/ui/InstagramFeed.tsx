'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, transitions } from '@/lib/animations';
import { InstagramIcon } from '@/components/icons';

export function InstagramFeed() {
  return (
    <div className="text-center">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 mb-6"
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            variants={staggerItem}
            transition={transitions.normal}
            whileHover={{ scale: 1.05 }}
            className="aspect-square rounded-lg bg-gradient-to-br from-charcoal-700 to-charcoal-900 cursor-pointer overflow-hidden relative group"
          >
            {/* Placeholder content */}
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
              <span className="text-xs">Image {i}</span>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/20 transition-colors flex items-center justify-center">
              <InstagramIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Follow link */}
      <motion.a
        href="https://instagram.com/m3noover"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-accent-400 transition-colors"
        whileHover={{ scale: 1.05 }}
      >
        <InstagramIcon className="w-5 h-5" />
        <span className="font-medium">Follow @m3noover</span>
      </motion.a>
    </div>
  );
}
