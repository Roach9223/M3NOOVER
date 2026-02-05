import { cn } from '@m3noover/shared';
import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'darker' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  id?: string;
}

const variantClasses = {
  default: 'bg-black',
  dark: 'bg-charcoal-900',
  darker: 'bg-charcoal-800',
  gradient: 'bg-gradient-to-b from-black via-charcoal-900 to-black',
};

const paddingClasses = {
  none: '',
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-24',
  lg: 'py-24 md:py-32',
  xl: 'py-32 md:py-40',
};

export function Section({
  children,
  className,
  variant = 'default',
  padding = 'md',
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(variantClasses[variant], paddingClasses[padding], className)}
    >
      {children}
    </section>
  );
}
