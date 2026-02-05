'use client';

import { forwardRef, type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card component with M3NOOVER styling
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', children, className, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-colors';

    const variants = {
      default: 'bg-charcoal-800',
      elevated: 'bg-charcoal-800 shadow-lg shadow-black/50',
      outlined: 'bg-transparent border border-charcoal-600',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className ?? ''}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
