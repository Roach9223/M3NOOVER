/**
 * M3NOOVER Brand Constants
 * Central source of truth for all brand-related values
 */

export const brand = {
  name: {
    primary: 'M3NOOVER',
    alternate: 'M3FIT',
    legal: 'M3NOOVER LLC',
  },
  tagline: 'Building Strong Bodies, Disciplined Minds, and Confident Athletes.',
  pillars: ['Mindset', 'Movement', 'Mastery'] as const,
  pillarTagline: 'Mindset. Movement. Mastery.',
} as const;

/**
 * Color Palette
 * Dark athletic theme with electric blue accent
 * Premium, bold, and modern
 */
export const colors = {
  // Core blacks and charcoals
  black: '#0A0A0A',
  charcoal: {
    900: '#121212',
    800: '#1A1A1A',
    700: '#242424',
    600: '#2E2E2E',
    500: '#3D3D3D',
  },

  // Primary accent - Electric Blue
  accent: {
    DEFAULT: '#00D4FF',
    50: '#E6FBFF',
    100: '#B3F3FF',
    200: '#80EBFF',
    300: '#4DE3FF',
    400: '#1ADBFF',
    500: '#00D4FF',
    600: '#00A8CC',
    700: '#007D99',
    800: '#005266',
    900: '#002733',
  },

  // Secondary accent - Bold Orange (for CTAs and highlights)
  secondary: {
    DEFAULT: '#FF6B35',
    50: '#FFF0EB',
    100: '#FFD9CC',
    200: '#FFB399',
    300: '#FF8C66',
    400: '#FF6B35',
    500: '#E55A2B',
    600: '#CC4A22',
    700: '#993718',
    800: '#66250F',
    900: '#331207',
  },

  // Neutrals for text and UI
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

/**
 * Typography
 * Bold sans-serif for headings, clean sans for body
 */
export const typography = {
  fonts: {
    heading: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, monospace',
  },

  // Font weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Font sizes (in rem)
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
  },
} as const;

/**
 * Spacing scale (in rem)
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
} as const;

/**
 * Animation/Motion defaults for Framer Motion
 */
export const motion = {
  transition: {
    fast: { duration: 0.15 },
    normal: { duration: 0.3 },
    slow: { duration: 0.5 },
    spring: { type: 'spring', stiffness: 300, damping: 30 },
  },
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  },
} as const;

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Type exports
export type BrandName = typeof brand.name;
export type BrandPillar = (typeof brand.pillars)[number];
export type AccentColor = keyof typeof colors.accent;
export type BreakpointKey = keyof typeof breakpoints;
