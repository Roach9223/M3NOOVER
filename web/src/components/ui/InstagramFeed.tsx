'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { staggerContainer, staggerItem, transitions } from '@/lib/animations';
import { InstagramIcon } from '@/components/icons';

const instagramImages = [
  { src: '/images/instagram-1.jpg', alt: 'Coach Chuck coaching female athlete' },
  { src: '/images/instagram-2.jpg', alt: 'Athletes posing in facility' },
  { src: '/images/instagram-3.jpg', alt: 'Young athletes with tire' },
  { src: '/images/instagram-4.jpg', alt: 'Coach guiding athlete on equipment' },
  { src: '/images/instagram-5.jpg', alt: 'Group with multi-sport athletes' },
  { src: '/images/instagram-6.jpg', alt: 'Coach Chuck running with athlete' },
];

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
        {instagramImages.map((image, i) => (
          <motion.div
            key={i}
            variants={staggerItem}
            transition={transitions.normal}
            whileHover={{ scale: 1.05 }}
            className="aspect-square rounded-lg bg-gradient-to-br from-charcoal-700 to-charcoal-900 cursor-pointer overflow-hidden relative group"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/20 transition-colors flex items-center justify-center">
              <InstagramIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Follow link */}
      <motion.a
        href="https://instagram.com/coach_m3noover"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-accent-400 transition-colors"
        whileHover={{ scale: 1.05 }}
      >
        <InstagramIcon className="w-5 h-5" />
        <span className="font-medium">Follow @coach_m3noover</span>
      </motion.a>
    </div>
  );
}
