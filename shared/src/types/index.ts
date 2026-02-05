/**
 * Shared TypeScript types for M3NOOVER
 */

// Re-export brand types
export type { BrandName, BrandPillar, AccentColor, BreakpointKey } from '../brand';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> =
  T extends (...args: unknown[]) => Promise<infer R> ? R : never;
